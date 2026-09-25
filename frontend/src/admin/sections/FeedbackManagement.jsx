import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Download, RefreshCw, Search, Eye, Edit3, Trash2,
  Plus, CheckCircle, Clock, AlertTriangle, Building2, User,
  ChevronDown, ChevronUp, X, Save, Printer, GraduationCap,
  BarChart2, Star, BookOpen, Award, MessageSquare, Filter
} from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';

/* ── HOD list (seeded from seed_hods.js) ──────────────────── */
const DEPARTMENTS = [
  'Centre for Computer Science and Technology',
  'School of Architecture',
  'School of Engineering Mathematics & Computing',
  'School of Electronics and Communication Engineering',
  'School of Mechanical Engineering',
  'School of Civil Engineering',
  'School of Humanities and Management',
  'School of Electrical Engineering',
  'Computer Science and Design',
  'Centre for Internet of Things',
  'School of Information Technology',
  'Centre for Artificial Intelligence',
  'School of Chemical Engineering',
];

const HODS = [
  { name: 'Dr. Abhishek Dixit',        email: 'abhishekdixit@mitsgwalior.in',   dept: 'Centre for Computer Science and Technology' },
  { name: 'Dr. Anjali S Patil',         email: 'anjalipatil@mitsgwalior.in',     dept: 'School of Architecture' },
  { name: 'Dr. D.K. Jain',             email: 'ain_dkj@mitsgwalior.in',         dept: 'School of Engineering Mathematics & Computing' },
  { name: 'Dr. Laxmi Shrivastava',     email: 'lselex@mitsgwalior.in',          dept: 'School of Electronics and Communication Engineering' },
  { name: 'Dr. Pratesh Jayaswal',      email: 'pratesh_jayaswal@mitsgwalior.in',dept: 'School of Mechanical Engineering' },
  { name: 'Dr. Sanjay Tiwari',         email: 'stiwari.fce@mitsgwalior.in',     dept: 'School of Civil Engineering' },
  { name: 'Dr. Sanjeev Khanna',        email: 'drkhannasanjeev@mitsgwalior.in', dept: 'School of Humanities and Management' },
  { name: 'Dr. Vandana Vikas Thakare', email: 'vandana@mitsgwalior.in',         dept: 'School of Electronics and Communication Engineering' },
  { name: 'Dr. Shishir Dixit',         email: 'shishir.dixit1@mitsgwalior.in',  dept: 'School of Electrical Engineering' },
  { name: 'Manish Dixit',              email: 'dixitmits@mitsgwalior.in',        dept: 'Computer Science and Design' },
  { name: 'Praveen Bansal',            email: 'pbansal444@mitsgwalior.in',       dept: 'Centre for Internet of Things' },
  { name: 'Punit Kumar Johari',        email: 'pkjohari@mitsgwalior.in',         dept: 'School of Information Technology' },
  { name: 'R R Singh',                 email: 'rrsingh@mitsgwalior.in',          dept: 'Centre for Artificial Intelligence' },
  { name: 'Shri Anish P. Jacob',       email: 'anishjaco@mitsgwalior.in',        dept: 'School of Chemical Engineering' },
];

/* ── Helpers ──────────────────────────────────────────────── */
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
const statusColor = (s) => {
  if (s === 'faculty_approved') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
  if (s === 'sent_to_faculty')  return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
  if (s === 'processed')        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
  if (s === 'error')            return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
};
const statusIcon = (s) => {
  if (s === 'faculty_approved') return <CheckCircle size={11} />;
  if (s === 'error')            return <AlertTriangle size={11} />;
  return <Clock size={11} />;
};

/* ════════════════════════════════════════════════════════════
   MITS Report Preview Modal
   Matches the exact format of pdfGenerator.js
═══════════════════════════════════════════════════════════ */
function ReportPreviewModal({ report, onClose, onSave, isDark }) {
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState({ ...report });
  const [saving, setSaving] = useState(false);

  const field = (label, value, key, multiline = false) => (
    <div className="space-y-1">
      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</label>
      {editing ? (
        multiline ? (
          <textarea
            rows={3}
            value={data[key] || ''}
            onChange={e => setData(d => ({ ...d, [key]: e.target.value }))}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
          />
        ) : (
          <input
            value={data[key] || ''}
            onChange={e => setData(d => ({ ...d, [key]: e.target.value }))}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
          />
        )
      ) : (
        <p className="text-xs text-slate-800 dark:text-slate-200 min-h-[20px]">{value || <span className="italic text-slate-400">—</span>}</p>
      )}
    </div>
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/api/admin/reports/${report._id}`, {
        facultyName: data.facultyName,
        subjectCode: data.subjectCode,
        programme: data.programme,
        semester: data.semester,
        hodRemarks: data.hodRemarks,
        actionTaken: data.actionTaken,
        ffiScore: parseFloat(data.ffiScore) || null,
      });
      toast.success('Report updated by Admin');
      setEditing(false);
      if (onSave) onSave(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
        {/* Header bar — matches MITS PDF header */}
        <div className="bg-[#1a3a6b] text-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold tracking-wider opacity-80 uppercase">Madhav Institute of Technology &amp; Science, Gwalior</div>
              <div className="font-extrabold text-lg mt-0.5">Action Taken Report — Faculty Feedback</div>
              <div className="text-xs opacity-70 mt-0.5">(Deemed University) · NAAC A++ Grade</div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><X size={18} /></button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Action bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${statusColor(report.status)}`}>
                {statusIcon(report.status)} {report.status?.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-50">
                    <Save size={13} /> {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} className="px-4 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5">
                  <Edit3 size={13} /> Admin Edit
                </button>
              )}
            </div>
          </div>

          {/* Report Info Grid — 3 columns */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <BookOpen size={13} /> Report Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {field('Faculty Name', report.facultyName, 'facultyName')}
              {field('Subject Code / Batch', report.subjectCode, 'subjectCode')}
              {field('Programme / Class', report.programme, 'programme')}
              {field('Semester', report.semester, 'semester')}
              {field('FFI Score', report.ffiScore?.toFixed(2), 'ffiScore')}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Academic Year</label>
                <p className="text-xs text-slate-800 dark:text-slate-200">{report.academicYear || '—'}</p>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Response Count</label>
                <p className="text-xs text-slate-800 dark:text-slate-200">{report.responseCount ?? '—'}</p>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Faculty Acknowledged</label>
                <p className="text-xs text-slate-800 dark:text-slate-200">{report.facultyAcknowledged ? `Yes — ${fmtDate(report.facultyAcknowledgedAt)}` : 'No'}</p>
              </div>
            </div>
          </div>

          {/* Comments — 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Appreciation */}
            <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/50 p-5 space-y-3">
              <h3 className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-widest flex items-center gap-2">
                <Star size={13} className="text-amber-500" /> Appreciation / Positive Feedback
                <span className="ml-auto px-2 py-0.5 bg-emerald-200 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-bold">{report.appreciationCount || 0}</span>
              </h3>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {(report.appreciation || []).length > 0
                  ? (report.appreciation || []).map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-emerald-900 dark:text-emerald-200">
                      <CheckCircle size={11} className="text-emerald-600 mt-0.5 shrink-0" />
                      <span>{c}</span>
                    </div>
                  ))
                  : <p className="text-xs text-emerald-600/60 italic">No appreciation comments</p>
                }
              </div>
            </div>

            {/* Needs Attention */}
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/50 p-5 space-y-3">
              <h3 className="text-xs font-extrabold text-amber-800 dark:text-amber-300 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle size={13} /> Needs Attention
                <span className="ml-auto px-2 py-0.5 bg-amber-200 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full text-[10px] font-bold">{report.attentionCount || 0}</span>
              </h3>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {(report.commentsNeedingAttention || []).length > 0
                  ? (report.commentsNeedingAttention || []).map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                      <AlertTriangle size={11} className="text-amber-600 mt-0.5 shrink-0" />
                      <span>{c}</span>
                    </div>
                  ))
                  : <p className="text-xs text-amber-600/60 italic">No attention-needed comments</p>
                }
              </div>
            </div>
          </div>

          {/* HOD Remarks & Action Taken — editable by admin */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare size={13} /> HOD Remarks
              </h3>
              {field('', report.hodRemarks, 'hodRemarks', true)}
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <Award size={13} /> Action Taken
              </h3>
              {field('', report.actionTaken, 'actionTaken', true)}
            </div>
          </div>

          {/* Comment Percentages */}
          {report.commentPercentages && Object.keys(report.commentPercentages).length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
              <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                <BarChart2 size={13} /> Comment Distribution
              </h3>
              <div className="space-y-2">
                {Object.entries(report.commentPercentages).map(([label, pct]) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 dark:text-slate-400 w-24 shrink-0">{label}</span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2.5">
                      <div className="bg-indigo-500 h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-10 text-right">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN — Feedback & Reports (Admin)
═══════════════════════════════════════════════════════════ */
export default function FeedbackManagement({ token, isDark }) {
  const [reports, setReports]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [deptFilter, setDeptFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [stats, setStats]             = useState({ total: 0, approved: 0, pending: 0, avgFFI: 0 });
  const [expanded, setExpanded]       = useState({});
  const [tab, setTab]                 = useState('reports');        // 'reports' | 'hods'

  useEffect(() => { fetchAllReports(); }, [deptFilter, statusFilter]);

  async function fetchAllReports() {
    setLoading(true);
    try {
      let url = '/api/admin/all-reports?limit=300';
      if (deptFilter)  url += `&department=${encodeURIComponent(deptFilter)}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      const res = await api.get(url);
      const data = res.data?.reports || [];
      setReports(data);
      const approved = data.filter(r => r.status === 'faculty_approved').length;
      const withFFI  = data.filter(r => r.ffiScore != null);
      const avgFFI   = withFFI.length ? (withFFI.reduce((s, r) => s + r.ffiScore, 0) / withFFI.length) : 0;
      setStats({ total: data.length, approved, pending: data.length - approved, avgFFI });
    } catch (err) {
      toast.error('Failed to load reports: ' + (err.response?.data?.error || err.message));
    } finally { setLoading(false); }
  }

  async function handleDeleteReport(id) {
    if (!window.confirm('Permanently delete this report? Cannot be undone.')) return;
    try {
      await api.delete(`/api/admin/reports/${id}`);
      setReports(prev => prev.filter(r => r._id !== id));
      toast.success('Report deleted');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to delete'); }
  }

  const handleDownloadPDF = async (submissionId, deptName) => {
    if (!submissionId) return toast.error('No submission linked to this report');
    toast.loading('Generating PDF…', { id: 'pdf-dl' });
    try {
      const baseURL = api.defaults.baseURL || '';
      const res = await fetch(`${baseURL}/api/submissions/${submissionId}/download-pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MITS-ATR-${deptName || 'report'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded!', { id: 'pdf-dl' });
    } catch (err) {
      toast.error(err.message || 'PDF generation failed', { id: 'pdf-dl' });
    }
  };

  const filtered = reports.filter(r => {
    const q = search.toLowerCase();
    if (q && !(
      r.facultyName?.toLowerCase().includes(q) ||
      r.subjectCode?.toLowerCase().includes(q) ||
      r.programme?.toLowerCase().includes(q) ||
      r.department?.toLowerCase().includes(q)
    )) return false;
    return true;
  });

  /* Group by department for the HOD view */
  const byDept = HODS.reduce((acc, hod) => {
    const dept = hod.dept;
    const deptReports = reports.filter(r =>
      (r.department || '').toLowerCase().includes(dept.split(' ').slice(-1)[0].toLowerCase()) ||
      (r.hodDepartment || '').toLowerCase().includes(dept.split(' ').slice(-1)[0].toLowerCase())
    );
    acc[dept] = { hod, reports: deptReports };
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="text-indigo-600 dark:text-indigo-400" size={24} />
            Feedback Reports &amp; Format Control
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            All faculty feedback reports across departments. Admin can view, edit, or delete any report. Same format as HOD &amp; VC portal.
          </p>
        </div>
        <button onClick={fetchAllReports} className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Reports', val: stats.total, color: 'indigo', icon: <FileText size={18} /> },
          { label: 'Approved', val: stats.approved, color: 'emerald', icon: <CheckCircle size={18} /> },
          { label: 'Pending / Processing', val: stats.pending, color: 'amber', icon: <Clock size={18} /> },
          { label: 'Avg FFI Score', val: stats.avgFFI.toFixed(2), color: 'blue', icon: <Star size={18} /> },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
            <div className={`p-2.5 rounded-xl bg-${s.color}-50 dark:bg-${s.color}-950/30 text-${s.color}-600 dark:text-${s.color}-400`}>
              {s.icon}
            </div>
            <div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white">{s.val}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-fit">
        {[['reports', 'All Reports', FileText], ['hods', 'HODs & Departments', Building2]].map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === id ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* ── TAB: All Reports ── */}
      {tab === 'reports' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by faculty, subject, programme…"
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
              />
            </div>
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300">
              <option value="">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300">
              <option value="">All Statuses</option>
              <option value="faculty_approved">Faculty Approved</option>
              <option value="sent_to_faculty">Sent to Faculty</option>
              <option value="processed">Processed</option>
              <option value="pending">Pending</option>
              <option value="error">Error</option>
            </select>
          </div>

          {/* Report Table — MITS format columns */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400 animate-pulse">Loading all department reports…</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-[#1a3a6b] text-white text-[10px] uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3.5">#</th>
                      <th className="px-4 py-3.5">Faculty Name</th>
                      <th className="px-4 py-3.5">Code/Batch</th>
                      <th className="px-4 py-3.5">Programme</th>
                      <th className="px-4 py-3.5">Sem</th>
                      <th className="px-4 py-3.5">FFI</th>
                      <th className="px-4 py-3.5">Resp.</th>
                      <th className="px-4 py-3.5">Needs Attention</th>
                      <th className="px-4 py-3.5">Appreciation</th>
                      <th className="px-4 py-3.5">Action Taken</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filtered.map((r, i) => (
                      <tr key={r._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white max-w-[120px] truncate">{r.facultyName || '—'}</td>
                        <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{r.subjectCode || '—'}</td>
                        <td className="px-4 py-3 max-w-[120px] truncate text-slate-700 dark:text-slate-300">{r.programme || '—'}</td>
                        <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{r.semester || '—'}</td>
                        <td className="px-4 py-3 font-bold text-indigo-700 dark:text-indigo-300 text-center">{r.ffiScore?.toFixed(2) ?? '—'}</td>
                        <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{r.responseCount ?? '—'}</td>
                        <td className="px-4 py-3 max-w-[140px]">
                          <p className="truncate text-amber-800 dark:text-amber-300">
                            {(r.commentsNeedingAttention || []).slice(0, 1).join(', ') || '—'}
                          </p>
                          {(r.commentsNeedingAttention || []).length > 1 && (
                            <span className="text-[10px] text-amber-500">+{r.commentsNeedingAttention.length - 1} more</span>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-[120px]">
                          <p className="truncate text-emerald-800 dark:text-emerald-300">
                            {(r.appreciation || []).slice(0, 1).join(', ') || '—'}
                          </p>
                          {(r.appreciation || []).length > 1 && (
                            <span className="text-[10px] text-emerald-500">+{r.appreciation.length - 1} more</span>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-[100px] truncate text-slate-700 dark:text-slate-300">{r.actionTaken || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColor(r.status)}`}>
                            {statusIcon(r.status)} {(r.status || 'pending').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setSelectedReport(r)} title="View / Edit" className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 transition-colors">
                              <Eye size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && !loading && (
                      <tr><td colSpan={12} className="px-4 py-12 text-center text-slate-400">No reports found. HODs need to upload CSV/PDF files first.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: HODs & Departments ── */}
      {tab === 'hods' && (
        <div className="space-y-4">
          <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-xl px-5 py-3 text-xs text-indigo-700 dark:text-indigo-300 font-medium">
            All {HODS.length} HODs from MITS Gwalior — official data. Default password: <code className="bg-indigo-100 dark:bg-indigo-900/40 px-1.5 py-0.5 rounded font-mono">Mits@1234</code>
          </div>

          {DEPARTMENTS.map(dept => {
            const { hod, reports: deptReps } = byDept[dept] || { hod: null, reports: [] };
            const hodInfo = HODS.find(h => h.dept === dept);
            const isOpen = expanded[dept];
            const deptApproved = deptReps.filter(r => r.status === 'faculty_approved').length;

            return (
              <div key={dept} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <button
                  onClick={() => setExpanded(p => ({ ...p, [dept]: !p[dept] }))}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-extrabold text-sm shrink-0">
                      {dept.charAt(0)}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-sm text-slate-900 dark:text-white">{dept}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                        <User size={11} /> {hodInfo?.name || '—'} &nbsp;·&nbsp; {hodInfo?.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden md:inline text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                      {deptReps.length} reports · {deptApproved} approved
                    </span>
                    {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4">
                    {deptReps.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No feedback reports submitted for this department yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="text-[10px] uppercase text-slate-500 dark:text-slate-400 tracking-wide border-b border-slate-100 dark:border-slate-800">
                            <tr>
                              <th className="pb-2 pr-4">Faculty</th>
                              <th className="pb-2 pr-4">Subject</th>
                              <th className="pb-2 pr-4">Sem</th>
                              <th className="pb-2 pr-4">FFI</th>
                              <th className="pb-2 pr-4">Status</th>
                              <th className="pb-2">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {deptReps.map(r => (
                              <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                                <td className="py-2 pr-4 font-medium text-slate-800 dark:text-slate-200">{r.facultyName || '—'}</td>
                                <td className="py-2 pr-4 text-slate-600 dark:text-slate-400 font-mono">{r.subjectCode || '—'}</td>
                                <td className="py-2 pr-4 text-slate-600 dark:text-slate-400">{r.semester || '—'}</td>
                                <td className="py-2 pr-4 font-bold text-indigo-600 dark:text-indigo-400">{r.ffiScore?.toFixed(2) ?? '—'}</td>
                                <td className="py-2 pr-4">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColor(r.status)}`}>
                                    {statusIcon(r.status)} {(r.status || '').replace(/_/g, ' ')}
                                  </span>
                                </td>
                                <td className="py-2">
                                  <button onClick={() => setSelectedReport(r)} className="p-1.5 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
                                    <Eye size={13} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Report Preview/Edit Modal */}
      {selectedReport && (
        <ReportPreviewModal
          report={selectedReport}
          isDark={isDark}
          onClose={() => setSelectedReport(null)}
          onSave={(updated) => {
            setReports(prev => prev.map(r => r._id === updated._id ? { ...r, ...updated } : r));
            setSelectedReport(null);
          }}
        />
      )}
    </div>
  );
}
