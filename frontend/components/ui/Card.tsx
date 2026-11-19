import { cn } from "@/lib/cn";

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("card", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
  icon,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">{icon}</div>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-fg">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-fg-subtle">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("px-5 pb-5 pt-4 sm:px-6 sm:pb-6", className)}>{children}</div>;
}
