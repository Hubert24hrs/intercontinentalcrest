"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Globe, LayoutDashboard, ArrowLeftRight, Receipt, Users, PiggyBank,
  TrendingUp, Bell, Settings, LogOut, Menu, X, ChevronDown, User, Loader2, Coins, Briefcase, ScrollText, Wallet, Landmark
} from "lucide-react";
import { authApi, notificationsApi } from "@/lib/api";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: ArrowLeftRight, label: "Transfer Funds", href: "/dashboard/transfer" },
  { icon: Receipt, label: "Bill Payments", href: "/dashboard/bills" },
  { icon: Landmark, label: "Loans", href: "/dashboard/loans" },
  { icon: Coins, label: "Crypto Marketplace", href: "/dashboard/crypto" },
  { icon: Wallet, label: "Crypto Wallets", href: "/dashboard/wallets" },
  { icon: Briefcase, label: "Investment", href: "/dashboard/investments" },
  { icon: PiggyBank, label: "Transactions", href: "/dashboard/transactions" },
  { icon: ScrollText, label: "Statements", href: "/dashboard/statements" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [toast, setToast] = useState<{ id: string; title: string; message: string; type: string } | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Instant render: show dashboard immediately from cached user so
    // the loading spinner never blocks returning users.
    let loadedFromCache = false;
    const cachedRaw = localStorage.getItem('cachedUser');
    if (cachedRaw) {
      try {
        setUser(JSON.parse(cachedRaw));
        setLoading(false);
        loadedFromCache = true;
      } catch {
        localStorage.removeItem('cachedUser');
      }
    }

    // Validate the session in the background. Only show the spinner timeout
    // for brand-new visits where we have nothing cached to display yet.
    const authTimeout = loadedFromCache
      ? null
      : setTimeout(() => { window.location.href = "/login"; }, 8000);

    authApi.me()
      .then(res => {
        if (authTimeout) clearTimeout(authTimeout);
        setUser(res.user);
        localStorage.setItem('cachedUser', JSON.stringify(res.user));
        setLoading(false);
      })
      .catch(() => {
        if (authTimeout) clearTimeout(authTimeout);
        localStorage.removeItem('cachedUser');
        localStorage.removeItem('accessToken');
        window.location.href = "/login";
      });

    return () => { if (authTimeout) clearTimeout(authTimeout); };
  }, []);

  useEffect(() => {
    if (!user) return;
    notificationsApi.getMyNotifications()
      .then(res => {
        setNotifications(res || []);
      })
      .catch(err => {
        console.error("Failed to fetch notifications:", err);
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Derive WebSocket base URL from the same env var used for HTTP API
    const wsBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");
    const socket = io(wsBase, {
      query: { userId: user.id },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 3,
      timeout: 5000,
    });

    socket.on("connect", () => {
      console.log("WebSocket connected");
    });

    socket.on("connect_error", (err) => {
      // Real-time notifications unavailable — HTTP endpoints still work fine
      console.warn("WebSocket unavailable:", err.message);
    });

    socket.on("notification", (newNotif: any) => {
      setNotifications(prev => [newNotif, ...prev]);
      setToast({
        id: newNotif.id,
        title: newNotif.title || "Notification Received",
        message: newNotif.message,
        type: newNotif.type || "info",
      });
    });

    socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error("Logout failed", e);
    }
    localStorage.removeItem('cachedUser');
    localStorage.removeItem('accessToken');
    window.location.href = "/login";
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error("Failed to mark all notifications as read:", e);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error(`Failed to mark notification ${id} as read:`, e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center mb-4 animate-pulse">
          <Globe className="w-6 h-6 text-white" />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
          Verifying security credentials...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-brand-secondary flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0`}>
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-display font-bold text-white text-[10px] leading-tight">INTERCONTINENTAL</div>
              <div className="font-display font-bold text-brand-primary text-[10px] leading-tight tracking-widest">CREST</div>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-brand-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-white text-sm truncate" title={user?.fullName}>
                {user?.fullName || "Client"}
              </div>
              <div className="text-gray-400 text-[10px] truncate" title={user?.email}>
                {user?.email || "Personal Account"}
              </div>
            </div>
          </div>
          <div className="mt-3 bg-white/5 rounded-lg px-3 py-2">
            <div className="text-gray-400 text-xs">Account No.</div>
            <div className="text-brand-primary font-mono text-xs font-bold">IC-8812-9014</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-brand-primary text-white shadow-glow"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
          {user && (user.role === "admin" || user.role === "super_admin") && (
            <Link
              href="/admin/customers"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-brand-primary bg-brand-primary/10 hover:bg-brand-primary hover:text-white transition-all duration-200 mt-4"
            >
              <Globe className="w-5 h-5 flex-shrink-0" />
              Admin Portal
            </Link>
          )}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 w-full text-left"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                aria-label="Open sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <div className="text-xs text-gray-500">Welcome back,</div>
                <div className="font-display font-bold text-brand-secondary text-sm">{user?.fullName || "Client"}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="Notifications"
                  id="notif-btn"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {notifications.some(n => !n.isRead) && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <span className="font-display font-bold text-brand-secondary text-sm">Notifications</span>
                      {notifications.some(n => !n.isRead) && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-brand-primary font-medium cursor-pointer hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => !n.isRead && handleMarkRead(n.id)}
                          className={`px-4 py-3 text-sm hover:bg-gray-50/80 transition-colors cursor-pointer text-left ${n.isRead ? "opacity-60" : ""}`}
                        >
                          <div className="flex items-start gap-2">
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.isRead ? "bg-gray-300" : "bg-brand-primary"}`} />
                            <div className="flex-1 min-w-0">
                              <div className="text-gray-800 text-xs font-semibold">{n.title}</div>
                              <div className="text-gray-600 text-[11px] mt-0.5 leading-tight">{n.message}</div>
                              <div className="text-gray-400 text-[9px] mt-0.5">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {new Date(n.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {notifications.length === 0 && (
                        <div className="px-4 py-6 text-center text-gray-400 text-xs">
                          No notifications yet
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-brand-primary flex items-center justify-center cursor-pointer">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Bottom navigation bar for mobile users (premium US-banking look) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/80 py-2 px-6 flex items-center justify-between z-40 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.08)] rounded-t-3xl">
        {[
          { label: "Home", href: "/dashboard", icon: LayoutDashboard },
          { label: "Transfer", href: "/dashboard/transfer", icon: ArrowLeftRight },
          { label: "Crypto", href: "/dashboard/crypto", icon: Coins },
          { label: "Wallets", href: "/dashboard/wallets", icon: Wallet },
        ].map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-colors ${
                active ? "text-brand-primary" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <item.icon className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        {/* Menu toggle for remaining options */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
          <span>Menu</span>
        </button>
      </nav>

      {/* Live Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full bg-[#0A2342] text-white rounded-2xl shadow-2xl border border-white/10 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center flex-shrink-0">
                <Bell className="w-4 h-4 text-brand-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-brand-primary uppercase tracking-wider">{toast.title}</div>
                <div className="text-sm font-medium mt-1 text-white/90 leading-snug">{toast.message}</div>
              </div>
              <button onClick={() => setToast(null)} className="text-white/40 hover:text-white transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  handleMarkRead(toast.id);
                  setToast(null);
                }}
                className="text-[10px] text-brand-primary font-bold hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
