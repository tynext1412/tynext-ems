import { describe, expect, it } from "vitest";
import { frameAspectRatio, isEmbeddableUrl, resolveScadaUrl } from "./scada-embed";

describe("scada embed", () => {
  it("substitutes the plant id placeholder, URL-encoded", () => {
    const embed = { provider: "FUXA", url: "https://scada.example.com/view/{plantId}?theme=dark", allowFullscreen: true };
    expect(resolveScadaUrl(embed, "PLT-001")).toBe("https://scada.example.com/view/PLT-001?theme=dark");
    expect(resolveScadaUrl(embed, "a b")).toBe("https://scada.example.com/view/a%20b?theme=dark");
  });

  it("leaves URLs without a placeholder untouched", () => {
    expect(resolveScadaUrl({ provider: "x", url: "/scada-placeholder.html", allowFullscreen: false }, "PLT-9")).toBe("/scada-placeholder.html");
  });

  it("accepts only http(s) or app-relative paths", () => {
    expect(isEmbeddableUrl("https://scada.example.com/")).toBe(true);
    expect(isEmbeddableUrl("http://192.168.10.21:8088/view")).toBe(true);
    expect(isEmbeddableUrl("/scada-placeholder.html?plant=PLT-001")).toBe(true);
    expect(isEmbeddableUrl("javascript:alert(1)")).toBe(false);
    expect(isEmbeddableUrl("//evil.example")).toBe(false);
    expect(isEmbeddableUrl("not a url")).toBe(false);
  });

  it("keeps the frame proportional only for a sane aspect ratio", () => {
    const base = { provider: "FUXA", url: "https://x.example/scada/", allowFullscreen: true };
    expect(frameAspectRatio({ ...base, aspectRatio: 1280 / 860 })).toBeCloseTo(1.488, 3);
    expect(frameAspectRatio(base)).toBeUndefined();
    expect(frameAspectRatio({ ...base, aspectRatio: 9 })).toBeUndefined();
    expect(frameAspectRatio({ ...base, aspectRatio: Number.NaN })).toBeUndefined();
  });
});
