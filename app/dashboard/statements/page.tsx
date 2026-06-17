"use client";

import { Download, FileText, Calendar } from "lucide-react";

const statements = [
  { period: "June 2025", from: "2025-06-01", to: "2025-06-17", txCount: 12, credits: 8062.00, debits: 2991.87, closing: 28900.42 },
  { period: "May 2025", from: "2025-05-01", to: "2025-05-31", txCount: 28, credits: 6800.00, debits: 4320.10, closing: 23829.29 },
  { period: "April 2025", from: "2025-04-01", to: "2025-04-30", txCount: 31, credits: 5200.00, debits: 3745.20, closing: 21349.39 },
  { period: "March 2025", from: "2025-03-01", to: "2025-03-31", txCount: 24, credits: 5600.00, debits: 4100.00, closing: 19894.59 },
  { period: "February 2025", from: "2025-02-01", to: "2025-02-28", txCount: 19, credits: 4800.00, debits: 2900.00, closing: 18394.59 },
  { period: "January 2025", from: "2025-01-01", to: "2025-01-31", txCount: 22, credits: 5200.00, debits: 3100.00, closing: 16494.59 },
];

export default function StatementsPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="font-display font-bold text-brand-secondary text-2xl">Account Statements</h1>
        <p className="text-gray-500 text-sm mt-0.5">Download monthly statements for your records</p>
      </div>

      <div className="dashboard-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left py-3 pr-4 font-medium">Period</th>
                <th className="text-left py-3 pr-4 font-medium hidden sm:table-cell">Transactions</th>
                <th className="text-left py-3 pr-4 font-medium hidden md:table-cell">Credits</th>
                <th className="text-left py-3 pr-4 font-medium hidden md:table-cell">Debits</th>
                <th className="text-left py-3 pr-4 font-medium">Closing Balance</th>
                <th className="text-right py-3 font-medium">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {statements.map((s) => (
                <tr key={s.period} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-brand-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-brand-secondary text-sm">{s.period}</div>
                        <div className="text-gray-400 text-xs">{s.from} — {s.to}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 pr-4 text-gray-600 text-sm hidden sm:table-cell">{s.txCount} transactions</td>
                  <td className="py-4 pr-4 text-green-600 font-semibold text-sm hidden md:table-cell">+${s.credits.toLocaleString()}</td>
                  <td className="py-4 pr-4 text-red-500 font-semibold text-sm hidden md:table-cell">-${s.debits.toLocaleString()}</td>
                  <td className="py-4 pr-4 font-display font-bold text-brand-secondary text-sm">${s.closing.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  <td className="py-4 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:border-brand-primary hover:text-brand-primary transition-colors">
                        <FileText className="w-3.5 h-3.5" />
                        PDF
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:border-brand-primary hover:text-brand-primary transition-colors">
                        <Download className="w-3.5 h-3.5" />
                        CSV
                      </button>
                    </div>
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
