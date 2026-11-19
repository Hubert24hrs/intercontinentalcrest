import { cn } from "@/lib/cn";

export type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "info" | "gold" | "dark";

const TONE: Record<Tone, string> = {
  neutral: "bg-surface-muted text-fg-muted",
  brand: "bg-brand-50 text-brand-700",
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  danger: "bg-danger-50 text-danger-700",
  info: "bg-info-50 text-info-600",
  gold: "bg-gold-200/60 text-gold-600",
  dark: "bg-ink-900 text-white",
};

export function Badge({ tone = "neutral", dot, className, children }: { tone?: Tone; dot?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("badge", TONE[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden />}
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, Tone> = {
  completed: "success",
  approved: "success",
  active: "success",
  open: "brand",
  verified: "success",
  pending: "warning",
  under_review: "warning",
  processing: "info",
  matured: "info",
  failed: "danger",
  rejected: "danger",
  suspended: "danger",
  defaulted: "danger",
  frozen: "danger",
  reversed: "neutral",
  closed: "neutral",
  inactive: "neutral",
  not_submitted: "neutral",
};

export function StatusBadge({ status, label }: { status: string | null | undefined; label?: string }) {
  const s = (status || "unknown").toLowerCase();
  const text = label ?? s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
  return (
    <Badge tone={STATUS_TONE[s] ?? "neutral"} dot>
      {text}
    </Badge>
  );
}
