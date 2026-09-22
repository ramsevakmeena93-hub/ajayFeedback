import { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, X, Trash2, Calendar } from 'lucide-react';
import axios from '../api';

// Parse optional [Context] prefix from message like "[Socket] User connected..."
function parseMsg(raw = '') {
  const m = raw.match(/^\[([^\]]{1,20})\]\s*(.*)/s);
  if (m) return { ctx: m[1], body: m[2] };
  return { ctx: null, body: raw };
}

const LEVEL_STYLES = {
  error: { badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',   dot: 'bg-rose-500',   row: 'bg-rose-500/[0.04]' },
  warn:  { badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30', dot: 'bg-amber-500',  row: 'bg-amber-500/[0.03]' },
  info:  { badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',    dot: 'bg-blue-500',   row: '' },
  log:   { badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-500', row: '' },
};

function LevelBadge({ level }) {
  const s = LEVEL_STYLES[level] || LEVEL_STYLES.log;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-black uppercase font-mono shrink-0 ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {level}
    </span>
  );
}

export default function BackendLogTerminal({ token, onClose }) {
  const [logs, setLogs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filterLevel, setFilterLevel] = useState('all');
  const [search, setSearch]           = useState('');
  const [fromDate, setFromDate]       = useState('');
  const [toDate, setToDate]           = useState('');
  const [autoScroll, setAutoScroll]   = useState(true);
  const logsEndRef  = useRef(null);
  const scrollRef   = useRef(null);
  const esRef       = useRef(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);

    axios
      .get('/api/logstream/buffer?limit=500', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setLogs(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));

    const isProd = import.meta.env.PROD;
    const base =
      import.meta.env.VITE_API_URL ||
      (isProd ? 'https://ajayfeedback-backend.onrender.com' : '');
    const es = new EventSource(
      `${base}/api/logstream/stream?token=${encodeURIComponent(token)}`
    );
    esRef.current = es;
    es.onmessage = (e) => {
      try {
        const entry = JSON.parse(e.data);
        setLogs((prev) => [...prev, entry].slice(-1000));
      } catch (_) {}
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, [token]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll) logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== 'all' && log.level !== filterLevel) return false;
    if (fromDate && new Date(log.ts) < new Date(fromDate)) return false;
    if (toDate   && new Date(log.ts) > new Date(`${toDate}T23:59:59Z`)) return false;
    if (search && !log.msg?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleClear = async () => {
    if (!window.confirm('Permanently clear the log buffer?')) return;
    try {
      await axios.delete('/api/logstream/buffer', { headers: { Authorization: `Bearer ${token}` } });
      setLogs([]);
    } catch { alert('Failed to clear logs'); }
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  };

  const counts = { error: 0, warn: 0, info: 0, log: 0 };
  logs.forEach(l => { if (counts[l.level] !== undefined) counts[l.level]++; });

  return (
    <div
      className="rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      style={{ position: 'fixed', inset: '1.5rem', zIndex: 9999, background: '#0a0d14', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* ── Title Bar ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]" style={{ background: '#0f1320' }}>
        <div className="flex items-center gap-3">
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <TerminalIcon className="text-emerald-400 w-4 h-4 ml-1" />
          <span className="text-white font-mono font-bold text-sm tracking-tight">System Console</span>
          <span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 animate-pulse">
            ● LIVE
          </span>
        </div>

        {/* Level summary pills */}
        <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono font-bold">
          <span className="text-rose-400">{counts.error} ERR</span>
          <span className="text-slate-700">|</span>
          <span className="text-amber-400">{counts.warn} WARN</span>
          <span className="text-slate-700">|</span>
          <span className="text-blue-400">{counts.info} INFO</span>
          <span className="text-slate-700">|</span>
          <span className="text-emerald-400">{counts.log} LOG</span>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition ml-4"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div
        className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]"
        style={{ background: '#0c1018' }}
      >
        {/* Level filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Level</span>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="text-[10px] font-mono px-2 py-1 rounded-md border border-white/10 text-slate-300 outline-none"
            style={{ background: '#161c2a' }}
          >
            <option value="all">All Levels</option>
            <option value="log">Log</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>

        <div className="w-px h-4 bg-white/10" />

        {/* Date range */}
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-slate-500" />
          <span className="text-[10px] text-slate-500 font-mono">From</span>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
            className="text-[10px] font-mono px-2 py-1 rounded-md border border-white/10 text-slate-300 outline-none"
            style={{ background: '#161c2a' }} />
          <span className="text-[10px] text-slate-500 font-mono">To</span>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
            className="text-[10px] font-mono px-2 py-1 rounded-md border border-white/10 text-slate-300 outline-none"
            style={{ background: '#161c2a' }} />
        </div>

        <div className="w-px h-4 bg-white/10" />

        {/* Search */}
        <input
          type="text"
          placeholder="Search logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-[10px] font-mono px-3 py-1 rounded-md border border-white/10 text-slate-300 outline-none w-44 placeholder-slate-600"
          style={{ background: '#161c2a' }}
        />

        <div className="flex-1" />

        {/* Auto-scroll toggle */}
        <button
          onClick={() => setAutoScroll(a => !a)}
          className={`text-[10px] font-mono px-2.5 py-1 rounded-md border transition ${
            autoScroll
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
              : 'bg-white/5 text-slate-500 border-white/10'
          }`}
        >
          Auto-scroll
        </button>

        <button
          onClick={handleClear}
          className="flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded-md border border-rose-500/20 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition"
        >
          <Trash2 className="w-3 h-3" /> Clear
        </button>
      </div>

      {/* ── Column Headers ── */}
      <div
        className="hidden sm:grid font-mono text-[9px] font-black uppercase tracking-wider text-slate-600 px-4 py-1.5 border-b border-white/[0.04]"
        style={{ gridTemplateColumns: '7rem 4.5rem 6rem 1fr', background: '#0c1018' }}
      >
        <span>Timestamp</span>
        <span>Level</span>
        <span>Context</span>
        <span>Message</span>
      </div>

      {/* ── Log Rows ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto font-mono text-[11px]"
        style={{ background: '#080b11' }}
      >
        {loading && logs.length === 0 && (
          <div className="flex items-center gap-2 p-4 text-slate-600 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Connecting to log stream...
          </div>
        )}

        {!loading && filteredLogs.length === 0 && (
          <div className="p-4 text-slate-600 italic">No logs match the current filters.</div>
        )}

        {filteredLogs.map((log, i) => {
          const { ctx, body } = parseMsg(log.msg);
          const s = LEVEL_STYLES[log.level] || LEVEL_STYLES.log;
          const ts = new Date(log.ts);
          const timeStr = ts.toLocaleTimeString('en-US', {
            hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
          });
          const msStr = String(ts.getMilliseconds()).padStart(3, '0');

          return (
            <div
              key={log.id || i}
              className={`grid items-start px-4 py-1 border-b border-white/[0.025] hover:bg-white/[0.04] transition-colors ${s.row}`}
              style={{ gridTemplateColumns: '7rem 4.5rem 6rem 1fr' }}
            >
              {/* Timestamp */}
              <span className="text-slate-600 shrink-0 select-none pt-0.5">
                {timeStr}<span className="text-slate-700">.{msStr}</span>
              </span>

              {/* Level badge */}
              <span className="pt-0.5">
                <LevelBadge level={log.level} />
              </span>

              {/* Context */}
              <span className="text-fuchsia-400/80 truncate pt-0.5 pr-2">
                {ctx || log.fileRef?.file?.split('/').pop()?.replace(/\.[jt]sx?$/, '') || '—'}
              </span>

              {/* Message */}
              <span className="text-slate-300 break-words leading-relaxed">
                {body}
                {log.fileRef && (
                  <span className="ml-2 text-[9px] text-slate-600" title={`${log.fileRef.file}:${log.fileRef.line}`}>
                    ({log.fileRef.file}:{log.fileRef.line})
                  </span>
                )}
              </span>
            </div>
          );
        })}

        <div ref={logsEndRef} />
      </div>

      {/* ── Status Bar ── */}
      <div
        className="flex items-center justify-between px-4 py-1.5 border-t border-white/[0.06] text-[9px] font-mono text-slate-600"
        style={{ background: '#0c1018' }}
      >
        <span>{filteredLogs.length} / {logs.length} entries shown</span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Streaming
        </span>
      </div>
    </div>
  );
}
