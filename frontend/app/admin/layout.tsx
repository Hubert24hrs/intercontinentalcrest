"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Globe, LayoutDashboard, Users, ArrowLeftRight, FileCheck,
  CreditCard, TrendingUp, ScrollText, Settings, Shield,
  Menu, X, Bell, LogOut, User, Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { authApi } from "@/lib/api";

const adminNav = [
  { icon: LayoutDashboard, label: "Dashboard",     href: "/admin" },
  { icon: Users,           label: "Customers",     href: "/admin/customers" },
  { icon: ArrowLeftRight,  label: "Transactions",  href: "/admin/transactions" },
  { icon: FileCheck,       label: "KYC",           href: "/admin/kyc" },
  { icon: CreditCard,      label: "Loans",         href: "/admin/loans" },
  { icon: TrendingUp,      label: "Investments",   href: "/admin/investments" },
  { icon: ScrollText,      label: "Audit Logs",    href: "/admin/audit" },
  { icon: Shield,          label: "Roles",         href: "/admin/roles" },
  { icon: Settings,        label: "Settings",      href: "/admin/settings" },
];

const bottomTabs = [
  { icon: LayoutDashboard, label: "Home",  href: "/admin" },
  { icon: Users,           label: "Users", href: "/admin/customers" },
  { icon: ArrowLeftRight,  label: "Txns",  href: "/admin/transactions" },
  { icon: FileCheck,       label: "KYC",   href: "/admin/kyc" },
];

/* ─── Shared sidebar markup ─────────────────────────────────────────── */
function SidebarContent({
  pathname,
  user,
  onClose,
  onLogout,
}: {
  pathname: string;
  user: any;
  onClose?: () => void;
  onLogout: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo row */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg,#00B7F1,#7DD3FC)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Globe style={{ width: 18, height: 18, color: "white" }} />
          </div>
          <div>
            <div style={{ color: "white", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", lineHeight: 1.2 }}>INTERCONTINENTAL</div>
            <div style={{ color: "#00B7F1", fontSize: 10, fontWeight: 700, letterSpacing: "0.25em", lineHeight: 1.2 }}>ADMIN</div>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "rgba(255,255,255,0.4)" }}>
            <X style={{ width: 20, height: 20 }} />
          </button>
        )}
      </div>

      {/* Admin badge */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
            background: "rgba(0,183,241,0.12)", border: "1px solid rgba(0,183,241,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Shield style={{ width: 18, height: 18, color: "#00B7F1" }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "white", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.fullName || "Super Admin"}
            </div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.email || "admin@intercontinentalcrest.com"}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 10, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "5px 10px" }}>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em" }}>Access Level</div>
          <div style={{ color: "#00B7F1", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", marginTop: 1 }}>
            {user?.role === "super_admin" ? "SUPER ADMINISTRATOR" : "ADMINISTRATOR"}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "10px 10px", overflowY: "auto" }}>
        {adminNav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", borderRadius: 12, marginBottom: 2,
                textDecoration: "none", fontSize: 13, fontWeight: 500,
                transition: "background 0.15s, color 0.15s",
                background: active ? "#00B7F1" : "transparent",
                color: active ? "white" : "rgba(255,255,255,0.5)",
              }}
            >
              <item.icon style={{ width: 16, height: 16, flexShrink: 0 }} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div style={{ padding: "10px 10px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <button
          onClick={onLogout}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 14px", borderRadius: 12, width: "100%",
            background: "none", border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.4)",
            transition: "color 0.15s, background 0.15s",
          }}
        >
          <LogOut style={{ width: 16, height: 16, flexShrink: 0 }} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

/* ─── Layout ──────────────────────────────────────────────────────────── */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    authApi
      .me()
      .then((res) => {
        const u = res.user;
        if (!u || !["admin", "super_admin"].includes(u.role)) {
          window.location.href = "/login?redirect=/admin";
          return;
        }
        setUser(u);
        setLoading(false);
      })
      .catch(() => {
        window.location.href = "/login?redirect=/admin";
      });
  }, []);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    localStorage.removeItem("cachedUser");
    localStorage.removeItem("accessToken");
    window.location.href = "/login";
  };

  /* Loading screen */
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#061729",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "linear-gradient(135deg,#00B7F1,#7DD3FC)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 16,
        }}>
          <Shield style={{ width: 28, height: 28, color: "white" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#94a3b8", fontSize: 13 }}>
          <Loader2 className="animate-spin" style={{ width: 16, height: 16, color: "#00B7F1" }} />
          Verifying admin credentials…
        </div>
      </div>
    );
  }

  const SIDEBAR_BG = "linear-gradient(180deg,#0d1f35 0%,#061729 100%)";

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex" }}>

      {/* ── Desktop sidebar (lg+) ──────────────────────────────────────── */}
      <div className="hidden lg:block" style={{ width: 256, flexShrink: 0 }}>
        <aside style={{
          position: "fixed", top: 0, left: 0, bottom: 0, width: 256,
          background: SIDEBAR_BG,
          borderRight: "1px solid rgba(255,255,255,0.05)",
          zIndex: 50, display: "flex", flexDirection: "column",
        }}>
          <SidebarContent pathname={pathname} user={user} onLogout={handleLogout} />
        </aside>
      </div>

      {/* ── Mobile drawer + overlay ─────────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
              style={{
                position: "fixed", inset: 0,
                background: "rgba(0,0,0,0.6)",
                zIndex: 40,
              }}
              className="lg:hidden"
            />
            <motion.aside
              key="drawer"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              style={{
                position: "fixed", top: 0, left: 0, bottom: 0, width: 272,
                background: SIDEBAR_BG,
                zIndex: 50, display: "flex", flexDirection: "column",
                boxShadow: "4px 0 30px rgba(0,0,0,0.4)",
              }}
              className="lg:hidden"
            >
              <SidebarContent
                pathname={pathname}
                user={user}
                onClose={() => setDrawerOpen(false)}
                onLogout={handleLogout}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main area ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: "100vh" }}>

        {/* Header */}
        <header style={{
          position: "sticky", top: 0, zIndex: 30,
          background: "white",
          borderBottom: "1px solid #f1f5f9",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 16px", height: 58,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Mobile hamburger */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden"
                style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: "#f8fafc", border: "1px solid #e2e8f0",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#64748b",
                }}
                aria-label="Open menu"
              >
                <Menu style={{ width: 18, height: 18 }} />
              </button>

              {/* Brand mark for mobile header */}
              <div className="lg:hidden" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "linear-gradient(135deg,#00B7F1,#7DD3FC)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Shield style={{ width: 14, height: 14, color: "white" }} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#0A2342", letterSpacing: "0.04em" }}>ADMIN PANEL</div>
              </div>

              {/* Desktop breadcrumb */}
              <div className="hidden lg:flex" style={{ alignItems: "center", gap: 8 }}>
                <span style={{
                  background: "#fef2f2", color: "#dc2626",
                  fontSize: 10, fontWeight: 700,
                  padding: "2px 8px", borderRadius: 999, letterSpacing: "0.06em",
                }}>ADMIN</span>
                <span style={{ color: "#94a3b8", fontSize: 13 }}>Control Panel</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button style={{
                width: 36, height: 36, borderRadius: 10,
                background: "#f8fafc", border: "1px solid #e2e8f0",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative",
              }}>
                <Bell style={{ width: 17, height: 17, color: "#64748b" }} />
                <span style={{
                  position: "absolute", top: 8, right: 8,
                  width: 7, height: 7, background: "#ef4444", borderRadius: "50%",
                }} />
              </button>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "#0A2342",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <User style={{ width: 16, height: 16, color: "white" }} />
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{
          flex: 1,
          padding: "20px 16px",
          paddingBottom: 84,   /* leaves room for mobile bottom nav */
          overflowX: "hidden",
        }} className="lg:p-6 lg:pb-6">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom navigation ────────────────────────────────────── */}
      <nav
        className="lg:hidden"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderTop: "1px solid #e2e8f0",
          display: "flex", alignItems: "center", justifyContent: "space-around",
          padding: "6px 8px 16px",
          zIndex: 40,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.07)",
        }}
      >
        {bottomTabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                textDecoration: "none", padding: "5px 10px", borderRadius: 12,
                color: active ? "#00B7F1" : "#94a3b8",
                fontSize: 9, fontWeight: 700, letterSpacing: "0.03em",
                transition: "color 0.15s",
              }}
            >
              <tab.icon style={{ width: 20, height: 20 }} />
              <span style={{ textTransform: "uppercase" }}>{tab.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            background: "none", border: "none", cursor: "pointer",
            padding: "5px 10px", borderRadius: 12,
            color: "#94a3b8", fontSize: 9, fontWeight: 700, letterSpacing: "0.03em",
          }}
        >
          <Menu style={{ width: 20, height: 20 }} />
          <span style={{ textTransform: "uppercase" }}>More</span>
        </button>
      </nav>
    </div>
  );
}
