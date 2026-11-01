import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Credentials, Session } from "../domain/auth";
import type { SsoProvider } from "./auth-repository";
import { useAuthRepository } from "./auth-repository-context";

export const authKeys = { session: ["auth", "session"] as const };

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
    mutationFn: (input: { credentials: Credentials } | { provider: SsoProvider }) => ("provider" in input ? repo.signInWithProvider(input.provider) : repo.signIn(input.credentials)),
    onSuccess: (session) => {
      explicitSignOut = false;
      queryClient.setQueryData(authKeys.session, session);
    },
  });
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
