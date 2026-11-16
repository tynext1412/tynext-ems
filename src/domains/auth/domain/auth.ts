export type UserRole = "ADMIN" | "OPERATOR" | "VIEWER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Session {
  user: User;
  issuedAt: string; // ISO
}

export interface Credentials {
  email: string;
  password: string;
}

export type CredentialErrors = Partial<Record<keyof Credentials, string>>;

export const PASSWORD_MIN_LENGTH = 6;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Teks galat mengikuti copywriting Figma (Authentication · Login & Forgot Password).
export const EMAIL_REQUIRED = "Enter your email address.";
export const EMAIL_INVALID = "Enter a valid email, like name@company.com.";
export const PASSWORD_REQUIRED = "Enter your password.";
export const PASSWORD_HINT = `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
export const PASSWORDS_DIFFER = "Passwords don't match";

// Spasi di awal dan akhir email dihapus otomatis.
export function normalizeEmail(email: string): string {
  return email.trim();
}

export function validateEmail(email: string): string | undefined {
  const value = normalizeEmail(email);
  if (!value) return EMAIL_REQUIRED;
  if (!EMAIL.test(value)) return EMAIL_INVALID;
  return undefined;
}

// Login hanya memeriksa isian wajib dan format email; password yang salah (termasuk terlalu
// pendek) dijawab server dengan "Incorrect email or password".
export function validateCredentials(c: Credentials): CredentialErrors {
  const errors: CredentialErrors = {};
  const email = validateEmail(c.email);
  if (email) errors.email = email;
  if (!c.password) errors.password = PASSWORD_REQUIRED;
  return errors;
}

export interface NewPasswordErrors {
  password?: boolean; // teks bantuan PASSWORD_HINT berubah merah
  confirm?: string;
}

export function validateNewPassword(password: string, confirm: string): NewPasswordErrors {
  const errors: NewPasswordErrors = {};
  if (password.length < PASSWORD_MIN_LENGTH) errors.password = true;
  if (confirm !== password) errors.confirm = PASSWORDS_DIFFER;
  return errors;
}

// Galat yang dibedakan UI auth. Adapter (mock/HTTP) menerjemahkan jawaban server ke kode ini.
export type AuthErrorCode =
  | "INVALID_CREDENTIALS" // email atau password salah
  | "NO_ACCESS" // akun (mis. Google) belum didaftarkan admin
  | "NETWORK" // server tidak terjangkau
  | "EMAIL_NOT_REGISTERED"
  | "CODE_MISMATCH"
  | "CODE_EXPIRED"
  | "TOO_MANY_ATTEMPTS"
  | "RESET_EXPIRED" // reset token habis atau sudah dipakai
  | "PASSWORD_REJECTED"; // password baru ditolak aturan server; message = alasannya (mis. panjang minimum)

export class AuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    message: string = code,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export function authErrorCode(e: unknown): AuthErrorCode | null {
  return e instanceof AuthError ? e.code : null;
}

// Nama tampilan dari bagian lokal email: "siti.rahma" → "Siti Rahma".
export function displayNameFromEmail(email: string): string {
  const local = email.trim().split("@")[0] ?? "";
  const words = local.split(/[._-]+/).filter(Boolean);
  if (words.length === 0) return "User";
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

export const ROLE_LABEL: Record<UserRole, string> = { ADMIN: "Admin", OPERATOR: "Operator", VIEWER: "Viewer" };
