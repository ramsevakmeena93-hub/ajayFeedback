/**
 * NotificationsSection — Real admin notification centre.
 *
 * Detects and surfaces 5 types of issues automatically:
 *
 *  1. NEW USERS       — recently registered accounts (last 48h)
 *  2. SYSTEM ERRORS   — unresolved backend errors from SystemLog
 *  3. SYSTEM WARNINGS — unresolved backend warnings from SystemLog
 *  4. CONFLICTS       — submissions stuck in 'conflict' status (self-approval)
 *  5. ESCALATIONS     — submissions in 'escalated' status (admin action needed)
 *
 * Auto-refreshes every 30 seconds.
 * Bell badge count in AdminLayout is driven by this component via a prop callback.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell, AlertTriangle, UserPlus, ShieldAlert,
  CheckCircle, RefreshCw, X, Info, Zap,
  Users, FileWarning, Clock,
} from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';

// ── Type config ───────────────────────────────────────────────────────────────
const TYPE_CFG = {
  escalation: {
    icon:  ShieldAlert,
    color: 'text-red-600 dark:text-red-400',
    bg:    'bg-red-50 dark:bg-red-950/40',
    badge: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300',
    label: 'Escalation',
  },
  conflict: {
    icon:  AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bg:    'bg-amber-50 dark:bg-amber-950/40',
    badge: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
    label: 'Conflict',
  },
  error: {
    icon:  FileWarning,
    color: 'text-rose-600 dark:text-rose-400',
    bg:    'bg-rose-50 dark:bg-rose-950/40',
    badge: 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300',
    label: 'System Error',
  },
  warning: {
    icon:  Zap,
    color: 'text-orange-500 dark:text-orange-400',
    bg:    'bg-orange-50 dark:bg-orange-950/40',
    badge: 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300',
    label: 'Warning',
  },
  user: {
    icon:  UserPlus,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg:    'bg-indigo-50 dark:bg-indigo-950/40',
    badge: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300',
    label: 'New User',
  },
  info: {
    icon:  Info,
    color: 'text-slate-500',
    bg:    'bg-slate-50 dark:bg-slate-800/40',
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    label: 'Info',
  },
};

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function NotificationsSection({ onCountChange }) {
  const [notifs,   setNotifs]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all'); // all | unread | escalation | conflict | error | user
  const [dismissed, setDismissed] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('admin_dismissed_notifs') || '[]')); }
    catch { return new Set(); }
  });

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/notifications');
      const raw = Array.isArray(res.data) ? res.data : [];
      setNotifs(raw);
      // Count unread (not dismissed, not resolved)
      const unread = raw.filter(n => !dismissed.has(n.id) && !n.read).length;
      onCountChange?.(unread);
    } catch {
      // Silently fail — don't toast on background refresh
    } finally {
      setLoading(false);
    }
  }, [dismissed, onCountChange]);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  function dismiss(id) {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    localStorage.setItem('admin_dismissed_notifs', JSON.stringify([...next]));
    const unread = notifs.filter(n => !next.has(n.id) && !n.read).length;
    onCountChange?.(unread);
  }

  function dismissAll() {
    const next = new Set(notifs.map(n => n.id));
    setDismissed(next);
    localStorage.setItem('admin_dismissed_notifs', JSON.stringify([...next]));
    onCountChange?.(0);
    toast.success('All notifications dismissed');
  }

  async function resolveLog(logId) {
    try {
      await api.patch(`/api/admin/logs/${logId}/resolve`, { resolution: 'Acknowledged by admin' });
      toast.success('Log marked resolved');
      fetchNotifs();
    } catch { toast.error('Failed to resolve'); }
  }

  const visible = notifs.filter(n => {
    if (dismissed.has(n.id)) return false;
    if (filter === 'all')    return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  // Count by type (excluding dismissed)
  const counts = notifs.reduce((acc, n) => {
    if (!dismissed.has(n.id)) {
      acc.total = (acc.total || 0) + 1;
      acc[n.type] = (acc[n.type] || 0) + 1;
      if (!n.read) acc.unread = (acc.unread || 0) + 1;
    }
    return acc;
  }, {});

  const FILTERS = [
    { id: 'all',        label: 'All',         count: counts.total },
    { id: 'unread',     label: 'Unread',      count: counts.unread },
    { id: 'escalation', label: 'Escalations', count: counts.escalation },
    { id: 'conflict',   label: 'Conflicts',   count: counts.conflict },
    { id: 'error',      label: 'Errors',      count: counts.error },
    { id: 'user',       label: 'New Users',   count: counts.user },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="text-indigo-500" size={24} />
            Notifications Centre
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Auto-detected issues: new registrations, system errors, approval conflicts and escalations. Refreshes every 30s.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setLoading(true); fetchNotifs(); }}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all">
            <RefreshCw size={13} /> Refresh
          </button>
          {visible.length > 0 && (
            <button onClick={dismissAll}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all">
              <X size={13} /> Dismiss All
            </button>
          )}
        </div>
      </div>

      {/* How it works info box */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 text-xs text-blue-800 dark:text-blue-300 space-y-1.5">
        <p className="font-bold flex items-center gap-1.5"><Info size={13} /> How issues are detected automatically:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
          {[
            ['🔴 Escalations',  'Submissions where HOD is also evaluated faculty — admin action needed'],
            ['🟡 Conflicts',    'Self-approval conflicts detected but alternate approver assigned'],
            ['❌ System Errors','Backend 500 errors, PDF failures, AI failures logged automatically'],
            ['⚠️ Warnings',    'SMTP failures, missing data, non-critical backend issues'],
            ['👤 New Users',    'Accounts registered in the last 48 hours'],
          ].map(([t, d]) => (
            <div key={t} className="flex gap-1.5">
              <span className="font-semibold shrink-0">{t}:</span>
              <span className="text-blue-700 dark:text-blue-400">{d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === f.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}>
            {f.label}
            {f.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                filter === f.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 py-16 text-center">
          <Bell size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-700" />
          <p className="text-slate-500 font-semibold text-sm">No notifications in this category</p>
          <p className="text-slate-400 text-xs mt-1">The system is monitoring for issues continuously</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {visible.map(n => {
            const cfg  = TYPE_CFG[n.type] || TYPE_CFG.info;
            const Icon = cfg.icon;
            return (
              <div key={n.id}
                className={`p-4 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${!n.read ? 'border-l-4 border-l-indigo-500' : ''}`}>

                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                  <Icon size={18} className={cfg.color} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500" title="Unread" />
                    )}
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock size={9} /> {timeAgo(n.time)}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">{n.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{n.body}</p>

                  {/* Action buttons for specific types */}
                  {(n.type === 'escalation' || n.type === 'conflict') && n.submissionId && (
                    <button
                      onClick={() => window.open(`/admin`, '_self')}
                      className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                      → Go to Conflicts section
                    </button>
                  )}
                  {(n.type === 'error' || n.type === 'warning') && n.logId && (
                    <button onClick={() => resolveLog(n.logId)}
                      className="mt-2 text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1">
                      <CheckCircle size={11} /> Mark log resolved
                    </button>
                  )}
                </div>

                {/* Dismiss */}
                <button onClick={() => dismiss(n.id)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors shrink-0" title="Dismiss">
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
