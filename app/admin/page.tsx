"use client";

import Link from "next/link";
import {
  Users, ArrowLeftRight, FileCheck, CreditCard, TrendingUp,
  TrendingDown, AlertTriangle, ArrowUpRight, Activity, Clock
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";

const platformData = [
  { day: "Mon", users: 145, tx: 892 },
  { day: "Tue", users: 178, tx: 1024 },
  { day: "Wed", users: 162, tx: 956 },
  { day: "Thu", users: 205, tx: 1180 },
  { day: "Fri", users: 231, tx: 1350 },
  { day: "Sat", users: 89, tx: 623 },
  { day: "Sun", users: 67, tx: 480 },
];

const recentActivity = [
  { type: "new_user", msg: "New user registered — sarah.jones@gmail.com", time: "2 min ago", severity: "info" },
  { type: "flagged", msg: "Transaction flagged for review — TXN-8821 ($15,000)", time: "8 min ago", severity: "warning" },
  { type: "kyc", msg: "KYC submitted — James Okonkwo, pending review", time: "15 min ago", severity: "info" },
  { type: "loan", msg: "Loan application approved — $45,000 personal loan", time: "32 min ago", severity: "success" },
  { type: "failed", msg: "Failed login attempt × 5 — IP 192.168.1.245 locked", time: "1 hr ago", severity: "error" },
  { type: "withdrawal", msg: "Large withdrawal alert — $25,000 wire transfer", time: "2 hr ago", severity: "warning" },
];

const sevColors: Record<string, string> = {
  info: "bg-blue-100 text-blue-600",
  warning: "bg-yellow-100 text-yellow-700",
  success: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-600",
};

export default function AdminDashboard() {
  const stats = [
    { label: "Total Customers", value: "5,284,120", change: "+2.4%", up: true, icon: Users, href: "/admin/customers" },
    { label: "Transactions Today", value: "8,492", change: "+12.1%", up: true, icon: ArrowLeftRight, href: "/admin/transactions" },
    { label: "Pending KYC", value: "243", change: "+18", up: false, icon: FileCheck, href: "/admin/kyc" },
    { label: "Active Loans", value: "12,847", change: "+5.2%", up: true, icon: CreditCard, href: "/admin/loans" },
    { label: "Assets Under Mgmt", value: "$2.4B", change: "+$84M", up: true, icon: TrendingUp, href: "/admin/investments" },
    { label: "Flagged Transactions", value: "38", change: "-5 resolved", up: true, icon: AlertTriangle, href: "/admin/transactions" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-brand-secondary text-2xl">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Platform overview and key metrics</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="dashboard-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-2xl bg-brand-primary/10 group-hover:bg-brand-primary flex items-center justify-center transition-colors">
                <s.icon className="w-5 h-5 text-brand-primary group-hover:text-white transition-colors" />
              </div>
              <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${s.up ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                {s.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {s.change}
              </span>
            </div>
            <div className="font-display font-bold text-2xl text-brand-secondary mb-1">{s.value}</div>
            <div className="text-gray-500 text-xs font-medium">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-bold text-brand-secondary text-base">New Registrations</h2>
              <p className="text-gray-500 text-xs">This week</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={platformData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", fontSize: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="users" fill="#00B7F1" radius={[4, 4, 0, 0]} name="New Users" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-bold text-brand-secondary text-base">Transaction Volume</h2>
              <p className="text-gray-500 text-xs">This week</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={platformData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", fontSize: 12 }} />
              <Line type="monotone" dataKey="tx" stroke="#0A2342" strokeWidth={2.5} dot={{ fill: "#0A2342", r: 4 }} name="Transactions" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-brand-secondary text-base">Live Activity Feed</h2>
            <p className="text-gray-500 text-xs">Real-time platform events</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live
          </div>
        </div>
        <div className="space-y-3">
          {recentActivity.map((a, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <div className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${sevColors[a.severity]}`}>
                {a.severity}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-700 leading-snug">{a.msg}</div>
                <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
                  <Clock className="w-3 h-3" />
                  {a.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
