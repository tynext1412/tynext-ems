import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Credentials, Session } from "../domain/auth";
import type { SsoProvider } from "./auth-repository";
import { useAuthRepository } from "./auth-repository-context";
import { clearResetFlow, readResetFlow, writeResetFlow } from "./password-reset-flow";

export const authKeys = { session: ["auth", "session"] as const };

// Request auth tetap dikirim saat offline (bawaan React Query menundanya), supaya user langsung
// melihat "Couldn't sign you in" / "Couldn't send the code" alih-alih spinner yang tak berujung.
const SEND_EVEN_OFFLINE = { networkMode: "always" } as const;

// Sign out yang disengaja dibedakan dari sesi yang habis: hanya yang kedua memunculkan dialog "Sign in again".
let explicitSignOut = false;
export function wasExplicitSignOut(): boolean {
  return explicitSignOut;
}

export function useSession() {
  const repo = useAuthRepository();
  return useQuery<Session | null>({ queryKey: authKeys.session, queryFn: () => repo.current(), staleTime: Infinity });
}

export function useSignIn() {
  const repo = useAuthRepository();
  const queryClient = useQueryClient();
  return useMutation({
    ...SEND_EVEN_OFFLINE,
    mutationFn: (input: { credentials: Credentials } | { provider: SsoProvider }) => ("provider" in input ? repo.signInWithProvider(input.provider) : repo.signIn(input.credentials)),
    onSuccess: (session) => {
      explicitSignOut = false;
      clearResetFlow(); // server juga membatalkan reset token yang masih aktif
      queryClient.setQueryData(authKeys.session, session);
    },
  });
}

// ── Forgot Password ──────────────────────────────────────────────────────────

export function useRequestPasswordReset() {
  const repo = useAuthRepository();
  return useMutation({
    ...SEND_EVEN_OFFLINE,
    mutationFn: (email: string) => repo.requestPasswordReset(email),
    onSuccess: (challenge) => writeResetFlow({ email: challenge.email, challenge }),
  });
}

export function useVerifyResetCode() {
  const repo = useAuthRepository();
  return useMutation({
    ...SEND_EVEN_OFFLINE,
    mutationFn: (input: { email: string; code: string }) => repo.verifyResetCode(input.email, input.code),
    onSuccess: (grant, input) => writeResetFlow({ email: input.email, grant }), // kode sudah terpakai: langkah 2 tidak bisa dibuka lagi
  });
}

export function useCompletePasswordReset() {
  const repo = useAuthRepository();
  return useMutation({
    ...SEND_EVEN_OFFLINE,
    mutationFn: (input: { token: string; password: string }) => repo.completePasswordReset(input.token, input.password),
    onSuccess: () => clearResetFlow(),
  });
}

// Keluar dari flow (Back to Sign In / Use a Different Email): token dibatalkan di server tanpa
// menunggu jawaban; email tetap diingat untuk langkah 1 bila diminta.
export function useCancelPasswordReset() {
  const repo = useAuthRepository();
  return (options: { keepEmail?: boolean } = {}) => {
    const flow = readResetFlow();
    if (flow?.grant) void repo.cancelPasswordReset(flow.grant.token).catch(() => {});
    if (flow && options.keepEmail) writeResetFlow({ email: flow.email });
    else clearResetFlow();
  };
}

export function useSignOut() {
  const repo = useAuthRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => repo.signOut(),
    onMutate: () => {
      explicitSignOut = true;
    },
    onSuccess: () => {
      queryClient.setQueryData(authKeys.session, null);
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== "auth" }); // data plant tidak tertinggal di sesi berikutnya
    },
  });
}
