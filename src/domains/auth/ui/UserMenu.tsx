import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, LogOut, Moon, Sun } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { env } from "@/shared/config/env";
import { cn } from "@/shared/lib/cn";
import { setTheme, useTheme } from "@/shared/lib/theme";
import { Button } from "@/shared/ui/Button";
import { Chip } from "@/shared/ui/Chip";
import { Dialog } from "@/shared/ui/Dialog";
import { useSession, useSignOut } from "../application/use-auth";
import { ROLE_LABEL } from "../domain/auth";

// Nama pengguna di header: klik membuka menu (nama, email, tema, Sign out).
// Sign out selalu lewat dialog konfirmasi, lalu kembali ke halaman login.
export function UserMenu({ className }: { className?: string }) {
  const session = useSession();
  const signOut = useSignOut();
  const navigate = useNavigate();
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const user = session.data?.user;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  const doSignOut = () => {
    signOut.mutate(undefined, {
      onSuccess: () => {
        setConfirm(false);
        navigate("/login", { replace: true });
      },
    });
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className="flex h-9 items-center gap-1.5 rounded-[10px] bg-bg pl-2 pr-2 text-sm text-text transition-colors hover:bg-surface-3"
      >
        <Avatar name={user.name} className="size-6 text-[11px]" />
        <span className="hidden max-w-40 truncate sm:inline">{user.name}</span>
        <ChevronDown className={cn("size-4 text-muted transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={menuId}
            role="menu"
            initial={reducedMotion ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-[260px] rounded-2xl border border-border bg-surface p-1.5 shadow-menu"
          >
            <div className="flex items-center gap-2.5 rounded-xl px-2.5 py-2.5">
              <Avatar name={user.name} className="size-9 text-sm" />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{user.name}</div>
                <div className="truncate text-xs text-muted">{user.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-2.5 pb-2 text-[11px] text-muted">
              <span>{ROLE_LABEL[user.role]}</span>
              {env.dataSource === "mock" && (
                <Chip size="sm" variant="soft" tone="warn" className="font-normal">
                  Data dummy
                </Chip>
              )}
            </div>
            <div className="my-1 h-px bg-separator" />
            <MenuItem
              icon={theme === "dark" ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? "Light theme" : "Dark theme"}
            </MenuItem>
            <MenuItem
              icon={<LogOut className="size-4" aria-hidden />}
              className="text-danger-text hover:bg-danger-soft"
              onClick={() => {
                setOpen(false);
                setConfirm(true);
              }}
            >
              Sign out
            </MenuItem>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog
        open={confirm}
        onClose={signOut.isPending ? undefined : () => setConfirm(false)}
        title="Sign out?"
        description="Your session will end and you'll return to the sign-in page."
        actions={
          <>
            <Button onClick={() => setConfirm(false)} disabled={signOut.isPending}>
              Cancel
            </Button>
            <Button variant="danger" onClick={doSignOut} loading={signOut.isPending}>
              Sign out
            </Button>
          </>
        }
      >
        {signOut.error && (
          <p role="alert" className="text-sm text-danger-text">
            Sign out failed: {signOut.error.message}
          </p>
        )}
      </Dialog>
    </div>
  );
}

function MenuItem({ icon, children, className, onClick }: { icon: React.ReactNode; children: React.ReactNode; className?: string; onClick: () => void }) {
  return (
    <button type="button" role="menuitem" onClick={onClick} className={cn("flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-left text-sm text-text hover:bg-surface-2", className)}>
      {icon}
      {children}
    </button>
  );
}

// Avatar inisial dengan gradien biru merek (desain memakai foto; tanpa foto dipakai inisial).
export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("inline-grid shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#0485f7,#5b3df5)] font-semibold text-white", className)} aria-hidden>
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
