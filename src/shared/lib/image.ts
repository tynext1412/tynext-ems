export interface CompressedImage {
  name: string;
  dataUrl: string;
}

const MAX_EDGE_PX = 1280;
const JPEG_QUALITY = 0.8;

// Perkecil foto di browser sebelum disimpan/dikirim: sisi terpanjang ≤ 1280 px, JPEG 80 %.
// Foto dokumentasi lapangan dari ponsel biasanya 3–6 MB; hasilnya ±150–300 KB.
export async function compressImage(file: File, maxEdgePx = MAX_EDGE_PX, quality = JPEG_QUALITY): Promise<CompressedImage> {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} bukan berkas gambar`);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`${file.name} tidak bisa dibaca sebagai gambar`);
  }
  const scale = Math.min(1, maxEdgePx / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia di browser ini");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return { name: file.name, dataUrl: canvas.toDataURL("image/jpeg", quality) };
}
