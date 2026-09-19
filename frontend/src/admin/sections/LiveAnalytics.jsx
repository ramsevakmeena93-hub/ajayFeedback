import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity, Clock, LogIn, Users, UserPlus, RefreshCw,
  Terminal, Wifi
} from 'lucide-react';
import axios from '../../api';
import BackendLogTerminal from '../../components/BackendLogTerminal';
import { useAuth } from '../../context/AuthContext';

export default function LiveAnalytics({ token, isDark }) {
  const { socket } = useAuth();
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showTerminal, setShowTerminal] = useState(false);
  const [onlineNow, setOnlineNow]   = useState(null);
  const tableRef = useRef(null);
  const ITEMS_PER_PAGE = 15;

  const fetchStats = useCallback(async (showLoad = true, page = 1) => {
    if (showLoad) setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        axios.get('/api/admin/stats',  { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/users',  { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const s = statsRes.data;
      const allUsers = Array.isArray(usersRes.data) ? usersRes.data : [];
      allUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const start = (page - 1) * ITEMS_PER_PAGE;
      const paged = allUsers.slice(start, start + ITEMS_PER_PAGE);
      setStats({ raw: s, allUsers, pagedUsers: paged, totalUsers: allUsers.length });
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load analytics');
    } finally {
      if (showLoad) setLoading(false);
    }
  }, [token]); // removed currentPage — passed explicitly on each call

  // Initial load + 60s auto-refresh
  useEffect(() => {
    fetchStats(true, currentPage);
    const id = setInterval(() => fetchStats(false, currentPage), 60000);
    return () => clearInterval(id);
  }, [fetchStats, currentPage]);

  // Socket: live online count updates
  useEffect(() => {
    if (!socket) return;
    const handler = (data) => setOnlineNow(data.total);
    socket.on('online_count', handler);
    return () => socket.off('online_count', handler);
  }, [socket]);

  // Scroll to top on page change
  useEffect(() => {
    setTimeout(() => {
      tableRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  }, [currentPage]);

  const formatTime = (sec) => {
    if (!sec || sec <= 0) return '0s';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || !parts.length) parts.push(`${s}s`);
    return parts.join(' ');
  };

  const formatRelative = (dateStr) => {
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs  = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1)  return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24)  return `${hrs}h ago`;
    return `${days}d ago`;
  };

  const card = `rounded-2xl border transition-all duration-300 ${
    isDark
      ? 'bg-[#0B1120] border-white/10 shadow-2xl shadow-black/50 hover:border-white/20'
      : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'
  }`;

  /* ── Loading ── */
  if (loading && !stats) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin ${isDark ? 'border-indigo-400' : 'border-indigo-500'}`} />
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className={`p-4 rounded-xl ${isDark ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-red-50 text-red-600 border border-red-200'}`}>
        {error}
        <button onClick={() => fetchStats(true, currentPage)} className="ml-4 font-bold underline">Retry</button>
      </div>
    );
  }

  const { raw: s, pagedUsers, totalUsers } = stats;
  const totalPages = Math.ceil(totalUsers / ITEMS_PER_PAGE);

  // Role counts from usersByRole
  const byRole = {};
  (s.usersByRole || []).forEach(r => { byRole[r._id] = r.count; });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-end items-center gap-3">
        <button
          onClick={() => setShowTerminal(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
            isDark
              ? 'bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700'
              : 'bg-black border-slate-800 text-emerald-400 hover:bg-slate-900'
          }`}
        >
          <Terminal className="w-4 h-4" /> System Logs
        </button>
        <button
          onClick={() => fetchStats(true, currentPage)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
            isDark
              ? 'bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-white/[0.07]'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {showTerminal && (
        <BackendLogTerminal isDark={isDark} token={token} onClose={() => setShowTerminal(false)} />
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Total Users */}
        <div className={`p-4 sm:p-5 ${card}`}>
          <div className="flex justify-between items-start mb-3">
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
              <Users className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>Total</span>
          </div>
          <p className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Total Users</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{s.totalUsers || 0}</span>
          </div>
          <div className={`mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-semibold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            {(s.usersByRole || []).map(r => (
              <span key={r._id}>{r._id.charAt(0).toUpperCase() + r._id.slice(1)}: {r.count}</span>
            ))}
          </div>
        </div>

        {/* Reports */}
        <div className={`p-4 sm:p-5 ${card}`}>
          <div className="flex justify-between items-start mb-3">
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-purple-500/15 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Reports</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{s.reports || 0}</span>
          </div>
          <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{s.submissions || 0} submissions</p>
        </div>

        {/* System Health */}
        <div className={`p-4 sm:p-5 ${card}`}>
          <div className="flex justify-between items-start mb-3">
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
              <Wifi className="w-5 h-5" />
            </div>
            <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg ${isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </div>
          </div>
          <p className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Online Now</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {onlineNow !== null ? onlineNow : (
                <span className="text-lg font-bold text-slate-500">—</span>
              )}
            </span>
            <span className={`text-xs font-medium ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
              {socket?.connected ? 'via socket' : 'offline'}
            </span>
          </div>
          <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{s.errorLogs || 0} errors · {s.warnLogs || 0} warnings</p>
        </div>

        {/* Departments */}
        <div className={`p-4 sm:p-5 ${card}`}>
          <div className="flex justify-between items-start mb-3">
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
              <UserPlus className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Departments</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {(s.usersByDept || []).length}
            </span>
          </div>
          <div className={`mt-2 text-[10px] font-semibold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            {(s.usersByDept || []).slice(0, 2).map(d => d._id).join(' · ')}
            {(s.usersByDept || []).length > 2 && ` +${(s.usersByDept || []).length - 2} more`}
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className={`rounded-2xl border overflow-hidden flex flex-col transition-all duration-300 ${
        isDark ? 'bg-[#0B1120] border-white/10 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'
      }`}>
        <div className={`p-4 sm:p-5 border-b flex justify-between items-center gap-3 ${
          isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50/50 border-slate-100'
        }`}>
          <div>
            <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>User Activity</h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{totalUsers} total users</p>
          </div>
          <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
            socket?.connected
              ? (isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'text-emerald-700 bg-emerald-50 border-emerald-200')
              : (isDark ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' : 'text-slate-600 bg-slate-50 border-slate-200')
          }`}>
            <span className={`w-2 h-2 rounded-full ${socket?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            {socket?.connected ? 'Socket Live' : 'Auto-refresh 30s'}
          </span>
        </div>

        {/* Desktop Table */}
        <div ref={tableRef} className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
            <thead className={`border-b ${isDark ? 'bg-[#0f1729] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
              <tr>
                {['User', 'Role', 'Department', 'Status', 'Joined'].map(h => (
                  <th key={h} className={`py-3 px-5 font-semibold text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
              {pagedUsers.length > 0 ? pagedUsers.map((u, i) => (
                <tr key={u._id || i} className="transition hover:bg-white/[0.02]">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        {u.profilePhoto ? (
                          <img
                            src={u.profilePhoto}
                            alt={u.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-xl object-cover"
                          />
                        ) : (
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold uppercase text-[10px] shrink-0 ${isDark ? 'bg-indigo-500/15 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                            {u.name?.substring(0, 2) || '??'}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{u.name}</p>
                        <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                      u.role === 'admin'   ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                      u.role === 'hod'     ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                      u.role === 'faculty' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      u.role === 'vc'      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                            'bg-slate-500/10 text-slate-500 border-slate-500/20'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className={`py-3 px-5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {u.department || '—'}
                  </td>
                  <td className="py-3 px-5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                      u.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                    }`}>
                      {u.status || 'active'}
                    </span>
                  </td>
                  <td className={`py-3 px-5 text-[10px] opacity-60`}>
                    {formatRelative(u.createdAt)}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="py-12 text-center opacity-50">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="block md:hidden divide-y divide-white/[0.04]">
          {pagedUsers.map((u, i) => (
            <div key={u._id || i} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {u.profilePhoto ? (
                    <img
                      src={u.profilePhoto}
                      alt={u.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold uppercase text-xs shrink-0 ${isDark ? 'bg-indigo-500/15 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                      {u.name?.substring(0, 2) || '??'}
                    </div>
                  )}
                  <div>
                    <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{u.name}</p>
                    <p className="text-[10px] opacity-50">{u.email}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${
                  u.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                }`}>{u.status || 'active'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.04] text-[10px]">
                <div>
                  <p className="font-bold uppercase opacity-40">Role</p>
                  <p className="font-bold">{u.role}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold uppercase opacity-40">Joined</p>
                  <p className="font-bold opacity-60">{formatRelative(u.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalUsers > ITEMS_PER_PAGE && (
          <div className={`p-4 border-t flex items-center justify-between ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg border text-xs font-bold disabled:opacity-30 active:scale-95 transition-all"
            >Prev</button>
            <span className="text-[10px] font-bold opacity-40">Page {currentPage} of {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg border text-xs font-bold disabled:opacity-30 active:scale-95 transition-all"
            >Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
