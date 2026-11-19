import Link from "next/link";
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "accent" | "secondary" | "ghost" | "danger" | "on-dark" | "outline-on-dark";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary: "btn-primary",
  accent: "btn-accent",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
  "on-dark": "btn-on-dark",
  "outline-on-dark": "btn-outline-on-dark",
};
const SIZE: Record<Size, string> = { sm: "btn-sm", md: "", lg: "btn-lg" };

type CommonProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export type ButtonProps = CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, block, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn("btn", VARIANT[variant], SIZE[size], block && "w-full", className)}
      {...rest}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  block,
  className,
  children,
  ...rest
}: CommonProps & { href: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link href={href} className={cn("btn", VARIANT[variant], SIZE[size], block && "w-full", className)} {...rest}>
      {children}
    </Link>
  );
}
