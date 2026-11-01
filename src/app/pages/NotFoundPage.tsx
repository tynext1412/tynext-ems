import { Link } from "react-router-dom";
import { EmptyState } from "@/shared/ui/EmptyState";

export function NotFoundPage() {
  return (
    <main className="grid h-dvh place-items-center bg-bg p-6">
      <div className="w-full max-w-lg rounded-3xl bg-surface p-6 shadow-surface">
        <EmptyState
          illustration="not-found"
          size="lg"
          title="This page doesn't exist"
          description="Tautannya mungkin salah atau halamannya sudah dipindahkan."
          action={
            <Link to="/" className="inline-flex h-9 items-center rounded-xl bg-brand px-4 text-sm font-medium text-on-brand hover:bg-brand-hover">
              Back to Dashboard
            </Link>
          }
        />
      </div>
    </main>
  );
}
