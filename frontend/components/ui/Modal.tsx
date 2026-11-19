"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const width = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" }[size];
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-ink-950/50 backdrop-blur-[2px] data-[state=open]:animate-[fade-up_0.2s_ease-out]" />
        <Dialog.Content
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cn(
            "fixed left-1/2 top-1/2 z-[90] flex max-h-[min(90vh,860px)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white shadow-2xl outline-none",
            width,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
            <div>
              <Dialog.Title className="text-base font-semibold text-fg">{title}</Dialog.Title>
              {description && <Dialog.Description className="mt-0.5 text-sm text-fg-subtle">{description}</Dialog.Description>}
            </div>
            <Dialog.Close className="-mr-2 rounded-lg p-1.5 text-fg-subtle hover:bg-surface-muted hover:text-fg" aria-label="Close">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <div className="scrollbar-thin overflow-y-auto px-6 py-5">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-surface/60 px-6 py-4 rounded-b-2xl">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
