"use client";

import { useState } from "react";
import { Search, MoreVertical, UserCheck, UserX, Eye, Edit } from "lucide-react";

const customers = [
  { id: "C001", name: "James Okonkwo", email: "james.okonkwo@gmail.com", phone: "+234 801 234 5678", country: "Nigeria", status: "active", kyc: "verified", joined: "2024-01-15", balance: "$12,450.00" },
  { id: "C002", name: "Sarah Mitchell", email: "sarah.mitchell@yahoo.com", phone: "+1 212 555 0192", country: "USA", status: "active", kyc: "verified", joined: "2024-02-28", balance: "$88,200.00" },
  { id: "C003", name: "David Chen", email: "dchen@techcorp.sg", phone: "+65 9123 4567", country: "Singapore", status: "active", kyc: "verified", joined: "2024-03-10", balance: "$45,000.00" },
  { id: "C004", name: "Amina Yusuf", email: "amina.y@outlook.com", phone: "+971 50 123 4567", country: "UAE", status: "suspended", kyc: "pending", joined: "2024-04-01", balance: "$3,200.00" },
  { id: "C005", name: "Michael Torres", email: "mtorres.md@gmail.com", phone: "+1 305 555 0178", country: "USA", status: "active", kyc: "verified", joined: "2024-04-12", balance: "$156,800.00" },
  { id: "C006", name: "Lisa Bergmann", email: "lisa.bergmann@berlinstores.de", phone: "+49 30 1234 5678", country: "Germany", status: "active", kyc: "verified", joined: "2024-05-08", balance: "$32,100.00" },
  { id: "C007", name: "Ahmed Al-Rashid", email: "ahmed.rashid@kmail.com", phone: "+966 55 123 4567", country: "Saudi Arabia", status: "inactive", kyc: "rejected", joined: "2024-05-20", balance: "$890.00" },
  { id: "C008", name: "Priya Sharma", email: "priya.sharma@infosys.com", phone: "+91 98765 43210", country: "India", status: "active", kyc: "pending", joined: "2024-06-01", balance: "$8,750.00" },
];

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  suspended: "bg-red-100 text-red-600",
  inactive: "bg-gray-100 text-gray-600",
};

const kycColors: Record<string, string> = {
  verified: "bg-blue-100 text-blue-700",
  pending: "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-600",
};

export default function AdminCustomersPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filtered = customers.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-brand-secondary text-2xl">Customer Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">{customers.length.toLocaleString()} total registered customers</p>
        </div>
        <button className="btn-primary text-sm px-4 py-2.5">+ Add Customer</button>
      </div>

      {/* Filters */}
      <div className="dashboard-card">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" className="form-input pl-10" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="form-input max-w-xs" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left py-3 pr-4 font-medium">Customer</th>
                <th className="text-left py-3 pr-4 font-medium hidden md:table-cell">Country</th>
                <th className="text-left py-3 pr-4 font-medium">Status</th>
                <th className="text-left py-3 pr-4 font-medium">KYC</th>
                <th className="text-left py-3 pr-4 font-medium hidden lg:table-cell">Balance</th>
                <th className="text-left py-3 pr-4 font-medium hidden lg:table-cell">Joined</th>
                <th className="text-right py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-sm flex-shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-brand-secondary text-sm">{c.name}</div>
                        <div className="text-gray-400 text-xs">{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 text-gray-600 text-sm hidden md:table-cell">{c.country}</td>
                  <td className="py-3.5 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.status]}`}>{c.status}</span>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${kycColors[c.kyc]}`}>{c.kyc}</span>
                  </td>
                  <td className="py-3.5 pr-4 text-brand-secondary font-mono text-sm font-semibold hidden lg:table-cell">{c.balance}</td>
                  <td className="py-3.5 pr-4 text-gray-500 text-xs hidden lg:table-cell">{c.joined}</td>
                  <td className="py-3.5 text-right">
                    <div className="relative inline-block">
                      <button onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openMenu === c.id && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 z-10 overflow-hidden">
                          {[
                            { icon: Eye, label: "View Profile" },
                            { icon: Edit, label: "Edit Customer" },
                            { icon: UserCheck, label: "Activate" },
                            { icon: UserX, label: "Suspend", danger: true },
                          ].map(({ icon: Icon, label, danger }) => (
                            <button key={label} onClick={() => setOpenMenu(null)} className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs transition-colors ${danger ? "text-red-500 hover:bg-red-50" : "text-gray-700 hover:bg-gray-50"}`}>
                              <Icon className="w-3.5 h-3.5" />
                              {label}
                            </button>
                          ))}
                        </div>
                      )}
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
