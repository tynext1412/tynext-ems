import { useId, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSignIn } from "../application/use-auth";
import { authErrorCode, normalizeEmail, validateCredentials, validateEmail, type CredentialErrors } from "../domain/auth";
import { AuthAlert, EmailField, FORM_STACK, GlossyButton, GoogleButton, PasswordField } from "./auth-controls";

interface AlertCopy {
  title: string;
  description: string;
}

const CONNECTION: AlertCopy = { title: "Couldn't sign you in", description: "Check your connection, then try again" };
const NO_ACCESS: AlertCopy = { title: "This Google account has no access", description: "Sign in with your work account, or ask your administrator to add you." };

// Kode error yang dikirim backend saat SSO gagal (redirect ke /login?error=...).
const SSO_ERROR: Record<string, AlertCopy> = {
  sso_unavailable: { title: "Google sign-in isn't set up yet", description: "Sign in with your work email and password." },
  sso_no_account: NO_ACCESS,
  sso_denied: { title: "Sign-in was cancelled", description: "Try again, or sign in with your work email and password." },
  sso_expired: { title: "Sign-in took too long", description: "Please try again." },
  sso_state: { title: "Sign-in took too long", description: "Please try again." },
  sso_failed: { title: "Couldn't sign you in with Google", description: "Please try again, or sign in with your work email and password." },
};

function ssoError(search: string): AlertCopy | null {
  const code = new URLSearchParams(search).get("error");
  return code ? (SSO_ERROR[code] ?? SSO_ERROR.sso_failed) : null;
}

function signInAlert(error: Error): AlertCopy {
  switch (authErrorCode(error)) {
    case "INVALID_CREDENTIALS":
      return { title: "Incorrect email or password", description: "Check both and try again, or reset your password." };
    case "NO_ACCESS":
      return NO_ACCESS;
    case "NETWORK":
      return CONNECTION;
    default:
      return { title: CONNECTION.title, description: error.message };
  }
}

interface LoginState {
  from?: unknown;
  email?: unknown;
}

function fromPath(state: unknown): string {
  const from = (state as LoginState | null)?.from;
  return typeof from === "string" && from.startsWith("/") && !from.startsWith("//") && !from.startsWith("/login") ? from : "/";
}

// Form Sign In (Figma Login · 01–09). Validasi berjalan saat Sign In diklik; pesan tampil di bawah
// field yang bermasalah dan hilang begitu field itu diubah. Galat server tampil sebagai Alert di
// bawah judul, isian tidak dikosongkan.
export function LoginForm({ titleId }: { titleId: string }) {
  const id = useId();
  const navigate = useNavigate();
  const location = useLocation();
  const signIn = useSignIn();
  const initialEmail = (location.state as LoginState | null)?.email;
  const [email, setEmail] = useState(typeof initialEmail === "string" ? initialEmail : "");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<CredentialErrors>({});
  const [ssoDismissed, setSsoDismissed] = useState(false);
  const [method, setMethod] = useState<"password" | "google">("password");
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const done = () => navigate(fromPath(location.state), { replace: true });
  const pending = signIn.isPending;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeEmail(email);
    setEmail(normalized);
    setSsoDismissed(true);
    const found = validateCredentials({ email: normalized, password });
    setErrors(found);
    if (found.email) return emailRef.current?.focus();
    if (found.password) return passwordRef.current?.focus();
    setMethod("password");
    signIn.mutate({ credentials: { email: normalized, password } }, { onSuccess: done });
  };

  const google = () => {
    setSsoDismissed(true);
    setErrors({});
    setMethod("google");
    signIn.mutate({ provider: "google" }, { onSuccess: done });
  };

  const alert = signIn.error ? signInAlert(signIn.error) : ssoDismissed ? null : ssoError(location.search);
  const forgotEmail = validateEmail(email) ? undefined : normalizeEmail(email);

  return (
    <form onSubmit={submit} noValidate className={FORM_STACK}>
      <header className="flex flex-col gap-1.5">
        <h1 id={titleId} className="text-2xl font-semibold leading-8 text-text">
          Sign In to Tynext
        </h1>
        <p className="text-sm leading-[22px] text-[#5b6168]">Use your work email or Google account to continue</p>
      </header>

      {alert && <AuthAlert title={alert.title}>{alert.description}</AuthAlert>}

      <div className="flex flex-col gap-4">
        <EmailField
          id={`${id}-email`}
          ref={emailRef}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((er) => ({ ...er, email: undefined }));
          }}
          onBlur={() => setEmail((v) => normalizeEmail(v))}
          error={errors.email}
          disabled={pending}
        />
        <div className="flex flex-col gap-2">
          <PasswordField
            id={`${id}-password`}
            ref={passwordRef}
            label="Password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((er) => ({ ...er, password: undefined }));
            }}
            error={errors.password}
            disabled={pending}
          />
          <div className="flex justify-end">
            <Link to="/forgot-password" state={{ email: forgotEmail }} className="rounded-sm text-sm font-medium leading-[22px] text-brand hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <GlossyButton type="submit" loading={pending && method === "password"} loadingLabel="Signing In" disabled={pending}>
          Sign In
        </GlossyButton>
        <div className="flex items-center gap-3" aria-hidden>
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs leading-[18px] text-muted">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <GoogleButton onClick={google} loading={pending && method === "google"} disabled={pending} />
      </div>
    </form>
  );
}
