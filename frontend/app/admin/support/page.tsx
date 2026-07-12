"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { adminSupportApi } from "@/lib/api";
import {
  Send,
  MessageSquare,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  User,
  ChevronRight,
} from "lucide-react";

interface Message {
  id: string;
  senderType: "customer" | "admin";
  senderId: string;
  content: string;
  createdAt: string;
  readAt?: string | null;
}

interface ConversationListItem {
  id: string;
  status: "open" | "closed";
  customerId: string;
  lastMessageAt: string;
  createdAt: string;
  unreadCount: number;
  customer: { id: string; fullName: string; email: string };
  messages: Message[]; // last 1 message
}

const CONV_POLL_MS = 5000;
const MSG_POLL_MS = 4000;

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatFullTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function AdminSupportPage() {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationListItem | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const convPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Fetch conversation list ──────────────────────────────────────────────
  const fetchConversations = useCallback(async (showLoader = false) => {
    if (showLoader) setLoadingConvs(true);
    try {
      const res = await adminSupportApi.getConversations();
      setConversations(res.data || []);
    } catch (err: any) {
      if (showLoader) setError(err?.message || "Failed to load conversations.");
    } finally {
      if (showLoader) setLoadingConvs(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations(true);
    convPollRef.current = setInterval(() => fetchConversations(false), CONV_POLL_MS);
    return () => {
      if (convPollRef.current) clearInterval(convPollRef.current);
    };
  }, [fetchConversations]);

  // ── Fetch messages for selected conversation ─────────────────────────────
  const fetchMessages = useCallback(async () => {
    if (!selectedId) return;
    try {
      const res = await adminSupportApi.getMessages(selectedId);
      setMessages(res.messages || []);
      // Update selected conv status from response
      if (res.conversation) {
        setSelectedConv(res.conversation as any);
        // Also update in list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedId
              ? { ...c, status: res.conversation.status, unreadCount: 0 }
              : c
          )
        );
      }
    } catch {
      // Silent
    }
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingMsgs(true);
    setMessages([]);
    fetchMessages().finally(() => setLoadingMsgs(false));

    msgPollRef.current = setInterval(fetchMessages, MSG_POLL_MS);
    return () => {
      if (msgPollRef.current) clearInterval(msgPollRef.current);
    };
  }, [selectedId, fetchMessages]);

  const handleSelectConversation = (conv: ConversationListItem) => {
    setSelectedId(conv.id);
    setSelectedConv(conv);
    setInputValue("");
    setError(null);
  };

  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content || !selectedId || sending) return;

    setSending(true);
    setInputValue("");
    // Optimistic
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      senderType: "admin",
      senderId: "",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      await adminSupportApi.sendMessage(selectedId, content);
      await fetchMessages();
    } catch (err: any) {
      setError(err?.message || "Failed to send.");
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
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

  const handleClose = async () => {
    if (!selectedId || closing) return;
    setClosing(true);
    try {
      await adminSupportApi.closeConversation(selectedId);
      setSelectedConv((prev) => prev ? { ...prev, status: "closed" } : prev);
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedId ? { ...c, status: "closed" } : c))
      );
    } catch (err: any) {
      setError(err?.message || "Failed to close conversation.");
    } finally {
      setClosing(false);
    }
  };

  // ── Group messages by date ────────────────────────────────────────────────
  const groupedMessages: { date: string; items: Message[] }[] = [];
  messages.forEach((msg) => {
    const dateLabel = formatDateLabel(msg.createdAt);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === dateLabel) {
      last.items.push(msg);
    } else {
      groupedMessages.push({ date: dateLabel, items: [msg] });
    }
  });

  const SIDEBAR_BG = "linear-gradient(180deg,#0d1f35 0%,#061729 100%)";

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#0A2342",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <MessageSquare
            style={{ width: 20, height: 20, color: "#00B7F1" }}
          />
          Support Inbox
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>
          Manage customer support conversations
        </p>
      </div>

      {/* Main container */}
      <div
        style={{
          display: "flex",
          gap: 16,
          height: "calc(100vh - 180px)",
          minHeight: 500,
          maxHeight: 800,
        }}
      >
        {/* ── Left: conversation list ──────────────────────────────── */}
        <div
          style={{
            width: 320,
            flexShrink: 0,
            background: SIDEBAR_BG,
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* List header */}
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{ color: "white", fontSize: 13, fontWeight: 600 }}
            >
              Conversations
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {conversations.some((c) => c.unreadCount > 0) && (
                <span
                  style={{
                    background: "#ef4444",
                    color: "white",
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 999,
                  }}
                >
                  {conversations.reduce((acc, c) => acc + c.unreadCount, 0)} new
                </span>
              )}
              <button
                onClick={() => fetchConversations(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.4)",
                  padding: 4,
                }}
                title="Refresh list"
              >
                <RefreshCw style={{ width: 13, height: 13 }} />
              </button>
            </div>
          </div>

          {/* List body */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loadingConvs ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 120,
                  gap: 8,
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 13,
                }}
              >
                <Loader2
                  className="animate-spin"
                  style={{ width: 16, height: 16, color: "#00B7F1" }}
                />
                Loading…
              </div>
            ) : conversations.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  textAlign: "center",
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 13,
                }}
              >
                No conversations yet
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = conv.id === selectedId;
                const lastMsg = conv.messages?.[0];
                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    id={`conv-${conv.id}`}
                    style={{
                      width: "100%",
                      background: isSelected
                        ? "rgba(0,183,241,0.15)"
                        : "transparent",
                      border: "none",
                      borderLeft: isSelected
                        ? "3px solid #00B7F1"
                        : "3px solid transparent",
                      cursor: "pointer",
                      padding: "12px 14px",
                      textAlign: "left",
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      transition: "background 0.15s",
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "rgba(0,183,241,0.12)",
                        border: "1px solid rgba(0,183,241,0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <User style={{ width: 16, height: 16, color: "#00B7F1" }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 2,
                        }}
                      >
                        <span
                          style={{
                            color: "white",
                            fontSize: 12,
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 140,
                          }}
                        >
                          {conv.customer.fullName}
                        </span>
                        <span
                          style={{
                            color: "rgba(255,255,255,0.35)",
                            fontSize: 10,
                            flexShrink: 0,
                          }}
                        >
                          {formatTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            color: "rgba(255,255,255,0.45)",
                            fontSize: 11,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flex: 1,
                          }}
                        >
                          {lastMsg
                            ? `${lastMsg.senderType === "admin" ? "You: " : ""}${lastMsg.content}`
                            : "No messages yet"}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span
                            style={{
                              background: "#00B7F1",
                              color: "white",
                              fontSize: 9,
                              fontWeight: 700,
                              minWidth: 16,
                              height: 16,
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: "1px 5px",
                          borderRadius: 999,
                          marginTop: 3,
                          display: "inline-block",
                          background:
                            conv.status === "open"
                              ? "rgba(16,185,129,0.15)"
                              : "rgba(255,255,255,0.06)",
                          color:
                            conv.status === "open"
                              ? "#34d399"
                              : "rgba(255,255,255,0.3)",
                        }}
                      >
                        {conv.status.toUpperCase()}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right: chat thread ──────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            background: "white",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid #f1f5f9",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          {!selectedId ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#94a3b8",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "#f0f9ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MessageSquare
                  style={{ width: 28, height: 28, color: "#00B7F1" }}
                />
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#0A2342",
                    marginBottom: 4,
                  }}
                >
                  Select a conversation
                </div>
                <div style={{ fontSize: 13 }}>
                  Click on a conversation to view messages and reply
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div
                style={{
                  padding: "12px 18px",
                  borderBottom: "1px solid #f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "#0A2342",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <User style={{ width: 16, height: 16, color: "white" }} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#0A2342",
                      }}
                    >
                      {selectedConv?.customer?.fullName || "Customer"}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>
                      {selectedConv?.customer?.email || ""}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: 999,
                      background:
                        selectedConv?.status === "open"
                          ? "#dcfce7"
                          : "#f1f5f9",
                      color:
                        selectedConv?.status === "open"
                          ? "#16a34a"
                          : "#64748b",
                    }}
                  >
                    {selectedConv?.status === "open" ? "● Open" : "Closed"}
                  </span>
                  {selectedConv?.status === "open" && (
                    <button
                      onClick={handleClose}
                      disabled={closing}
                      id="close-conversation-btn"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "5px 12px",
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        background: "white",
                        cursor: closing ? "not-allowed" : "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#64748b",
                        transition: "all 0.15s",
                        opacity: closing ? 0.5 : 1,
                      }}
                    >
                      {closing ? (
                        <Loader2
                          className="animate-spin"
                          style={{ width: 12, height: 12 }}
                        />
                      ) : (
                        <XCircle style={{ width: 12, height: 12 }} />
                      )}
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
                {loadingMsgs ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: 120,
                      gap: 8,
                      color: "#94a3b8",
                      fontSize: 13,
                    }}
                  >
                    <Loader2
                      className="animate-spin"
                      style={{ width: 16, height: 16, color: "#00B7F1" }}
                    />
                    Loading messages…
                  </div>
                ) : messages.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#94a3b8",
                      fontSize: 13,
                      paddingTop: 40,
                    }}
                  >
                    No messages yet. Reply below to start the conversation.
                  </div>
                ) : (
                  groupedMessages.map(({ date, items }) => (
                    <div key={date}>
                      {/* Date divider */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          margin: "12px 0",
                        }}
                      >
                        <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
                        <span
                          style={{
                            color: "#94a3b8",
                            fontSize: 10,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                          }}
                        >
                          {date}
                        </span>
                        <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
                      </div>

                      {items.map((msg) => {
                        const isAdmin = msg.senderType === "admin";
                        const isTemp = msg.id.startsWith("temp-");

                        return (
                          <div
                            key={msg.id}
                            style={{
                              display: "flex",
                              justifyContent: isAdmin ? "flex-end" : "flex-start",
                              marginBottom: 8,
                            }}
                          >
                            {!isAdmin && (
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: "50%",
                                  background: "#f1f5f9",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  marginRight: 8,
                                  flexShrink: 0,
                                  marginTop: 2,
                                }}
                              >
                                <User
                                  style={{
                                    width: 14,
                                    height: 14,
                                    color: "#64748b",
                                  }}
                                />
                              </div>
                            )}

                            <div
                              style={{
                                maxWidth: "70%",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: isAdmin ? "flex-end" : "flex-start",
                              }}
                            >
                              <div
                                style={{
                                  padding: "9px 14px",
                                  borderRadius: isAdmin
                                    ? "16px 16px 4px 16px"
                                    : "16px 16px 16px 4px",
                                  background: isAdmin ? "#00B7F1" : "#f1f5f9",
                                  color: isAdmin ? "white" : "#1e293b",
                                  fontSize: 13,
                                  lineHeight: 1.5,
                                  opacity: isTemp ? 0.7 : 1,
                                }}
                              >
                                {msg.content}
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                  marginTop: 3,
                                }}
                              >
                                <span
                                  style={{ color: "#94a3b8", fontSize: 10 }}
                                >
                                  {formatFullTime(msg.createdAt)}
                                </span>
                                {isAdmin && !isTemp && (
                                  <CheckCircle
                                    style={{
                                      width: 11,
                                      height: 11,
                                      color: "#cbd5e1",
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Divider */}
              <div
                style={{
                  height: 1,
                  background: "#f1f5f9",
                  flexShrink: 0,
                }}
              />

              {/* Input area */}
              <div style={{ padding: "12px 16px", flexShrink: 0 }}>
                {error && (
                  <div
                    style={{
                      color: "#ef4444",
                      fontSize: 12,
                      marginBottom: 8,
                      textAlign: "center",
                    }}
                  >
                    {error}
                  </div>
                )}

                {selectedConv?.status === "closed" ? (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#64748b",
                      fontSize: 13,
                      padding: "10px 0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <XCircle
                      style={{ width: 15, height: 15, color: "#94a3b8" }}
                    />
                    Conversation is resolved
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                    <textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your reply… (Enter to send)"
                      rows={1}
                      disabled={sending}
                      id="admin-support-input"
                      style={{
                        flex: 1,
                        resize: "none",
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        padding: "10px 14px",
                        fontSize: 13,
                        color: "#1e293b",
                        outline: "none",
                        maxHeight: 100,
                        overflowY: "auto",
                        fontFamily: "inherit",
                        transition: "border-color 0.15s",
                      }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!inputValue.trim() || sending}
                      id="admin-support-send-btn"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background:
                          !inputValue.trim() || sending ? "#e2e8f0" : "#00B7F1",
                        border: "none",
                        cursor:
                          !inputValue.trim() || sending ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "background 0.15s",
                      }}
                    >
                      {sending ? (
                        <Loader2
                          className="animate-spin"
                          style={{ width: 16, height: 16, color: "white" }}
                        />
                      ) : (
                        <Send
                          style={{
                            width: 16,
                            height: 16,
                            color:
                              !inputValue.trim() ? "#94a3b8" : "white",
                          }}
                        />
                      )}
                    </button>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 6,
                  }}
                >
                  <span style={{ color: "#94a3b8", fontSize: 10 }}>
                    Polling every {MSG_POLL_MS / 1000}s for new messages
                  </span>
                  <button
                    onClick={fetchMessages}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#cbd5e1",
                      padding: 0,
                    }}
                    title="Refresh messages"
                  >
                    <RefreshCw style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
