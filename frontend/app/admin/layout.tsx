"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Globe, LayoutDashboard, Users, ArrowLeftRight, FileCheck,
  CreditCard, TrendingUp, ScrollText, Settings, Shield,
  Menu, X, Bell, LogOut, ChevronDown, User
} from "lucide-react";

const adminNav = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Users, label: "Customers", href: "/admin/customers" },
  { icon: ArrowLeftRight, label: "Transactions", href: "/admin/transactions" },
  { icon: FileCheck, label: "KYC Management", href: "/admin/kyc" },
  { icon: CreditCard, label: "Loans", href: "/admin/loans" },
  { icon: TrendingUp, label: "Investments", href: "/admin/investments" },
  { icon: ScrollText, label: "Audit Logs", href: "/admin/audit" },
  { icon: Shield, label: "Roles", href: "/admin/roles" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-brand-dark flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0`}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-display font-bold text-white text-[10px]">INTERCONTINENTAL</div>
              <div className="font-display font-bold text-brand-primary text-[10px] tracking-widest">ADMIN</div>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin badge */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-primary/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-brand-primary" />
            </div>
            <div>
              <div className="text-white text-sm font-semibold">Super Admin</div>
              <div className="text-gray-400 text-xs">admin@intercrest.com</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {adminNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active ? "bg-brand-primary text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}>
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Link>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100">
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">ADMIN</span>
                <span className="text-gray-500 text-sm hidden sm:block">Control Panel</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-xl hover:bg-gray-100">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="w-9 h-9 rounded-full bg-brand-secondary flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
