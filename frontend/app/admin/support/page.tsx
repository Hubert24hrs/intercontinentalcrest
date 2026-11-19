"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, LifeBuoy, Send } from "lucide-react";
import { adminSupportApi } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { StatusBadge } from "@/components/ui/Badge";
import { Avatar, EmptyState, PageHeader, Skeleton } from "@/components/ui/misc";
import { ChatThread, type ChatMessage } from "@/components/app/ChatThread";
import { cn } from "@/lib/cn";

type Conversation = {
  id: string;
  status: string;
  lastMessageAt: string;
  unreadCount: number;
  customer: { id: string; fullName: string; email: string };
  messages: ChatMessage[];
};

export default function AdminSupportPage() {
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInbox = useCallback(
    () =>
      adminSupportApi.getConversations(1, 50).then(
        (res) => setConversations(res.data),
        (e) => setError(e.message),
      ),
    [],
  );

  const loadThread = useCallback(
    (id: string) =>
      adminSupportApi.getMessages(id).then(
        (res) => setMessages(res.messages || []),
        (e) => setError(e.message),
      ),
    [],
  );

  useEffect(() => {
    loadInbox();
    const t = setInterval(loadInbox, 8000);
    return () => clearInterval(t);
  }, [loadInbox]);

  useEffect(() => {
    if (!activeId) return;
    loadThread(activeId).then(loadInbox);
    const t = setInterval(() => loadThread(activeId), 5000);
    return () => clearInterval(t);
  }, [activeId, loadThread, loadInbox]);

  const active = conversations?.find((c) => c.id === activeId);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    if (!activeId || !text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const msg = await adminSupportApi.sendMessage(activeId, text.trim());
      setMessages((m) => [...m, msg]);
      setText("");
      loadInbox();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function closeConversation() {
    if (!activeId || !confirm("Close this conversation? The customer can start a new one at any time.")) return;
    try {
      await adminSupportApi.closeConversation(activeId);
      loadInbox();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div>
      <PageHeader title="Support inbox" description="Reply to customer conversations." />
      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}
      <Card className="grid h-[min(76vh,760px)] overflow-hidden lg:grid-cols-[340px_1fr]">
        <aside className={cn("flex min-h-0 flex-col border-line lg:border-r", activeId && "hidden lg:flex")}>
          <div className="border-b border-line px-5 py-4 text-sm font-semibold">Conversations</div>
          <ul className="scrollbar-thin min-h-0 flex-1 divide-y divide-line overflow-y-auto">
            {!conversations && [0, 1, 2].map((i) => <li key={i} className="p-4"><Skeleton className="h-10" /></li>)}
            {conversations?.length === 0 && <EmptyState icon={<LifeBuoy className="size-5" />} title="No conversations yet" />}
            {conversations?.map((c) => (
              <li key={c.id}>
                <button onClick={() => setActiveId(c.id)} className={cn("flex w-full gap-3 px-4 py-3.5 text-left transition-colors", c.id === activeId ? "bg-brand-50/60" : "hover:bg-surface")}>
                  <Avatar name={c.customer.fullName} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{c.customer.fullName}</span>
                      <span className="shrink-0 text-xs text-fg-faint">{formatRelative(c.lastMessageAt)}</span>
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-fg-subtle">{c.messages?.[0]?.content || "No messages yet"}</span>
                      {c.unreadCount > 0 ? (
                        <span className="num flex min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold text-white">{c.unreadCount}</span>
                      ) : (
                        c.status === "closed" && <span className="text-[11px] text-fg-faint">closed</span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className={cn("flex min-h-0 flex-col", !activeId && "hidden lg:flex")}>
          {!active ? (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState icon={<LifeBuoy className="size-5" />} title="Select a conversation" description="Choose a customer on the left to read and reply." />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-5">
                <button className="rounded-lg p-1.5 text-fg-subtle hover:bg-surface lg:hidden" onClick={() => setActiveId(null)} aria-label="Back to conversations">
                  <ArrowLeft className="size-5" />
                </button>
                <Avatar name={active.customer.fullName} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{active.customer.fullName}</p>
                  <p className="truncate text-xs text-fg-subtle">{active.customer.email}</p>
                </div>
                <StatusBadge status={active.status} />
                {active.status === "open" && (
                  <Button size="sm" variant="secondary" onClick={closeConversation}>
                    Close
                  </Button>
                )}
              </div>
              <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto bg-surface/60">
                <ChatThread messages={messages} me="admin" emptyText="No messages in this conversation yet." />
              </div>
              <form onSubmit={send} className="flex items-end gap-2 border-t border-line p-3 sm:p-4">
                <textarea
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
                  placeholder={active.status === "closed" ? "Replying will reopen this conversation…" : "Write a reply…"}
                  className="input max-h-40 min-h-11 flex-1 resize-none py-2.5"
                  aria-label="Reply"
                />
                <Button type="submit" variant="accent" className="h-11" loading={busy} disabled={!text.trim()} aria-label="Send reply">
                  <Send className="size-4" />
                </Button>
              </form>
            </>
          )}
        </section>
      </Card>
    </div>
  );
}
