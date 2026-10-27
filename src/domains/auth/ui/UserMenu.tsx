import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/shared/lib/cn";
import { useSession, useSignOut } from "../application/use-auth";
import { ROLE_LABEL } from "../domain/auth";

// Identitas pengguna yang sedang masuk + tombol keluar.
export function UserMenu({ className }: { className?: string }) {
  const session = useSession();
  const signOut = useSignOut();
  const navigate = useNavigate();
  const user = session.data?.user;
  if (!user) return null;

  return (
    <div className={cn("flex h-9 items-center gap-2 rounded-md border border-border bg-surface pl-2.5 pr-1 text-xs", className)}>
      <span className="grid size-6 place-items-center rounded-full bg-accent/15 font-semibold text-accent" aria-hidden>
        {user.name.charAt(0)}
      </span>
      <span className="leading-tight">
        <span className="block font-medium text-text">{user.name}</span>
        <span className="block text-[10px] text-muted">{ROLE_LABEL[user.role]}</span>
      </span>
      <button
        type="button"
        onClick={() => signOut.mutate(undefined, { onSuccess: () => navigate("/login", { replace: true }) })}
        disabled={signOut.isPending}
        aria-label="Keluar"
        title="Keluar"
        className="ml-1 inline-flex size-7 items-center justify-center rounded-sm text-muted hover:bg-surface-2 hover:text-text disabled:opacity-50"
      >
        <LogOut className="size-4" aria-hidden />
      </button>
    </div>
  );
}
