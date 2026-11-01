import { describe, expect, it } from "vitest";
import { avcCodec, countSamples, firstMoofOffset } from "./gapless-loop";

function box(type: string, payload: Uint8Array): Uint8Array {
  const out = new Uint8Array(8 + payload.length);
  new DataView(out.buffer).setUint32(0, out.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(payload, 8);
  return out;
}
function trun(sampleCount: number): Uint8Array {
  const payload = new Uint8Array(8);
  new DataView(payload.buffer).setUint32(4, sampleCount);
  return box("trun", payload);
}
function concat(...parts: Uint8Array[]): ArrayBuffer {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out.buffer;
}

describe("gapless loop mp4 helpers", () => {
  it("counts samples across every moof/traf/trun", () => {
    const file = concat(box("ftyp", new Uint8Array(4)), box("moof", box("traf", concat2(trun(100), trun(21)))), box("mdat", new Uint8Array(3)));
    expect(countSamples(file)).toBe(121);
  });

  it("splits the header from the media at the first moof box", () => {
    const ftyp = box("ftyp", new Uint8Array(4));
    const moov = box("moov", new Uint8Array(6));
    const file = concat(ftyp, moov, box("moof", trun(3)), box("mdat", new Uint8Array(2)));
    expect(firstMoofOffset(file)).toBe(ftyp.length + moov.length);
    expect(firstMoofOffset(concat(ftyp, moov))).toBe(-1);
  });

  it("reads the avc1 codec string from the avcC box", () => {
    const avcc = box("avcC", new Uint8Array([1, 0x64, 0x00, 0x1f, 0xff]));
    expect(avcCodec(concat(box("moov", avcc)))).toBe("avc1.64001f");
    expect(avcCodec(concat(box("moov", new Uint8Array(4))))).toBeNull();
  });
});

function concat2(...parts: Uint8Array[]): Uint8Array {
  return new Uint8Array(concat(...parts));
}
