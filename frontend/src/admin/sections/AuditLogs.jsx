import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Terminal, Database, RefreshCw, Trash2, AlertOctagon,
  AlertTriangle, CheckCircle, Info, Wifi, WifiOff, ChevronDown
} from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ─── helpers ─── */
const levelStyle = (level) => {
  if (level === 'error') return 'text-rose-400 font-bold';
  if (level === 'warn')  return 'text-amber-400 font-semibold';
  if (level === 'info')  return 'text-blue-400';
  return 'text-slate-400';
};
const levelBadge = (level) => {
  if (level === 'error') return 'bg-rose-600 text-white';
  if (level === 'warn')  return 'bg-amber-500 text-white';
  if (level === 'info')  return 'bg-blue-600 text-white';
  return 'bg-slate-600 text-white';
};
const levelIcon = (level) => {
  if (level === 'error') return <AlertOctagon size={11} />;
  if (level === 'warn')  return <AlertTriangle size={11} />;
  if (level === 'info')  return <Info size={11} />;
  return <CheckCircle size={11} />;
};
const fmt = (ts) => {
  try { return new Date(ts).toLocaleTimeString('en-IN', { hour12: false }); }
  catch { return ts; }
};
const fmtFull = (ts) => {
  try { return new Date(ts).toLocaleString('en-IN'); }
  catch { return ts; }
};

/* ═══════════════════════════════════════════════════════════ */
/*  TAB 1 — Live SSE Terminal Stream                          */
/* ═══════════════════════════════════════════════════════════ */
function LiveStream({ token }) {
  const [entries, setEntries] = useState([]);
  const [connected, setConnected] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const bottomRef = useRef(null);
  const esRef = useRef(null);

  const connect = useCallback(() => {
    if (esRef.current) { esRef.current.close(); }
    const es = new EventSource(`${BACKEND}/api/logstream/stream?token=${token}`);
    esRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (e) => {
      try {
        const entry = JSON.parse(e.data);
        setEntries(prev => {
          const next = [...prev, entry];
          return next.length > 1000 ? next.slice(-1000) : next;
        });
      } catch {}
    };
  }, [token]);

  useEffect(() => {
    connect();
    return () => { if (esRef.current) esRef.current.close(); };
  }, [connect]);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries, autoScroll]);

  const filtered = entries.filter(e => {
    if (levelFilter && e.level !== levelFilter) return false;
    if (filter && !e.msg?.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold">
          {connected
            ? <><Wifi size={14} className="text-emerald-500" /><span className="text-emerald-500">Live Connected</span></>
            : <><WifiOff size={14} className="text-rose-500" /><span className="text-rose-500">Disconnected</span></>
          }
        </div>
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter logs..."
          className="flex-1 min-w-[160px] px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <select
          value={levelFilter}
          onChange={e => setLevelFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-300"
        >
          <option value="">All Levels</option>
          <option value="error">Error</option>
          <option value="warn">Warn</option>
          <option value="info">Info</option>
          <option value="log">Log</option>
        </select>
        <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
          <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} className="w-3 h-3 accent-indigo-600" />
          Auto-scroll
        </label>
        <button
          onClick={() => setEntries([])}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-rose-900/40 border border-slate-700 hover:border-rose-700 text-slate-300 hover:text-rose-300 rounded-lg transition-all"
        >
          <Trash2 size={12} /> Clear
        </button>
        <button
          onClick={connect}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg transition-all"
        >
          <RefreshCw size={12} /> Reconnect
        </button>
      </div>

      {/* Terminal */}
      <div className="bg-[#0d1117] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        {/* Terminal header */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#161b22] border-b border-slate-800">
          <div className="w-3 h-3 rounded-full bg-rose-500" />
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="ml-2 text-[11px] text-slate-500 font-mono">backend — live stdout/stderr</span>
          <span className="ml-auto text-[10px] text-slate-600 font-mono">{filtered.length} entries</span>
        </div>

        {/* Log lines */}
        <div className="h-[520px] overflow-y-auto font-mono text-[12px] leading-5 p-3 space-y-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">
          {filtered.length === 0 && (
            <p className="text-slate-600 text-xs mt-4 text-center">
              {connected ? 'Waiting for logs…' : 'Not connected. Click Reconnect.'}
            </p>
          )}
          {filtered.map((e, i) => (
            <div key={e.id || i} className={`flex gap-2 items-start hover:bg-white/5 px-1 rounded ${e.level === 'error' ? 'bg-rose-950/30' : ''}`}>
              <span className="text-slate-600 shrink-0 w-[72px]">{fmt(e.ts)}</span>
              <span className={`shrink-0 w-[42px] uppercase text-[10px] font-extrabold tracking-wide ${levelStyle(e.level)}`}>
                {e.level}
              </span>
              <span className={`break-all ${e.level === 'error' ? 'text-rose-300' : e.level === 'warn' ? 'text-amber-200' : 'text-slate-300'}`}>
                {e.msg}
              </span>
              {e.fileRef && (
                <span className="ml-auto shrink-0 text-[10px] text-slate-600">
                  {e.fileRef.file}:{e.fileRef.line}
                </span>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  TAB 2 — DB System Logs (/api/admin/logs)                  */
/* ═══════════════════════════════════════════════════════════ */
function DBLogs({ token }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState('');
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = '/api/admin/logs?limit=200';
      if (levelFilter) url += `&level=${levelFilter}`;
      const res = await api.get(url);
      setLogs(res.data?.logs || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      toast.error('Failed to load DB logs: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [levelFilter]);

  const handleClearAll = async () => {
    if (!window.confirm('Delete ALL system logs from database? This cannot be undone.')) return;
    try {
      await api.delete('/api/admin/logs');
      toast.success('All logs cleared');
      setLogs([]);
      setTotal(0);
    } catch (err) {
      toast.error('Failed to clear: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/admin/logs/${id}`);
      setLogs(prev => prev.filter(l => l._id !== id));
      toast.success('Log deleted');
    } catch (err) {
      toast.error('Failed to delete log');
    }
  };

  const handleResolve = async (id) => {
    try {
      const res = await api.patch(`/api/admin/logs/${id}`, { resolved: true });
      setLogs(prev => prev.map(l => l._id === id ? res.data : l));
      toast.success('Marked as resolved');
    } catch (err) {
      toast.error('Failed to resolve');
    }
  };

  const filtered = logs.filter(l =>
    !search ||
    l.message?.toLowerCase().includes(search.toLowerCase()) ||
    l.source?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by message or source..."
          className="flex-1 min-w-[180px] px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={levelFilter}
          onChange={e => setLevelFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300"
        >
          <option value="">All Levels</option>
          <option value="error">Error</option>
          <option value="warn">Warning</option>
          <option value="info">Info</option>
        </select>
        <button onClick={fetchLogs} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 font-semibold transition-all">
          <RefreshCw size={13} /> Refresh
        </button>
        <button onClick={handleClearAll} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 rounded-xl text-rose-600 dark:text-rose-400 font-semibold transition-all">
          <Trash2 size={13} /> Clear All
        </button>
        <span className="text-xs text-slate-400 ml-auto">{total} total in DB</span>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm animate-pulse">Loading DB system logs…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wide text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Level</th>
                  <th className="px-5 py-3.5">Source</th>
                  <th className="px-5 py-3.5">Message</th>
                  <th className="px-5 py-3.5">Time</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.map(l => (
                  <tr
                    key={l._id}
                    className={`transition-colors ${
                      l.level === 'error'
                        ? 'bg-rose-50/60 dark:bg-rose-950/20'
                        : l.level === 'warn'
                        ? 'bg-amber-50/40 dark:bg-amber-950/10'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${levelBadge(l.level)}`}>
                        {levelIcon(l.level)} {l.level}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">{l.source}</td>
                    <td className="px-5 py-3 max-w-sm">
                      <p className="truncate text-slate-800 dark:text-slate-200">{l.message}</p>
                      {l.stack && (
                        <details className="mt-1">
                          <summary className="text-[10px] text-slate-400 cursor-pointer hover:text-slate-600">Stack trace</summary>
                          <pre className="mt-1 text-[10px] text-rose-400 whitespace-pre-wrap break-all">{l.stack}</pre>
                        </details>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{fmtFull(l.createdAt)}</td>
                    <td className="px-5 py-3">
                      {l.resolved
                        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold"><CheckCircle size={10}/> Resolved</span>
                        : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">Open</span>
                      }
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {!l.resolved && l.level === 'error' && (
                          <button
                            onClick={() => handleResolve(l._id)}
                            className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold"
                          >
                            Resolve
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(l._id)}
                          className="text-[11px] text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">
                      No system log entries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  Main AuditLogs Page                                        */
/* ═══════════════════════════════════════════════════════════ */
export default function AuditLogs({ token }) {
  const [tab, setTab] = useState('live');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Terminal className="text-indigo-600 dark:text-indigo-400" size={24} />
          Live System Logs & Audit
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Real-time backend terminal stream + persistent database system logs. Errors highlighted in red.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-fit">
        <button
          onClick={() => setTab('live')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all ${
            tab === 'live'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Wifi size={13} /> Live Stream
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </button>
        <button
          onClick={() => setTab('db')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all ${
            tab === 'db'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Database size={13} /> DB System Logs
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'live'
        ? <LiveStream token={token} />
        : <DBLogs token={token} />
      }
    </div>
  );
}
