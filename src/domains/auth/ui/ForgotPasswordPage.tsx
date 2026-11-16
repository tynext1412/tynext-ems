import { Fragment, useEffect, useId, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import checkEmailIllustration from "@/assets/figma/illustrations/illustration-check-email.svg";
import passwordUpdatedIllustration from "@/assets/figma/illustrations/illustration-password-updated.svg";
import resetPasswordIllustration from "@/assets/figma/illustrations/illustration-reset-password.svg";
import { useNow } from "@/shared/lib/useNow";
import { readResetFlow, writeResetFlow } from "../application/password-reset-flow";
import { useCancelPasswordReset, useCompletePasswordReset, useRequestPasswordReset, useVerifyResetCode } from "../application/use-auth";
import { authErrorCode, normalizeEmail, PASSWORD_HINT, validateEmail, validateNewPassword, type NewPasswordErrors } from "../domain/auth";
import { emptyCode, formatCountdown, isPast } from "../domain/password-reset";
import { AuthAlert, BackLink, EmailField, FORM_STACK, GlossyButton, PasswordField, StepHeader } from "./auth-controls";
import { CircleCheckIcon } from "./auth-icons";
import { AUTH_TITLE_ID } from "./AuthLayout";
import { OtpInput } from "./OtpInput";

const BASE = "/forgot-password";
const CONNECTION = "Check your connection, then try again.";

interface StepState {
  email?: unknown;
  reason?: "expired";
}

// Flow Forgot Password (Figma Forgot Password · 01–04, A1–A5, B1–B6, C1–C4):
//   /forgot-password              1. Forgot Your Password?  (email → Send Code)
//   /forgot-password/code         2. Check Your Email       (6 digit → Verify Code)
//   /forgot-password/new-password 3. Set a New Password     (butuh reset token)
//   /forgot-password/done         4. Password Updated
// Langkah 2 → 3 dan 3 → 4 memakai `replace`, jadi tombol back browser dari langkah 3 membuka
// langkah 1 (kodenya sudah terpakai), bukan langkah 2.
export function ForgotPasswordPage() {
  const { step } = useParams();
  const titleId = AUTH_TITLE_ID;
  const content =
    step === undefined ? <EmailStep titleId={titleId} /> : step === "code" ? <CodeStep titleId={titleId} /> : step === "new-password" ? <NewPasswordStep titleId={titleId} /> : step === "done" ? <DoneStep titleId={titleId} /> : <Navigate to={BASE} replace />;
  return <Fragment key={step ?? "email"}>{content}</Fragment>;
}

// ── 1. Forgot Your Password? ─────────────────────────────────────────────────

function EmailStep({ titleId }: { titleId: string }) {
  const id = useId();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as StepState | null;
  const request = useRequestPasswordReset();
  const cancel = useCancelPasswordReset();
  const [email, setEmail] = useState(() => (typeof state?.email === "string" ? state.email : (readResetFlow()?.email ?? "")));
  const [error, setError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Kembali ke langkah 1 (Use a Different Email, back browser, token kedaluwarsa) = mulai lagi:
  // reset token yang masih ada dibatalkan, email tetap terisi.
  useEffect(() => {
    if (readResetFlow()?.grant) cancel({ keepEmail: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sekali saat langkah dibuka
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeEmail(email);
    setEmail(normalized);
    const found = validateEmail(normalized);
    setError(found);
    if (found) return inputRef.current?.focus();
    request.mutate(normalized, {
      onSuccess: () => navigate(`${BASE}/code`),
      onError: (err) => {
        if (authErrorCode(err) === "EMAIL_NOT_REGISTERED") {
          setError("No account uses this email. Check it, or ask your administrator.");
          inputRef.current?.focus();
        }
      },
    });
  };

  const sendFailed = request.error && authErrorCode(request.error) !== "EMAIL_NOT_REGISTERED" ? request.error : null;

  return (
    <form onSubmit={submit} noValidate className={FORM_STACK}>
      <BackLink to="/login" onClick={() => cancel()}>
        Back to Sign In
      </BackLink>
      <StepHeader id={titleId} illustration={resetPasswordIllustration} title="Forgot Your Password?">
        Enter your work email. We&apos;ll send you a 6-digit code to reset your password.
      </StepHeader>
      {sendFailed ? (
        <AuthAlert title="Couldn't send the code">{authErrorCode(sendFailed) === "NETWORK" ? CONNECTION : sendFailed.message}</AuthAlert>
      ) : (
        state?.reason === "expired" &&
        !request.isPending && <AuthAlert title="Your reset session has expired">Send a new code to set your password.</AuthAlert>
      )}
      <EmailField
        id={`${id}-email`}
        ref={inputRef}
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (error) setError(undefined);
        }}
        onBlur={() => setEmail((v) => normalizeEmail(v))}
        error={error}
        disabled={request.isPending}
      />
      <GlossyButton type="submit" loading={request.isPending} loadingLabel="Sending Code">
        Send Code
      </GlossyButton>
    </form>
  );
}

// ── 2. Check Your Email ──────────────────────────────────────────────────────

function CodeStep({ titleId }: { titleId: string }) {
  const navigate = useNavigate();
  const helperId = useId();
  const [flow, setFlow] = useState(() => readResetFlow());
  const verify = useVerifyResetCode();
  const resend = useRequestPasswordReset();
  const cancel = useCancelPasswordReset();
  const now = useNow(1000);
  const [digits, setDigits] = useState(emptyCode);
  const [resent, setResent] = useState(false);

  const challenge = flow?.challenge;
  if (!flow || !challenge) return <Navigate to={BASE} replace />;

  const verifyError = authErrorCode(verify.error);
  const locked = verifyError === "TOO_MANY_ATTEMPTS";
  const expired = verifyError === "CODE_EXPIRED" || isPast(challenge.expiresAt, now);
  const mismatch = verifyError === "CODE_MISMATCH";
  const complete = digits.every((d) => d !== "");
  const resendIn = Date.parse(challenge.resendAvailableAt) - now;
  const canResend = locked || expired || resendIn <= 0;
  const failed = [verify.error, resend.error].find((e) => e && !["CODE_MISMATCH", "CODE_EXPIRED", "TOO_MANY_ATTEMPTS"].includes(authErrorCode(e) ?? ""));

  const onDigits = (next: string[]) => {
    setDigits(next);
    setResent(false);
    if (mismatch) verify.reset();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complete || expired || locked) return;
    verify.mutate({ email: flow.email, code: digits.join("") }, { onSuccess: () => navigate(`${BASE}/new-password`, { replace: true }) });
  };

  const sendAgain = () => {
    resend.mutate(flow.email, {
      onSuccess: (next) => {
        setFlow({ email: next.email, challenge: next });
        setDigits(emptyCode());
        setResent(true);
        verify.reset();
      },
    });
  };

  return (
    <form onSubmit={submit} noValidate className={FORM_STACK}>
      <BackLink to={BASE} state={{ email: flow.email }} onClick={() => cancel({ keepEmail: true })}>
        Use a Different Email
      </BackLink>
      <StepHeader id={titleId} illustration={checkEmailIllustration} title="Check Your Email">
        We sent a 6-digit code to {flow.email}. Enter it below to continue.
      </StepHeader>
      {locked && <AuthAlert title="Too many attempts">For your security, request a new code to try again.</AuthAlert>}
      {failed && <AuthAlert title={resend.error ? "Couldn't send the code" : "Couldn't verify the code"}>{authErrorCode(failed) === "NETWORK" ? CONNECTION : failed.message}</AuthAlert>}
      <div className="flex flex-col gap-2.5">
        <OtpInput digits={locked ? emptyCode() : digits} onChange={onDigits} invalid={mismatch || (expired && !locked)} disabled={locked || verify.isPending || resend.isPending} autoFocus labelledBy={titleId} describedBy={helperId} />
        <p id={helperId} aria-live="polite" className="flex items-center justify-center gap-1.5 text-center text-sm leading-[22px]">
          {mismatch ? (
            <span className="text-danger">That code doesn&apos;t match. Check the email and try again.</span>
          ) : expired && !locked ? (
            <span className="text-danger">This code has expired. Send a new one to continue.</span>
          ) : resent ? (
            <>
              <CircleCheckIcon />
              <span className="text-ok-text">We sent a new code. Check your inbox.</span>
            </>
          ) : (
            <span className="text-muted">The code expires in 10 minutes.</span>
          )}
        </p>
      </div>
      <GlossyButton type="submit" loading={verify.isPending} loadingLabel="Verifying" disabled={!complete || expired || locked || resend.isPending}>
        Verify Code
      </GlossyButton>
      <p className="flex justify-center gap-1 text-sm leading-[22px]">
        <span className="text-muted">{locked || expired ? "Need a new code?" : "Didn't get the code?"}</span>
        {canResend ? (
          <button type="button" onClick={sendAgain} disabled={resend.isPending} className="rounded-sm font-medium text-brand hover:underline disabled:cursor-progress disabled:opacity-60">
            {resend.isPending ? "Sending…" : "Resend Code"}
          </button>
        ) : (
          <span className="font-mono font-medium text-[#a1a1aa]" aria-live="off">
            Resend in {formatCountdown(resendIn)}
          </span>
        )}
      </p>
    </form>
  );
}

// ── 3. Set a New Password ────────────────────────────────────────────────────

function NewPasswordStep({ titleId }: { titleId: string }) {
  const id = useId();
  const navigate = useNavigate();
  const complete = useCompletePasswordReset();
  const cancel = useCancelPasswordReset();
  const [flow] = useState(() => readResetFlow());
  const now = useNow(15_000); // token yang habis saat halaman terbuka juga dialihkan
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  const grant = flow?.grant;
  if (!flow) return <Navigate to={BASE} replace />;
  if (!grant) return <Navigate to={flow.challenge ? `${BASE}/code` : BASE} replace state={{ email: flow.email } satisfies StepState} />;
  // Token habis (mis. refresh setelah 15 menit): kembali ke langkah 1 dengan email terisi + Alert.
  if (isPast(grant.expiresAt, now) || authErrorCode(complete.error) === "RESET_EXPIRED") {
    writeResetFlow({ email: flow.email });
    return <Navigate to={BASE} replace state={{ email: flow.email, reason: "expired" } satisfies StepState} />;
  }

  const errors: NewPasswordErrors = submitted ? validateNewPassword(password, confirm) : {};
  // Aturan server bisa lebih ketat dari desain (backend: minimal 10 karakter): pesannya menggantikan
  // teks bantuan di bawah New Password sampai password diubah.
  const rejected = authErrorCode(complete.error) === "PASSWORD_REJECTED" ? complete.error?.message : undefined;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const found = validateNewPassword(password, confirm);
    if (found.password) return passwordRef.current?.focus();
    if (found.confirm) return confirmRef.current?.focus();
    complete.mutate({ token: grant.token, password }, { onSuccess: () => navigate(`${BASE}/done`, { replace: true, state: { email: flow.email } }) });
  };

  return (
    <form onSubmit={submit} noValidate className={FORM_STACK}>
      <BackLink to="/login" onClick={() => cancel()} disabled={complete.isPending}>
        Back to Sign In
      </BackLink>
      <StepHeader id={titleId} illustration={resetPasswordIllustration} title="Set a New Password">
        Choose a password you haven&apos;t used here before.
      </StepHeader>
      {complete.error && !rejected && <AuthAlert title="Couldn't save your password">{authErrorCode(complete.error) === "NETWORK" ? CONNECTION : complete.error.message}</AuthAlert>}
      <div className="flex flex-col gap-4">
        {/* Email tersembunyi supaya password manager menyimpan password baru untuk akun yang benar. */}
        <input type="email" name="username" autoComplete="username" value={flow.email} readOnly hidden />
        <PasswordField
          id={`${id}-new`}
          ref={passwordRef}
          label="New Password"
          autoComplete="new-password"
          placeholder="Enter a new password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (rejected) complete.reset();
          }}
          hint={rejected ?? PASSWORD_HINT}
          hintInvalid={errors.password || !!rejected}
          disabled={complete.isPending}
        />
        <PasswordField
          id={`${id}-confirm`}
          ref={confirmRef}
          label="Confirm New Password"
          autoComplete="new-password"
          placeholder="Enter it again"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
          disabled={complete.isPending}
        />
      </div>
      <GlossyButton type="submit" loading={complete.isPending} loadingLabel="Saving">
        Save Password
      </GlossyButton>
    </form>
  );
}

// ── 4. Password Updated ──────────────────────────────────────────────────────

function DoneStep({ titleId }: { titleId: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as StepState | null)?.email;
  return (
    <div className={FORM_STACK}>
      <StepHeader id={titleId} illustration={passwordUpdatedIllustration} title="Password Updated">
        Your password has been changed. Sign in with your new password to continue.
      </StepHeader>
      <GlossyButton onClick={() => navigate("/login", { replace: true, state: { email: typeof email === "string" ? email : undefined } })}>Back to Sign In</GlossyButton>
    </div>
  );
}
