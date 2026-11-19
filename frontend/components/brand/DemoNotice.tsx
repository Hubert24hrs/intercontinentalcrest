import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/cn";

/** Small "Demo" marker used in the app shell and sign-in screens. */
export function DemoPill({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-gold-400/40 bg-gold-200/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-300",
        className,
      )}
      title="All balances and transactions are simulated"
    >
      <FlaskConical className="size-3" aria-hidden />
      Demo
    </span>
  );
}
