"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft,
  DollarSign, CreditCard, PiggyBank, Globe, ArrowRight, Eye, EyeOff
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const balanceData = [
  { month: "Jan", balance: 18400 },
  { month: "Feb", balance: 21200 },
  { month: "Mar", balance: 19800 },
  { month: "Apr", balance: 24600 },
  { month: "May", balance: 22100 },
  { month: "Jun", balance: 28900 },
];

const incomeExpenseData = [
  { month: "Jan", income: 5200, expense: 3100 },
  { month: "Feb", income: 4800, expense: 2900 },
  { month: "Mar", income: 5600, expense: 3800 },
  { month: "Apr", income: 6100, expense: 2700 },
  { month: "May", income: 5400, expense: 3200 },
  { month: "Jun", income: 7200, expense: 3600 },
];

const categoryData = [
  { name: "Housing", value: 35, color: "#00B7F1" },
  { name: "Food", value: 20, color: "#0A2342" },
  { name: "Transport", value: 15, color: "#7DD3FC" },
  { name: "Savings", value: 20, color: "#10B981" },
  { name: "Other", value: 10, color: "#94A3B8" },
];

const transactions = [
  { id: 1, type: "credit", desc: "Salary Deposit", amount: 7200, date: "Jun 1", category: "Income", status: "completed" },
  { id: 2, type: "debit", desc: "Netflix Subscription", amount: 15.99, date: "Jun 3", category: "Entertainment", status: "completed" },
  { id: 3, type: "debit", desc: "Grocery Store", amount: 142.50, date: "Jun 5", category: "Food", status: "completed" },
  { id: 4, type: "credit", desc: "Freelance Payment", amount: 850, date: "Jun 7", category: "Income", status: "completed" },
  { id: 5, type: "debit", desc: "International Transfer", amount: 2500, date: "Jun 8", category: "Transfer", status: "pending" },
  { id: 6, type: "debit", desc: "Electric Bill", amount: 89.40, date: "Jun 10", category: "Utilities", status: "completed" },
];

export default function DashboardPage() {
  const [hideBalance, setHideBalance] = useState(false);

  const accounts = [
    { label: "Total Balance", amount: 28900.42, icon: DollarSign, color: "from-brand-primary to-blue-400", sub: "+$1,240 this month" },
    { label: "Savings Account", amount: 14500.00, icon: PiggyBank, color: "from-brand-secondary to-brand-muted", sub: "4.5% APY" },
    { label: "Checking Account", amount: 9800.42, icon: CreditCard, color: "from-indigo-500 to-brand-primary", sub: "Available balance" },
    { label: "Investments", amount: 4600.00, icon: TrendingUp, color: "from-emerald-500 to-teal-400", sub: "+18.4% YTD" },
  ];

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-brand-secondary text-2xl">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm mt-0.5">Welcome back, John. Here&apos;s your financial summary.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setHideBalance(!hideBalance)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 hover:border-brand-primary transition-colors shadow-sm"
          >
            {hideBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {hideBalance ? "Show" : "Hide"} Balance
          </button>
          <Link href="/dashboard/transfer" className="btn-primary text-sm px-4 py-2.5">
            New Transfer
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Account summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {accounts.map((acc) => (
          <div
            key={acc.label}
            className={`relative rounded-2xl p-5 text-white overflow-hidden bg-gradient-to-br ${acc.color}`}
            style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/80 text-xs font-medium">{acc.label}</span>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <acc.icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="font-display font-bold text-2xl mb-1">
                {hideBalance ? "••••••" : `$${acc.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
              </div>
              <div className="text-white/70 text-xs">{acc.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Balance trend */}
        <div className="dashboard-card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-bold text-brand-secondary text-base">Balance Trend</h2>
              <p className="text-gray-500 text-xs mt-0.5">Last 6 months</p>
            </div>
            <div className="flex items-center gap-1 text-green-600 text-xs font-semibold bg-green-50 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" />
              +57%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={balanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Balance"]} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Line type="monotone" dataKey="balance" stroke="#00B7F1" strokeWidth={2.5} dot={{ fill: "#00B7F1", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Expense categories */}
        <div className="dashboard-card">
          <div className="mb-5">
            <h2 className="font-display font-bold text-brand-secondary text-base">Spending</h2>
            <p className="text-gray-500 text-xs mt-0.5">By category</p>
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v}%`, "Share"]} contentStyle={{ borderRadius: 12, fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-2">
            {categoryData.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-gray-600">{c.name}</span>
                </div>
                <span className="font-semibold text-gray-700">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Income vs Expense + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Income vs Expense bar chart */}
        <div className="dashboard-card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-bold text-brand-secondary text-base">Income vs Expense</h2>
              <p className="text-gray-500 text-xs mt-0.5">Last 6 months</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-brand-primary" /><span className="text-gray-500">Income</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-brand-secondary" /><span className="text-gray-500">Expense</span></div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={incomeExpenseData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v: number) => [`$${v.toLocaleString()}`]} />
              <Bar dataKey="income" fill="#00B7F1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#0A2342" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick actions */}
        <div className="dashboard-card">
          <h2 className="font-display font-bold text-brand-secondary text-base mb-5">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { label: "Send Money", href: "/dashboard/transfer", icon: ArrowUpRight, color: "text-brand-primary bg-brand-primary/10" },
              { label: "Receive Money", href: "/dashboard/transfer", icon: ArrowDownLeft, color: "text-green-600 bg-green-100" },
              { label: "Pay Bills", href: "/dashboard/bills", icon: Receipt, color: "text-purple-600 bg-purple-100" },
              { label: "International", href: "/dashboard/transfer", icon: Globe, color: "text-orange-600 bg-orange-100" },
            ].map(({ label, href, icon: Icon, color }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-brand-primary transition-colors">{label}</span>
                <ArrowRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-brand-primary transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-brand-secondary text-base">Recent Transactions</h2>
            <p className="text-gray-500 text-xs mt-0.5">Your latest account activity</p>
          </div>
          <Link href="/dashboard/transactions" className="text-xs text-brand-primary font-semibold hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left py-3 pr-4 font-medium">Description</th>
                <th className="text-left py-3 pr-4 font-medium hidden sm:table-cell">Category</th>
                <th className="text-left py-3 pr-4 font-medium hidden md:table-cell">Date</th>
                <th className="text-left py-3 pr-4 font-medium">Status</th>
                <th className="text-right py-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${tx.type === "credit" ? "bg-green-100" : "bg-red-100"}`}>
                        {tx.type === "credit" ? (
                          <ArrowDownLeft className="w-4 h-4 text-green-600" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <span className="font-medium text-brand-secondary text-sm">{tx.desc}</span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 text-gray-500 text-xs hidden sm:table-cell">{tx.category}</td>
                  <td className="py-3.5 pr-4 text-gray-500 text-xs hidden md:table-cell">{tx.date}</td>
                  <td className="py-3.5 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tx.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className={`py-3.5 text-right font-display font-bold text-sm ${tx.type === "credit" ? "text-green-600" : "text-red-500"}`}>
                    {tx.type === "credit" ? "+" : "-"}${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Fix missing import
function Receipt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
      <path d="M16 8H8M16 12H8M12 16H8" />
    </svg>
  );
}
