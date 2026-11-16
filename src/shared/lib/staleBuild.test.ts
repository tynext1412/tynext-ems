import { describe, expect, it, vi } from "vitest";
import { isStaleBuildError, reloadForNewBuild } from "./staleBuild";

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, v),
  };
}

describe("stale build reload", () => {
  it("recognises chunk load failures from Chrome, Firefox and Safari", () => {
    expect(isStaleBuildError(new TypeError("Failed to fetch dynamically imported module: https://ems.tynext.co.id/assets/OverviewCharts-BSLil_Ve.js"))).toBe(true);
    expect(isStaleBuildError(new TypeError("error loading dynamically imported module: https://x/assets/a.js"))).toBe(true);
    expect(isStaleBuildError(new TypeError("Importing a module script failed."))).toBe(true);
    expect(isStaleBuildError(new Error("Cannot read properties of undefined"))).toBe(false);
    expect(isStaleBuildError("Failed to fetch dynamically imported module")).toBe(false);
  });

  it("reloads once, then lets the error through while the guard is active", () => {
    const storage = memoryStorage();
    const reload = vi.fn();
    expect(reloadForNewBuild(storage, reload, 1_000_000)).toBe(true);
    expect(reloadForNewBuild(storage, reload, 1_010_000)).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
    // A later deploy may reload again.
    expect(reloadForNewBuild(storage, reload, 1_100_000)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("never reloads without session storage (no marker = possible loop)", () => {
    const reload = vi.fn();
    expect(reloadForNewBuild(undefined, reload)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
