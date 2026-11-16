// Setelah deploy baru, tab yang masih membuka versi lama meminta chunk dengan hash lama yang sudah tidak ada
// ("Failed to fetch dynamically imported module"). Halaman dimuat ulang sekali supaya index.html terbaru terambil.

const KEY = "tynext:stale-build-reload";
// Bila chunk tetap gagal dalam rentang ini setelah reload, anggap rusak sungguhan dan tampilkan error (tanpa loop).
const GUARD_MS = 30_000;

const CHUNK_ERROR = /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS/i;

export function isStaleBuildError(e: unknown): boolean {
  return e instanceof Error && CHUNK_ERROR.test(e.message);
}

function session(): Storage | undefined {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

// true = halaman sedang dimuat ulang. false = sudah dicoba barusan, atau sessionStorage tidak tersedia
// (tanpa penanda, reload bisa berulang terus).
export function reloadForNewBuild(storage: Storage | undefined = session(), reload = () => window.location.reload(), now = Date.now()): boolean {
  try {
    if (!storage || now - Number(storage.getItem(KEY) ?? 0) < GUARD_MS) return false;
    storage.setItem(KEY, String(now));
  } catch {
    return false;
  }
  reload();
  return true;
}

// Vite memancarkan vite:preloadError saat import dinamis (React.lazy) gagal dimuat.
export function installStaleBuildReload() {
  window.addEventListener("vite:preloadError", (event) => {
    if (reloadForNewBuild()) event.preventDefault();
  });
}
