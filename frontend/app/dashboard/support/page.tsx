"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LifeBuoy, Send } from "lucide-react";
import { supportApi } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { PageHeader, Spinner } from "@/components/ui/misc";
import { ChatThread, type ChatMessage } from "@/components/app/ChatThread";

const POLL_MS = 5000;

export default function SupportPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const start = useCallback(
    () =>
      supportApi.getOrCreateConversation().then(
        (conv) => {
          setConversationId(conv.id);
          setMessages(conv.messages || []);
          setError(null);
          setLoading(false);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        },
      ),
    [],
  );

  useEffect(() => {
    start();
  }, [start]);

  useEffect(() => {
    if (!conversationId) return;
    const poll = async () => {
      try {
        const res = await supportApi.getMessages(conversationId);
        if (res.conversation?.status === "closed") {
          // The team closed this conversation — open a fresh one so the customer can keep writing.
          await start();
          return;
        }
        setMessages(res.messages || []);
      } catch {
        /* keep the current thread; next poll will retry */
      }
    };
    const t = setInterval(poll, POLL_MS);
    return () => clearInterval(t);
  }, [conversationId, start]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const content = text.trim();
    if (!content || !conversationId) return;
    setSending(true);
    setError(null);
    try {
      const msg = await supportApi.sendMessage(conversationId, content);
      setMessages((m) => [...m, msg]);
      setText("");
      inputRef.current?.focus();
    } catch (err: any) {
      if (/closed/i.test(err.message || "")) {
        await start();
        setError("That conversation was closed, so we started a new one. Please send your message again.");
      } else {
        setError(err.message);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <PageHeader title="Support" description="Chat with our team. We usually reply within a few hours." />
      <Card className="flex h-[min(72vh,720px)] flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <LifeBuoy className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Intercontinental Crest support</p>
            <p className="text-xs text-fg-subtle">Messages are private to you and our support team.</p>
          </div>
        </div>
        <div className="scrollbar-thin flex-1 overflow-y-auto bg-surface/60">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Spinner label="Opening your conversation…" />
            </div>
          ) : (
            <ChatThread messages={messages} me="customer" emptyText="Ask us about accounts, payments, loans or security. Never share your password or 2FA codes." />
          )}
        </div>
        <form onSubmit={send} className="border-t border-line bg-white p-3 sm:p-4">
          {error && <Alert tone="danger" className="mb-3">{error}</Alert>}
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              maxLength={2000}
              placeholder="Write a message…"
              className="input max-h-40 min-h-11 flex-1 resize-none py-2.5"
              aria-label="Message"
              disabled={!conversationId}
            />
            <Button type="submit" variant="accent" className="h-11" loading={sending} disabled={!text.trim() || !conversationId} aria-label="Send message">
              <Send className="size-4" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
