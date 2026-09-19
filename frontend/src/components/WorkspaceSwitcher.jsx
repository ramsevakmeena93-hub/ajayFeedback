/**
 * WorkspaceSwitcher — the role/workspace context switcher shown in the Navbar.
 *
 * Only renders if the user holds MORE than one role (multi-role users).
 * Single-role users never see it — zero visual noise for the common case.
 *
 * On switch:
 *  1. Calls POST /api/workspace/switch with the target workspace
 *  2. Backend validates the role from DB, issues a fresh JWT
 *  3. AuthContext replaces the stored token + user with the new ones
 *  4. React Router navigates to the target workspace's home route
 *  5. An AuditLog entry is written server-side automatically
 *
 * The frontend NEVER trusts its own role state for switching — the backend
 * re-validates every switch request.
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  ChevronDown, LayoutDashboard, Users, GraduationCap,
  Shield, RefreshCw, CheckCircle2,
} from 'lucide-react';

// Workspace metadata — label, icon, home route, colours
const WORKSPACE_CONFIG = {
  hod: {
    label:      'HOD Workspace',
    shortLabel: 'HOD',
    icon:       Users,
    home:       '/hod',
    badge:      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    ring:       'ring-blue-400',
    dot:        'bg-blue-500',
    gradient:   'from-blue-600 to-blue-700',
  },
  faculty: {
    label:      'Faculty Workspace',
    shortLabel: 'Faculty',
    icon:       GraduationCap,
    home:       '/faculty',
    badge:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    ring:       'ring-emerald-400',
    dot:        'bg-emerald-500',
    gradient:   'from-emerald-600 to-emerald-700',
  },
  vc: {
    label:      'VC Workspace',
    shortLabel: 'VC',
    icon:       Shield,
    home:       '/vc',
    badge:      'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    ring:       'ring-violet-400',
    dot:        'bg-violet-500',
    gradient:   'from-violet-600 to-purple-700',
  },
  admin: {
    label:      'Admin Workspace',
    shortLabel: 'Admin',
    icon:       LayoutDashboard,
    home:       '/admin',
    badge:      'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    ring:       'ring-rose-400',
    dot:        'bg-rose-500',
    gradient:   'from-rose-600 to-rose-700',
  },
};

export default function WorkspaceSwitcher() {
  const { user, token, login } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen]         = useState(false);
  const [switching, setSwitching] = useState(false);
  const ref = useRef();

  // Only show for multi-role users
  const availableRoles = user?.roles || (user?.role ? [user.role] : []);
  if (availableRoles.length <= 1) return null;

  const activeWS  = user?.activeWorkspace || user?.role || 'hod';
  const activeCfg = WORKSPACE_CONFIG[activeWS] || WORKSPACE_CONFIG.hod;
  const ActiveIcon = activeCfg.icon;

  // Close on outside click
  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  async function handleSwitch(workspace) {
    if (workspace === activeWS || switching) return;
    setOpen(false);
    setSwitching(true);

    try {
      const { data } = await axios.post(
        '/api/workspace/switch',
        { workspace },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Replace auth state with fresh token + updated user
      login(data.user, data.token);

      const cfg = WORKSPACE_CONFIG[workspace] || WORKSPACE_CONFIG.hod;
      toast.success(`Switched to ${cfg.label}`, {
        icon: '🔄',
        duration: 2500,
      });

      // Navigate to the new workspace home
      navigate(cfg.home, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || 'Workspace switch failed';
      toast.error(msg);
      console.error('[WorkspaceSwitcher]', msg);
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        disabled={switching}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`
          flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-sm font-semibold
          transition-all duration-150 select-none
          ${activeCfg.badge}
          border-current/20 hover:opacity-90
          disabled:opacity-60 disabled:cursor-not-allowed
        `}
      >
        {switching ? (
          <RefreshCw size={13} className="animate-spin shrink-0" />
        ) : (
          <ActiveIcon size={13} className="shrink-0" />
        )}
        <span className="hidden sm:inline">{activeCfg.shortLabel}</span>
        <ChevronDown
          size={11}
          className={`shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          aria-label="Switch workspace"
          className="
            absolute right-0 top-full mt-2 w-64
            bg-white dark:bg-slate-900
            rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800
            overflow-hidden z-50
            animate-scale-in
          "
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Switch Workspace
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Only changes your operational context
            </p>
          </div>

          {/* Workspace options */}
          <div className="p-2 space-y-0.5">
            {availableRoles.map(ws => {
              const cfg  = WORKSPACE_CONFIG[ws];
              if (!cfg) return null;
              const Icon = cfg.icon;
              const isActive = ws === activeWS;

              return (
                <button
                  key={ws}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleSwitch(ws)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                    transition-all duration-100 text-left
                    ${isActive
                      ? 'bg-slate-100 dark:bg-slate-800 cursor-default'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer'
                    }
                  `}
                >
                  {/* Coloured icon */}
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                    bg-gradient-to-br ${cfg.gradient} shadow-sm
                  `}>
                    <Icon size={15} className="text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold leading-tight truncate ${
                      isActive
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {cfg.label}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {isActive ? 'Current workspace' : `Switch to ${cfg.shortLabel} mode`}
                    </p>
                  </div>

                  {isActive && (
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug">
              Switching workspace keeps your account. Only your operational view changes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
