import { useLayoutEffect, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "tynext-ems.theme";
const THEME_COLOR: Record<Theme, string> = { light: "#f3f4f6", dark: "#141516" };
const listeners = new Set<() => void>();
let current: Theme = "light";

function read(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function apply(theme: Theme) {
  current = theme;
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[theme]);
}

// Dipanggil sekali sebelum render pertama supaya tidak berkedip dari tema bawaan.
export function applyStoredTheme() {
  apply(read());
}

export function setTheme(theme: Theme) {
  apply(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* preferensi hanya hidup di sesi ini */
  }
  for (const l of listeners) l();
}

export function getTheme(): Theme {
  return current;
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    getTheme,
    () => "light",
  );
}

// Halaman yang desainnya hanya terang (login, forgot password) memaksa tema terang selama
// terpasang, tanpa mengubah preferensi yang tersimpan; saat dilepas tema tersimpan dipakai lagi.
export function useForcedTheme(theme: Theme) {
  useLayoutEffect(() => {
    apply(theme);
    for (const l of listeners) l();
    return () => {
      apply(read());
      for (const l of listeners) l();
    };
  }, [theme]);
}
