// Pengulangan video tanpa jeda lewat Media Source Extensions: bagian media (moof+mdat) dari file
// fragmented MP4 yang sama ditempelkan terus ke satu SourceBuffer sehingga dekoder melihat satu aliran
// yang tidak pernah putus (tidak ada seek kembali ke awal seperti pada atribut `loop`). Header file
// (ftyp+moov) hanya ditempelkan sekali: header yang diulang membuat dekoder di-reset dan tampak sebagai
// frame hitam. Frame terakhir klip sama dengan frame pertama, jadi tiap salinan berikutnya digeser satu
// frame lebih awal supaya frame duplikat itu tertimpa.

function boxType(dv: DataView, at: number): string {
  return String.fromCharCode(dv.getUint8(at), dv.getUint8(at + 1), dv.getUint8(at + 2), dv.getUint8(at + 3));
}

// Jumlah sample (frame) di semua fragmen: moof → traf → trun.sample_count.
export function countSamples(buf: ArrayBuffer): number {
  const dv = new DataView(buf);
  let total = 0;
  const walk = (start: number, end: number) => {
    let p = start;
    while (p + 8 <= end) {
      let size = dv.getUint32(p);
      const type = boxType(dv, p + 4);
      let header = 8;
      if (size === 1) {
        size = Number(dv.getBigUint64(p + 8));
        header = 16;
      } else if (size === 0) size = end - p;
      if (size < header) break;
      if (type === "moof" || type === "traf") walk(p + header, p + size);
      else if (type === "trun") total += dv.getUint32(p + header + 4);
      p += size;
    }
  };
  walk(0, buf.byteLength);
  return total;
}

// String codec RFC 6381 dari kotak avcC (profile, compatibility, level), mis. "avc1.64001f".
export function avcCodec(buf: ArrayBuffer): string | null {
  const bytes = new Uint8Array(buf, 0, Math.min(buf.byteLength, 1 << 20));
  for (let i = 0; i + 8 < bytes.length; i++) {
    if (bytes[i] === 0x61 && bytes[i + 1] === 0x76 && bytes[i + 2] === 0x63 && bytes[i + 3] === 0x43) {
      const hex = (n: number) => n.toString(16).padStart(2, "0");
      return `avc1.${hex(bytes[i + 5])}${hex(bytes[i + 6])}${hex(bytes[i + 7])}`;
    }
  }
  return null;
}

// Posisi kotak moof pertama: sebelumnya header (init segment), sesudahnya media.
export function firstMoofOffset(buf: ArrayBuffer): number {
  const dv = new DataView(buf);
  let p = 0;
  while (p + 8 <= buf.byteLength) {
    let size = dv.getUint32(p);
    const type = boxType(dv, p + 4);
    if (type === "moof") return p;
    if (size === 1) size = Number(dv.getBigUint64(p + 8));
    else if (size === 0) size = buf.byteLength - p;
    if (size < 8) break;
    p += size;
  }
  return -1;
}

export function supportsGaplessLoop(): boolean {
  return typeof MediaSource !== "undefined" && typeof MediaSource.isTypeSupported === "function";
}

const AHEAD_COPIES = 1.5; // selalu ada ≥ 1,5 panjang klip yang sudah ter-buffer di depan posisi putar
const BEHIND_COPIES = 2; // buang buffer yang sudah lewat lebih dari 2 panjang klip

export async function startGaplessLoop(video: HTMLVideoElement, url: string, signal: AbortSignal): Promise<void> {
  const bytes = await (await fetch(url, { signal })).arrayBuffer();
  const codec = avcCodec(bytes);
  const frames = countSamples(bytes);
  const split = firstMoofOffset(bytes);
  const mime = codec ? `video/mp4; codecs="${codec}"` : "";
  if (!codec || frames < 2 || split <= 0 || !MediaSource.isTypeSupported(mime)) throw new Error("File is not suitable for MSE");
  const initSegment = bytes.slice(0, split);
  const mediaSegment = bytes.slice(split);

  const source = new MediaSource();
  const objectUrl = URL.createObjectURL(source);
  video.src = objectUrl;
  await new Promise<void>((resolve, reject) => {
    source.addEventListener("sourceopen", () => resolve(), { once: true });
    signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
  });
  const buffer = source.addSourceBuffer(mime);
  buffer.mode = "segments";

  const append = (chunk: ArrayBuffer) =>
    new Promise<void>((resolve, reject) => {
      const done = () => {
        buffer.removeEventListener("error", fail);
        resolve();
      };
      const fail = () => {
        buffer.removeEventListener("updateend", done);
        reject(new Error("appendBuffer failed"));
      };
      buffer.addEventListener("updateend", done, { once: true });
      buffer.addEventListener("error", fail, { once: true });
      buffer.appendBuffer(chunk);
    });
  const remove = (start: number, end: number) =>
    new Promise<void>((resolve) => {
      buffer.addEventListener("updateend", () => resolve(), { once: true });
      buffer.remove(start, end);
    });

  await append(initSegment);
  await append(mediaSegment);
  const segmentStart = buffer.buffered.start(0);
  const segmentDuration = buffer.buffered.end(0) - segmentStart;
  // Salinan ke-k mulai di k × (durasi − satu frame): frame terakhir salinan sebelumnya tertimpa frame pertama.
  const step = segmentDuration * ((frames - 1) / frames);
  let copies = 1;
  const appendNext = async () => {
    buffer.timestampOffset = copies * step;
    await append(mediaSegment);
    copies += 1;
  };
  await appendNext();
  if (segmentStart > 0) video.currentTime = segmentStart;

  let busy = false;
  const topUp = async () => {
    if (busy || signal.aborted || buffer.updating || buffer.buffered.length === 0) return;
    busy = true;
    try {
      const end = buffer.buffered.end(buffer.buffered.length - 1);
      if (end - video.currentTime < AHEAD_COPIES * segmentDuration) await appendNext();
      const start = buffer.buffered.start(0);
      if (video.currentTime - start > BEHIND_COPIES * segmentDuration) await remove(start, video.currentTime - segmentDuration);
    } finally {
      busy = false;
    }
  };
  video.addEventListener("timeupdate", topUp);
  signal.addEventListener(
    "abort",
    () => {
      video.removeEventListener("timeupdate", topUp);
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      video.load();
    },
    { once: true },
  );
  await video.play().catch(() => {
    /* autoplay ditolak: frame pertama tetap jadi latar */
  });
}
