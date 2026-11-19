"use client";

import { forwardRef, useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";

type FieldShellProps = {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  className?: string;
  id: string;
  children: React.ReactNode;
  optional?: boolean;
};

function FieldShell({ label, hint, error, className, id, children, optional }: FieldShellProps) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
          {optional && <span className="ml-1 font-normal text-fg-faint">(optional)</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  wrapperClassName?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  optional?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, wrapperClassName, className, id, leading, trailing, optional, type, ...rest },
  ref,
) {
  const auto = useId();
  const fieldId = id || auto;
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  const effectiveType = isPassword && reveal ? "text" : type;

  return (
    <FieldShell label={label} hint={hint} error={error} className={wrapperClassName} id={fieldId} optional={optional}>
      <div className="relative">
        {leading && (
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-fg-subtle">{leading}</span>
        )}
        <input
          ref={ref}
          id={fieldId}
          type={effectiveType}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          className={cn("input", leading && "pl-10", (trailing || isPassword) && "pr-11", className)}
          {...rest}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            className="absolute inset-y-0 right-1 my-1 flex w-9 items-center justify-center rounded-lg text-fg-subtle hover:bg-surface-muted hover:text-fg"
            aria-label={reveal ? "Hide password" : "Show password"}
          >
            {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        ) : (
          trailing && <span className="absolute inset-y-0 right-3.5 flex items-center text-sm text-fg-subtle">{trailing}</span>
        )}
      </div>
    </FieldShell>
  );
});

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  wrapperClassName?: string;
  optional?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, wrapperClassName, className, id, children, optional, ...rest },
  ref,
) {
  const auto = useId();
  const fieldId = id || auto;
  return (
    <FieldShell label={label} hint={hint} error={error} className={wrapperClassName} id={fieldId} optional={optional}>
      <select ref={ref} id={fieldId} aria-invalid={error ? true : undefined} className={cn("input", className)} {...rest}>
        {children}
      </select>
    </FieldShell>
  );
});

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  wrapperClassName?: string;
  optional?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, wrapperClassName, className, id, optional, ...rest },
  ref,
) {
  const auto = useId();
  const fieldId = id || auto;
  return (
    <FieldShell label={label} hint={hint} error={error} className={wrapperClassName} id={fieldId} optional={optional}>
      <textarea ref={ref} id={fieldId} aria-invalid={error ? true : undefined} className={cn("input", className)} {...rest} />
    </FieldShell>
  );
});
