"use client";

import { useEffect, useRef } from "react";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";

export type ChatMessage = { id: string; senderType: "customer" | "admin"; content: string; createdAt: string };

/** Message list that keeps itself scrolled to the newest message. `me` decides which side is "mine". */
export function ChatThread({ messages, me, emptyText }: { messages: ChatMessage[]; me: "customer" | "admin"; emptyText: string }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  if (!messages.length) {
    return <div className="flex h-full items-center justify-center p-8 text-center text-sm text-fg-subtle">{emptyText}</div>;
  }

  return (
    <div className="space-y-3 p-4 sm:p-6">
      {messages.map((m, i) => {
        const mine = m.senderType === me;
        const prev = messages[i - 1];
        const showTime = !prev || new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() > 10 * 60 * 1000;
        return (
          <div key={m.id}>
            {showTime && <p className="my-3 text-center text-[11px] text-fg-faint">{formatDateTime(m.createdAt)}</p>}
            <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <p
                className={cn(
                  "max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed",
                  mine ? "rounded-br-md bg-ink-900 text-white" : "rounded-bl-md border border-line bg-white text-fg",
                )}
              >
                {m.content}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={end} />
    </div>
  );
}
