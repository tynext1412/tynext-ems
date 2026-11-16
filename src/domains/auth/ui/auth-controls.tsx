import { useState, type ButtonHTMLAttributes, type ComponentProps, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { cn } from "@/shared/lib/cn";
import { Input } from "@/shared/ui/Input";
import { ArrowLeftIcon, ButtonSpinner, CircleExclamationIcon, EyeIcon, EyeSlashIcon, GoogleIcon } from "./auth-icons";

// Komponen form halaman auth, ukurannya diambil dari node Figma (frame 1440 × 900, panel 480 px).

const LABEL = "text-sm font-medium leading-6";
const MESSAGE = "text-xs leading-5";
// Kolom galat: placeholder gelap seperti Figma; fokus tetap merah (cincin merah tipis) supaya
// field pertama yang salah bisa difokuskan tanpa kehilangan tampilan galatnya. Outline global
// :focus-visible dimatikan karena kolom sudah punya cincin fokus sendiri (shadow-focus).
const INPUT =
  "h-9 py-2 leading-5 outline-none! disabled:text-muted aria-invalid:placeholder:text-text aria-invalid:focus:border-danger aria-invalid:focus:shadow-[0_0_0_3px_rgba(255,56,60,0.15)]";

type InputProps = Omit<ComponentProps<"input">, "id" | "type" | "className">;

interface EmailFieldProps extends InputProps {
  id: string;
  label?: string;
  error?: string;
}

// TextField kit HeroUI: saat nonaktif seluruh field 50 % dan kolomnya 50 % lagi (sesuai Figma).
export function EmailField({ id, label = "Email", error, disabled, ...props }: EmailFieldProps) {
  return (
    <div className={cn("grid gap-1", disabled && "opacity-50")}>
      <label htmlFor={id} className={cn(LABEL, error ? "text-danger" : "text-text")}>
        {label}
      </label>
      <Input
        id={id}
        type="email"
        autoComplete="email"
        inputMode="email"
        spellCheck={false}
        placeholder="name@company.com"
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={INPUT}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className={cn(MESSAGE, "text-danger")}>
          {error}
        </p>
      )}
    </div>
  );
}

interface PasswordFieldProps extends InputProps {
  id: string;
  label: string;
  value: string;
  error?: string;
  hint?: string; // teks bantuan yang selalu tampil (mis. "Use at least 10 characters.")
  hintInvalid?: boolean; // hint dan field berubah merah
}

// Field password dengan tombol mata di dalam kolom; nonaktif = kolomnya saja 50 % (label tetap).
export function PasswordField({ id, label, value, error, hint, hintInvalid, disabled, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const invalid = !!error || !!hintInvalid;
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className={cn(LABEL, invalid ? "text-danger" : "text-text")}>
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          disabled={disabled}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          // Titik password Figma 6 px berjarak 10 px mulai tepat di padding: bullet Inter 20 px
          // (advance 11,25 px) dirapatkan 1,25 px dan digeser 2 px ke kiri (side bearing glyph).
          className={cn(INPUT, "pr-10", !visible && value && "-indent-0.5 text-[20px] tracking-[-1.25px]")}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          aria-controls={id}
          className={cn(
            "absolute inset-y-px right-px grid w-10 place-items-center rounded-r-[11px] bg-surface transition-colors hover:text-text disabled:pointer-events-none disabled:opacity-50",
            value || invalid ? "text-text" : "text-muted",
          )}
        >
          {visible ? <EyeSlashIcon /> : <EyeIcon />}
        </button>
      </div>
      {hint && (
        <p id={`${id}-hint`} className={cn(MESSAGE, hintInvalid ? "text-danger" : "text-muted")}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={cn(MESSAGE, "text-danger")}>
          {error}
        </p>
      )}
    </div>
  );
}

interface GlossyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingLabel?: string;
}

// GlossyButton (tombol utama): gradien #3c9ec8 → #087fb2, tepi #087fb2, kilau dalam putih 20 %.
// Nonaktif 45 %, memproses 80 % dengan spinner.
export function GlossyButton({ loading, loadingLabel, children, disabled, className, type = "button", ...props }: GlossyButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-brand bg-[linear-gradient(180deg,#3c9ec8_0%,#087fb2_100%)] px-[17px] text-sm font-medium leading-6 text-white shadow-[inset_0_3px_2px_rgba(255,255,255,0.2)] transition-[filter,opacity] hover:brightness-105",
        loading ? "cursor-progress opacity-80" : "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:brightness-100",
        className,
      )}
      {...props}
    >
      {loading && <ButtonSpinner />}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}

// Ghost Button kit: tepi hitam 8 %, tanpa isi.
export function GoogleButton({ loading, disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-[10px] border border-black/8 px-3 text-sm font-medium leading-5 text-[#171717] transition-colors hover:bg-black/3 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
      {...props}
    >
      {loading ? <ButtonSpinner className="text-brand" /> : <GoogleIcon />}
      Continue with Google
    </button>
  );
}

// Alert danger kit HeroUI: latar merah 6 %, tepi 18 %, radius 16; judul #a43532, deskripsi abu-abu.
export function AuthAlert({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div role="alert" className="flex gap-2 rounded-2xl border border-danger/18 bg-danger/6 px-4">
      <span className="shrink-0 pt-3">
        <span className="grid size-5 place-items-center text-[#a43532]">
          <CircleExclamationIcon />
        </span>
      </span>
      <div className="grid min-w-0 flex-1 gap-0.5 py-3 text-sm leading-6">
        <p className="font-medium text-[#a43532]">{title}</p>
        {children && <p className="text-muted">{children}</p>}
      </div>
    </div>
  );
}

// Tautan kembali di atas ilustrasi ("Back to Sign In", "Use a Different Email").
export function BackLink({ children, disabled, className, ...props }: LinkProps & { disabled?: boolean }) {
  return (
    <Link
      {...props}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      className={cn("inline-flex items-center gap-2 self-start text-sm leading-[22px] text-muted transition-colors hover:text-text", disabled && "pointer-events-none opacity-30", className)}
    >
      <ArrowLeftIcon />
      {children}
    </Link>
  );
}

// Kepala langkah Forgot Password: ilustrasi 155 × 120, judul 24/32, subjudul 14/22, rata tengah.
export function StepHeader({ id, illustration, title, children }: { id: string; illustration: string; title: string; children: ReactNode }) {
  return (
    <header className="flex flex-col items-center gap-1.5 text-center">
      <img src={illustration} alt="" width={155} height={120} className="h-[120px] w-[155px]" />
      <h1 id={id} className="text-2xl font-semibold leading-8 text-text">
        {title}
      </h1>
      <p className="text-sm leading-[22px] text-[#5b6168]">{children}</p>
    </header>
  );
}

export const FORM_STACK = "flex flex-col gap-6";
