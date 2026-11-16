// Aturan Forgot Password (PRD Figma, 5 Nov 2026): kode 6 digit dikirim ke email, berlaku
// 10 menit dan sekali pakai; Resend aktif setelah 60 detik; terkunci setelah 5 kali salah;
// kode yang lolos ditukar reset token yang berlaku 15 menit untuk menyimpan password baru.
export const RESET_CODE_LENGTH = 6;
export const RESET_CODE_TTL_MS = 10 * 60_000;
export const RESEND_COOLDOWN_MS = 60_000;
export const MAX_CODE_ATTEMPTS = 5;
export const RESET_TOKEN_TTL_MS = 15 * 60_000;

// Kode terkirim. Waktu dari server, supaya hitungan mundur tidak mulai ulang saat halaman di-refresh.
export interface ResetChallenge {
  email: string;
  expiresAt: string; // ISO
  resendAvailableAt: string; // ISO
}

// Izin membuka langkah Set a New Password setelah kode terverifikasi.
export interface ResetGrant {
  token: string;
  expiresAt: string; // ISO
}

// Enam kotak kode kosong ("" = belum diisi).
export function emptyCode(): string[] {
  return Array.from({ length: RESET_CODE_LENGTH }, () => "");
}

// Hanya angka, maksimal 6 digit (untuk paste "482 917" atau "482-917").
export function sanitizeCode(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, RESET_CODE_LENGTH);
}

// Sisa waktu dibulatkan ke bawah seperti Figma (baru terkirim = "0:59"); negatif dianggap 0.
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function isPast(iso: string, now: number): boolean {
  return Date.parse(iso) <= now;
}
