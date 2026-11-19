import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "success" | "danger" | "warning" | "info";

const STYLES: Record<Tone, { box: string; icon: React.ComponentType<{ className?: string }> }> = {
  success: { box: "border-success-500/25 bg-success-50 text-success-700", icon: CheckCircle2 },
  danger: { box: "border-danger-500/25 bg-danger-50 text-danger-700", icon: XCircle },
  warning: { box: "border-warning-500/30 bg-warning-50 text-warning-700", icon: AlertTriangle },
  info: { box: "border-info-500/25 bg-info-50 text-info-600", icon: Info },
};

export function Alert({ tone = "info", title, children, className }: { tone?: Tone; title?: React.ReactNode; children?: React.ReactNode; className?: string }) {
  const { box, icon: Icon } = STYLES[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex gap-3 rounded-xl border px-4 py-3 text-sm", box, className)}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-0.5", "leading-relaxed opacity-90")}>{children}</div>}
      </div>
    </div>
  );
}
