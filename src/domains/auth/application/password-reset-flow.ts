import type { ResetChallenge, ResetGrant } from "../domain/password-reset";

// Posisi user di flow Forgot Password, disimpan di sessionStorage (bukan URL) supaya refresh di
// langkah 2/3 tidak mengeluarkan user, token tidak tercatat di history, dan menutup tab = mulai lagi.
export interface ResetFlow {
  email: string;
  challenge?: ResetChallenge; // langkah 2
  grant?: ResetGrant; // langkah 3
}

const KEY = "tynext-ems.password-reset.v1";

function store(): Storage | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}

export function readResetFlow(storage: Storage | null = store()): ResetFlow | null {
  try {
    const raw = storage?.getItem(KEY);
    const flow = raw ? (JSON.parse(raw) as ResetFlow) : null;
    return flow && typeof flow.email === "string" ? flow : null;
  } catch {
    return null;
  }
}

export function writeResetFlow(flow: ResetFlow, storage: Storage | null = store()) {
  try {
    storage?.setItem(KEY, JSON.stringify(flow));
  } catch {
    /* flow hanya hidup sampai refresh */
  }
}

export function clearResetFlow(storage: Storage | null = store()) {
  try {
    storage?.removeItem(KEY);
  } catch {
    /* abaikan */
  }
}
