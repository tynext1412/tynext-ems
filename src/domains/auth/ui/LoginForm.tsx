import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import type { SsoProvider } from "../application/auth-repository";
import { useSignIn } from "../application/use-auth";
import { PASSWORD_MIN_LENGTH, validateCredentials, type CredentialErrors } from "../domain/auth";

function fromPath(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from;
  return typeof from === "string" && from.startsWith("/") && !from.startsWith("/login") ? from : "/";
}

export function LoginForm() {
  const id = useId();
  const navigate = useNavigate();
  const location = useLocation();
  const signIn = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<CredentialErrors>({});
  const [touched, setTouched] = useState(false);
  const [forgot, setForgot] = useState(false);

  const validate = (e: string, p: string) => {
    const found = validateCredentials({ email: e, password: p });
    if (touched) setErrors(found);
    return found;
  };

  const done = () => navigate(fromPath(location.state), { replace: true });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    const found = validateCredentials({ email, password });
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    signIn.mutate({ credentials: { email, password } }, { onSuccess: done });
  };
  const sso = (provider: SsoProvider) => signIn.mutate({ provider }, { onSuccess: done });

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <div className="grid gap-1">
        <label htmlFor={`${id}-email`} className="text-sm font-medium">
          Email
        </label>
        <Input
          id={`${id}-email`}
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="nama@perusahaan.id"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            validate(e.target.value, password);
          }}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? `${id}-email-error` : undefined}
          className="h-11 w-full"
        />
        <p id={`${id}-email-error`} className={cn("min-h-4 text-xs text-danger", !errors.email && "sr-only")} aria-live="polite">
          {errors.email}
        </p>
      </div>

      <div className="grid gap-1">
        <label htmlFor={`${id}-password`} className="text-sm font-medium">
          Kata sandi
        </label>
        <div className="relative">
          <Input
            id={`${id}-password`}
            type={show ? "text" : "password"}
            autoComplete="current-password"
            placeholder={`Minimal ${PASSWORD_MIN_LENGTH} karakter`}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              validate(email, e.target.value);
            }}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? `${id}-password-error` : undefined}
            className="h-11 w-full pr-11"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            aria-pressed={show}
            className="absolute right-1 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-text"
          >
            {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        </div>
        <p id={`${id}-password-error`} className={cn("min-h-4 text-xs text-danger", !errors.password && "sr-only")} aria-live="polite">
          {errors.password}
        </p>
      </div>

      <div className="-mt-1 text-sm">
        <button type="button" onClick={() => setForgot((f) => !f)} aria-expanded={forgot} className="text-accent underline-offset-2 hover:underline">
          Lupa kata sandi?
        </button>
        {forgot && <p className="mt-1 text-xs text-muted">Reset kata sandi belum tersedia di versi dummy ini. Hubungi admin Tynext untuk akses.</p>}
      </div>

      {signIn.error && (
        <p role="alert" className="rounded-md border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">
          {signIn.error.message}
        </p>
      )}

      <Button type="submit" variant="primary" disabled={signIn.isPending} className="h-11 w-full text-base">
        {signIn.isPending ? "Memeriksa…" : "Masuk"}
      </Button>

      <div className="flex items-center gap-3 text-xs text-muted" aria-hidden>
        <span className="h-px flex-1 bg-border" />
        atau
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button type="button" onClick={() => sso("google")} disabled={signIn.isPending} className="h-11 w-full justify-start gap-3">
        <span className="grid size-6 place-items-center rounded-full border border-border bg-surface font-semibold text-text" aria-hidden>
          G
        </span>
        Lanjutkan dengan Google
      </Button>
      <Button type="button" onClick={() => sso("microsoft")} disabled={signIn.isPending} className="h-11 w-full justify-start gap-3">
        <span className="grid size-6 grid-cols-2 gap-0.5 p-1" aria-hidden>
          <span className="bg-[#f25022]" />
          <span className="bg-[#7fba00]" />
          <span className="bg-[#00a4ef]" />
          <span className="bg-[#ffb900]" />
        </span>
        Lanjutkan dengan Microsoft
      </Button>

      <p className="rounded-md border border-warn/40 bg-warn/5 px-3 py-2 text-xs text-muted">
        <span className="font-medium text-warn">Data dummy.</span> Email valid apa pun dengan kata sandi minimal {PASSWORD_MIN_LENGTH} karakter diterima; tombol Google/Microsoft masuk sebagai akun demo.
      </p>
    </form>
  );
}
