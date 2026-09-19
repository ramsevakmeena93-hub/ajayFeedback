import React, { useState } from 'react';
import { Shield, Plus, Check, X, ShieldAlert, Copy, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RolePermissions() {
  const [roles, setRoles] = useState([
    { id: 'admin', name: 'Admin', desc: 'Full System Control & System Config', usersCount: 2, isBuiltin: true },
    { id: 'vc', name: 'Vice Chancellor (VC)', desc: 'Executive Oversight & Signatures', usersCount: 1, isBuiltin: true },
    { id: 'hod', name: 'HOD', desc: 'Department Head & Faculty Oversight', usersCount: 4, isBuiltin: true },
    { id: 'faculty', name: 'Faculty', desc: 'Teaching Staff & Self Feedback', usersCount: 18, isBuiltin: true },
  ]);

  const [selectedRole, setSelectedRole] = useState(roles[0]);
  const [permissions, setPermissions] = useState({
    'can_view_dashboard': 'allow',
    'can_manage_users': 'allow',
    'can_assign_hod': 'allow',
    'can_manage_signatures': 'allow',
    'can_export_reports': 'allow',
    'can_view_analytics': 'allow',
    'can_edit_settings': 'allow',
    'can_moderate_feedback': 'allow',
  });

  function togglePermission(key) {
    const current = permissions[key] || 'allow';
    const next = current === 'allow' ? 'deny' : current === 'deny' ? 'inherit' : 'allow';
    setPermissions({ ...permissions, [key]: next });
    toast.success(`Permission '${key}' set to ${next.toUpperCase()}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="text-indigo-600 dark:text-indigo-400" /> Dynamic Role & Granular RBAC Permissions
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Modify access rules (Allow / Deny / Inherit) for Admin, VC, HOD, and Faculty.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">System Roles</h2>
          </div>

          <div className="space-y-2">
            {roles.map(r => (
              <div 
                key={r.id} 
                onClick={() => setSelectedRole(r)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedRole.id === r.id 
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100 shadow-sm' 
                    : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="font-bold text-sm">{r.name}</div>
                  <div className="text-[11px] text-slate-400">{r.desc}</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {r.usersCount} users
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Permissions Grid */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                Permissions for <span className="text-indigo-600 dark:text-indigo-400">{selectedRole.name}</span>
              </h2>
              <span className="text-xs text-slate-400">Click any permission node to toggle state: Allow &rarr; Deny &rarr; Inherit</span>
            </div>
            <button 
              onClick={() => toast.success('Role permissions saved')} 
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
            >
              Save Configuration
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(permissions).map(([key, val]) => (
              <div 
                key={key} 
                onClick={() => togglePermission(key)}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer flex items-center justify-between"
              >
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">{key.replace(/_/g, ' ')}</span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                  val === 'allow' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                  val === 'deny' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400' :
                  'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                }`}>
                  {val}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
