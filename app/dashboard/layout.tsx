"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Globe, LayoutDashboard, ArrowLeftRight, Receipt, Users, PiggyBank,
  TrendingUp, Bell, Settings, LogOut, Menu, X, ChevronDown, User
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: ArrowLeftRight, label: "Transfer Funds", href: "/dashboard/transfer" },
  { icon: Receipt, label: "Bill Payments", href: "/dashboard/bills" },
  { icon: Users, label: "Beneficiaries", href: "/dashboard/beneficiaries" },
  { icon: PiggyBank, label: "Transactions", href: "/dashboard/transactions" },
  { icon: TrendingUp, label: "Statements", href: "/dashboard/statements" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const pathname = usePathname();

  const notifications = [
    { id: 1, text: "Transfer of $500 completed", time: "2 min ago", read: false },
    { id: 2, text: "New login from Chrome, Windows", time: "1 hr ago", read: false },
    { id: 3, text: "Monthly statement is ready", time: "1 day ago", read: true },
    { id: 4, text: "KYC verification approved", time: "2 days ago", read: true },
  ];

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
            <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-white text-sm">John Doe</div>
              <div className="text-gray-400 text-xs">Personal Account</div>
            </div>
          </div>
          <div className="mt-3 bg-white/5 rounded-lg px-3 py-2">
            <div className="text-gray-400 text-xs">Account No.</div>
            <div className="text-brand-primary font-mono text-sm font-bold">IC-7842-0021</div>
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
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <Link
            href="/login"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            Sign Out
          </Link>
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
                <div className="font-display font-bold text-brand-secondary text-sm">John Doe</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  aria-label="Notifications"
                  id="notif-btn"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <span className="font-display font-bold text-brand-secondary text-sm">Notifications</span>
                      <span className="text-xs text-brand-primary font-medium cursor-pointer">Mark all read</span>
                    </div>
                    <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className={`px-4 py-3 text-sm ${n.read ? "opacity-60" : ""}`}>
                          <div className="flex items-start gap-2">
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.read ? "bg-gray-300" : "bg-brand-primary"}`} />
                            <div>
                              <div className="text-gray-800 text-xs">{n.text}</div>
                              <div className="text-gray-400 text-xs mt-0.5">{n.time}</div>
                            </div>
                          </div>
                        </div>
                      ))}
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
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
