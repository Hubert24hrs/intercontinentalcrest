import { Check, X } from "lucide-react";
import { cn } from "@/lib/cn";

export const PASSWORD_RULES = [
  { label: "12 to 72 characters", test: (p: string) => p.length >= 12 && p.length <= 72 },
  { label: "An uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "A lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "A number", test: (p: string) => /\d/.test(p) },
];

export const passwordOk = (p: string) => PASSWORD_RULES.every((r) => r.test(p));

export function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(password);
        return (
          <li key={r.label} className={cn("flex items-center gap-1.5", ok ? "text-success-600" : "text-fg-subtle")}>
            {ok ? <Check className="size-3.5" /> : <X className="size-3.5 opacity-50" />}
            {r.label}
          </li>
        );
      })}
    </ul>
  );
}
