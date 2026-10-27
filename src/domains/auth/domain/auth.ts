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

export function validateCredentials(c: Credentials): CredentialErrors {
  const errors: CredentialErrors = {};
  if (!EMAIL.test(c.email.trim())) errors.email = "Masukkan alamat email yang valid.";
  if (c.password.length < PASSWORD_MIN_LENGTH) errors.password = `Kata sandi minimal ${PASSWORD_MIN_LENGTH} karakter.`;
  return errors;
}

// Nama tampilan dari bagian lokal email: "siti.rahma" → "Siti Rahma".
export function displayNameFromEmail(email: string): string {
  const local = email.trim().split("@")[0] ?? "";
  const words = local.split(/[._-]+/).filter(Boolean);
  if (words.length === 0) return "Pengguna";
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

export const ROLE_LABEL: Record<UserRole, string> = { ADMIN: "Admin", OPERATOR: "Operator", VIEWER: "Viewer" };
