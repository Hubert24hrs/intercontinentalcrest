import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm text-fg-subtle", className)} role="status">
      <Loader2 className="size-4 animate-spin text-brand-600" aria-hidden />
      {label ?? <span className="sr-only">Loading</span>}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton h-4", className)} aria-hidden />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      {icon && <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-surface-muted text-fg-subtle">{icon}</div>}
      <p className="text-sm font-semibold text-fg">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-fg-subtle">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1 text-sm text-fg-subtle sm:text-[15px]">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "brand",
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "brand" | "gold" | "ink" | "success" | "danger" | "warning";
  className?: string;
}) {
  const toneCls = {
    brand: "bg-brand-50 text-brand-700",
    gold: "bg-gold-200/50 text-gold-600",
    ink: "bg-ink-900/5 text-ink-800",
    success: "bg-success-50 text-success-700",
    danger: "bg-danger-50 text-danger-700",
    warning: "bg-warning-50 text-warning-700",
  }[tone];
  return (
    <div className={cn("card card-pad", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-fg-subtle">{label}</p>
        {icon && <div className={cn("flex size-9 items-center justify-center rounded-xl", toneCls)}>{icon}</div>}
      </div>
      <p className="num mt-2 text-2xl font-semibold tracking-tight text-fg">{value}</p>
      {sub && <p className="mt-1 text-xs text-fg-subtle">{sub}</p>}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; icon?: React.ReactNode }[];
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="tablist" className={cn("inline-flex rounded-xl bg-surface-muted p-1", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg font-medium transition-colors",
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
              active ? "bg-white text-fg shadow-[0_1px_2px_rgba(16,24,40,0.08)]" : "text-fg-subtle hover:text-fg",
            )}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Avatar({ name, className }: { name?: string | null; className?: string }) {
  const parts = (name || "?").trim().split(/\s+/);
  const text = ((parts[0]?.[0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-ink-700 text-xs font-semibold text-white",
        className,
      )}
      aria-hidden
    >
      {text || "?"}
    </span>
  );
}

export function DefinitionRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <dt className="text-fg-subtle">{label}</dt>
      <dd className={cn("text-right font-medium text-fg", mono && "font-mono text-[13px]")}>{value}</dd>
    </div>
  );
}
