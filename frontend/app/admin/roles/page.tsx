"use client";

import { useState } from "react";
import { Shield, Users, Key, Search, Plus, ShieldCheck, Check, AlertCircle } from "lucide-react";

interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: string[];
}

const initialRoles: Role[] = [
  { id: "R-1", name: "Super Admin", description: "Full system control, database migrations, configuration modification, and root access", userCount: 2, permissions: ["*"] },
  { id: "R-2", name: "Compliance Officer", description: "Audit review, KYC document approval, risk verification and AML reporting access", userCount: 4, permissions: ["kyc.review", "transactions.view", "audit.view", "reports.generate"] },
  { id: "R-3", name: "Support Agent", description: "Access to support tickets, user profile management, fee reversals and query logs", userCount: 15, permissions: ["users.view", "users.update", "transactions.view", "support.write"] },
  { id: "R-4", name: "Risk Manager", description: "Flag transactions, suspend suspicious user accounts, set platform limits", userCount: 3, permissions: ["users.suspend", "transactions.flag", "transactions.view", "limits.write"] }
];

const availablePermissions = [
  { key: "users.view", label: "View User Profiles" },
  { key: "users.update", label: "Update User details" },
  { key: "users.suspend", label: "Freeze/Suspend Accounts" },
  { key: "transactions.view", label: "View Transaction History" },
  { key: "transactions.flag", label: "Flag / Monitor Risk Scoring" },
  { key: "kyc.review", label: "Review & Approve Documents" },
  { key: "limits.write", label: "Edit Lending & Transfer Limits" },
  { key: "audit.view", label: "View Audit Logs" },
  { key: "reports.generate", label: "Generate Compliance Reports" },
  { key: "system.write", label: "Modify Platform Configurations" }
];

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [showAddRole, setShowAddRole] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState({ name: "", description: "", permissions: [] as string[] });

  const handleTogglePermission = (permKey: string) => {
    setNewRole(prev => {
      const exists = prev.permissions.includes(permKey);
      return {
        ...prev,
        permissions: exists 
          ? prev.permissions.filter(k => k !== permKey) 
          : [...prev.permissions, permKey]
      };
    });
  };

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoleId) {
      setRoles(prev => prev.map(r => r.id === editingRoleId
        ? { ...r, name: newRole.name, description: newRole.description, permissions: newRole.permissions }
        : r
      ));
    } else {
      setRoles(prev => [...prev, {
        id: `R-${prev.length + 1}`,
        name: newRole.name,
        description: newRole.description,
        userCount: 0,
        permissions: newRole.permissions,
      }]);
    }
    setShowAddRole(false);
    setEditingRoleId(null);
    setNewRole({ name: "", description: "", permissions: [] });
  };

  const handleEditRole = (role: Role) => {
    setEditingRoleId(role.id);
    setNewRole({ name: role.name, description: role.description, permissions: [...role.permissions] });
    setShowAddRole(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-bold text-brand-secondary text-2xl">Access Control & Roles</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage administrative levels, assign roles, and define strict RBAC rules.</p>
        </div>
        <button
          onClick={() => setShowAddRole(true)}
          className="btn-primary text-sm px-4 py-2.5"
        >
          <Plus className="w-4 h-4" />
          Create Security Role
        </button>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {roles.map((role) => (
          <div key={role.id} className="dashboard-card flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-brand-primary" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-brand-secondary text-base">{role.name}</h2>
                    <span className="font-mono text-[10px] text-gray-400 font-semibold">{role.id}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full font-medium">
                  <Users className="w-3.5 h-3.5" />
                  {role.userCount} Active Operators
                </div>
              </div>
              
              <p className="text-gray-500 text-sm mt-4 leading-relaxed">{role.description}</p>
              
              <div className="mt-5 space-y-2">
                <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Access Privileges</div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {role.permissions.includes("*") ? (
                    <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-1">
                      <Key className="w-3 h-3" />
                      All Permissions (*)
                    </span>
                  ) : (
                    role.permissions.map(perm => (
                      <span key={perm} className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-medium font-mono">
                        {perm}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mt-6 flex justify-between items-center">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                ISO 27001 Compliant Rule
              </span>
              <button
                onClick={() => handleEditRole(role)}
                className="text-xs text-brand-primary font-semibold hover:underline"
              >
                Edit Privileges
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Role Dialog Form */}
      {showAddRole && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <h2 className="font-display font-bold text-brand-secondary text-lg mb-2">{editingRoleId ? "Edit Security Role" : "Create Security Role"}</h2>
            <p className="text-gray-500 text-xs mb-4">Define a new access tier for support or compliance operators.</p>
            
            <form onSubmit={handleAddRole} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Role Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Risk Auditor"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  required
                  rows={2}
                  className="form-input"
                  placeholder="Summarize the core duties of this role..."
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Select Permissions</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-gray-100 rounded-xl bg-gray-50">
                  {availablePermissions.map((perm) => {
                    const isChecked = newRole.permissions.includes(perm.key);
                    return (
                      <div
                        key={perm.key}
                        onClick={() => handleTogglePermission(perm.key)}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors border ${
                          isChecked ? "bg-brand-primary/10 border-brand-primary text-brand-primary" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${isChecked ? "bg-brand-primary border-brand-primary" : "border-gray-300 bg-white"}`}>
                          {isChecked && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="text-xs">
                          <div className="font-semibold">{perm.label}</div>
                          <div className="text-[10px] opacity-75 font-mono">{perm.key}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setShowAddRole(false); setEditingRoleId(null); setNewRole({ name: "", description: "", permissions: [] }); }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary text-sm py-2.5"
                >
                  {editingRoleId ? "Save Changes" : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permission Matrix Info Section */}
      <div className="dashboard-card bg-gradient-to-r from-brand-secondary to-brand-muted text-white">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base">Principle of Least Privilege (PoLP)</h3>
            <p className="text-gray-300 text-sm mt-1 leading-relaxed max-w-2xl">
              Intercontinental Crest enforces strict role segregation. Security audits occur monthly, logging and reviewing all administrative actions to satisfy PCI-DSS and SOC 2 requirements. Ensure operators only have matching access permissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
