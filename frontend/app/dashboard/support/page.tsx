"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supportApi } from "@/lib/api";
import { Send, MessageCircle, Loader2, CheckCircle, Clock, RefreshCw } from "lucide-react";

interface Message {
  id: string;
  senderType: "customer" | "admin";
  senderId: string;
  content: string;
  createdAt: string;
  readAt?: string | null;
}

interface Conversation {
  id: string;
  status: "open" | "closed";
  createdAt: string;
  lastMessageAt: string;
}

const POLL_INTERVAL_MS = 4000;

export default function SupportPage() {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNewAdminMsg, setHasNewAdminMsg] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const latestMessageIdRef = useRef<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch messages for current conversation
  const fetchMessages = useCallback(async () => {
    const convId = conversationIdRef.current;
    if (!convId) return;
    try {
      const res = await supportApi.getMessages(convId);
      const newMessages: Message[] = res.messages || [];

      // Detect new admin messages since last poll
      if (latestMessageIdRef.current && newMessages.length > 0) {
        const lastKnownIndex = newMessages.findIndex(
          (m) => m.id === latestMessageIdRef.current
        );
        const newer = lastKnownIndex >= 0
          ? newMessages.slice(lastKnownIndex + 1)
          : newMessages;
        const hasNewAdmin = newer.some((m) => m.senderType === "admin");
        if (hasNewAdmin) setHasNewAdminMsg(true);
      }

      if (newMessages.length > 0) {
        latestMessageIdRef.current = newMessages[newMessages.length - 1].id;
      }

      setMessages(newMessages);
      setConversation(res.conversation);
      setHasNewAdminMsg(false); // Reset once we render the new messages
    } catch {
      // Silent poll failure — don't show error for background polls
    }
  }, []);

  // Initialize: get or create conversation, then start polling
  useEffect(() => {
    const init = async () => {
      try {
        const res = await supportApi.getOrCreateConversation();
        conversationIdRef.current = res.id;
        setConversation(res);

        // Load initial messages
        const msgRes = await supportApi.getMessages(res.id);
        const msgs: Message[] = msgRes.messages || [];
        setMessages(msgs);
        if (msgs.length > 0) {
          latestMessageIdRef.current = msgs[msgs.length - 1].id;
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load support chat.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Start polling once conversation is ready
  useEffect(() => {
    if (!conversation) return;

    pollTimerRef.current = setInterval(fetchMessages, POLL_INTERVAL_MS);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [conversation, fetchMessages]);

  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content || !conversation || conversation.status === "closed" || sending) return;

    setSending(true);
    // Optimistic UI
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      senderType: "customer",
      senderId: "",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInputValue("");

    try {
      await supportApi.sendMessage(conversation.id, content);
      // Fetch fresh messages to replace optimistic with real
      await fetchMessages();
    } catch (err: any) {
      setError(err?.message || "Failed to send message.");
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  // Group messages by date
  const groupedMessages: { date: string; items: Message[] }[] = [];
  messages.forEach((msg) => {
    const dateLabel = formatDate(msg.createdAt);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === dateLabel) {
      last.items.push(msg);
    } else {
      groupedMessages.push({ date: dateLabel, items: [msg] });
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
        <span className="text-sm">Loading support chat…</span>
      </div>
    );
  }

  if (error && !conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="text-red-500 text-sm">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="text-brand-primary text-sm font-medium hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const isClosed = conversation?.status === "closed";

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-h-[800px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="font-display font-bold text-brand-secondary text-xl flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-brand-primary" />
            Support Chat
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">
            Our support team typically responds within a few hours
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasNewAdminMsg && (
            <span className="text-xs bg-brand-primary/10 text-brand-primary font-semibold px-2 py-1 rounded-full animate-pulse">
              New reply!
            </span>
          )}
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              isClosed
                ? "bg-gray-100 text-gray-500"
                : "bg-green-50 text-green-700"
            }`}
          >
            {isClosed ? "Closed" : "● Open"}
          </span>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-brand-primary" />
              </div>
              <p className="font-display font-bold text-brand-secondary text-base">
                Start the conversation
              </p>
              <p className="text-gray-400 text-sm mt-1 max-w-xs">
                Send us a message below and our support team will get back to you shortly.
              </p>
            </div>
          )}

          {groupedMessages.map(({ date, items }) => (
            <div key={date}>
              {/* Date divider */}
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">
                  {date}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {items.map((msg) => {
                const isCustomer = msg.senderType === "customer";
                const isTemp = msg.id.startsWith("temp-");

                return (
                  <div
                    key={msg.id}
                    className={`flex mb-2 ${isCustomer ? "justify-end" : "justify-start"}`}
                  >
                    {!isCustomer && (
                      <div className="w-7 h-7 rounded-full bg-brand-secondary flex items-center justify-center mr-2 flex-shrink-0 mt-1 text-white text-[10px] font-bold">
                        S
                      </div>
                    )}
                    <div className={`max-w-[75%] ${isCustomer ? "items-end" : "items-start"} flex flex-col`}>
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isCustomer
                            ? "bg-brand-primary text-white rounded-br-sm"
                            : "bg-gray-100 text-gray-800 rounded-bl-sm"
                        } ${isTemp ? "opacity-70" : ""}`}
                      >
                        {msg.content}
                      </div>
                      <div className={`flex items-center gap-1 mt-1 ${isCustomer ? "justify-end" : "justify-start"}`}>
                        <span className="text-gray-400 text-[10px]">
                          {formatTime(msg.createdAt)}
                        </span>
                        {isCustomer && !isTemp && (
                          <CheckCircle className="w-3 h-3 text-gray-300" />
                        )}
                        {isTemp && (
                          <Clock className="w-3 h-3 text-gray-300" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 flex-shrink-0" />

        {/* Input area */}
        <div className="px-4 py-3 flex-shrink-0">
          {error && (
            <div className="text-red-500 text-xs mb-2 text-center">{error}</div>
          )}

          {isClosed ? (
            <div className="text-center text-gray-500 text-sm py-3 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              This conversation has been resolved. To open a new one,{" "}
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    const res = await supportApi.getOrCreateConversation();
                    conversationIdRef.current = res.id;
                    setConversation(res);
                    setMessages([]);
                  } catch {
                    // ignore
                  } finally {
                    setLoading(false);
                  }
                }}
                className="text-brand-primary font-semibold hover:underline"
              >
                click here
              </button>
            </div>
          ) : (
            <div className="flex items-end gap-3">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message… (Enter to send, Shift+Enter for new line)"
                rows={1}
                className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
                style={{ maxHeight: "120px", overflowY: "auto" }}
                disabled={sending}
                id="support-message-input"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || sending}
                id="support-send-btn"
                className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center flex-shrink-0 hover:bg-[#009fd4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <p className="text-gray-400 text-[10px]">
              Polling every {POLL_INTERVAL_MS / 1000}s for new replies
            </p>
            <button
              onClick={fetchMessages}
              className="text-gray-400 hover:text-brand-primary transition-colors"
              title="Refresh now"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
