import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ReportDetailModal from "../components/ReportDetailModal";
import {
  Archive, Download, Filter, Eye, Search,
  BookOpen, Users, TrendingUp, CheckCircle, ChevronDown, ChevronUp, FileText, ArrowLeft
} from "lucide-react";

const currentYear = new Date().getFullYear();
const SESSIONS = [
  { value: "jul-dec", label: "Jul – Dec (Odd Semester)" },
  { value: "jan-may", label: "Jan – Jun (Even Semester)" },
];

function ffiColor(avg) {
  const v = parseFloat(avg);
  if (v >= 4) return "text-emerald-600";
  if (v >= 3) return "text-amber-600";
  return "text-red-600";
}
function ffiBg(avg) {
  const v = parseFloat(avg);
  if (v >= 4) return "bg-emerald-50 border-emerald-200 text-emerald-700";
  if (v >= 3) return "bg-amber-50 border-amber-200 text-amber-700";
  return "bg-red-50 border-red-200 text-red-700";
}

// Build a safe filename from department + year + session
function buildFilename(sub, semFilter) {
  const dept = (sub.hodId?.department || sub.department || "Report")
    .replace(/[<>:"/\\|?*]+/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 40);
  const year = sub.academicYear || new Date().getFullYear();
  const session = sub.session === "jan-may" ? "Jan-Jun" : sub.session === "jul-dec" ? "Jul-Dec" : (sub.session || "All");
  if (semFilter) return `${dept}_${year}_${session}_Sem${semFilter}.pdf`;
  return `${dept}_${year}_${session}.pdf`;
}

// ── Submission card with semester-wise download ───────────────
function SubmissionCard({ sub, token, onViewReport, filterFaculty }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    if (filterFaculty) setExpanded(true);
  }, [filterFaculty]);

  const reports = (sub.reports || []).filter(r =>
    !filterFaculty || (r.facultyName && r.facultyName.toLowerCase().includes(filterFaculty.toLowerCase()))
  );
  if (reports.length === 0) return null;

  const semMap = {};
  reports.forEach(r => {
    const s = r.semester || "Unknown";
    if (!semMap[s]) semMap[s] = [];
    semMap[s].push(r);
  });
  const semesters = Object.keys(semMap).sort((a, b) => {
    const na = parseInt(a), nb = parseInt(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });

  const allFFIs = reports.map(r => r.ffiScore).filter(Boolean);
  const avgAll  = allFFIs.length ? (allFFIs.reduce((s,v)=>s+v,0)/allFFIs.length).toFixed(2) : null;

  async function download(semFilter) {
    const id = semFilter || "all";
    setDownloading(id);
    const toastId = `dl-${sub._id}-${id}`;
    toast.loading(semFilter ? `Generating Sem ${semFilter} PDF...` : "Generating full PDF...", { id: toastId });
    try {
      const url = semFilter
        ? `/api/submissions/${sub._id}/download-pdf?semester=${semFilter}`
        : `/api/submissions/${sub._id}/download-pdf`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const e = await res.json().catch(()=>({error:"Failed"})); toast.error(e.error || "Failed", { id: toastId }); return; }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = buildFilename(sub, semFilter);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      toast.success("Downloaded!", { id: toastId });
    } catch { toast.error("Download failed", { id: toastId }); }
    finally { setDownloading(null); }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Card header */}
      <div className="px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center shrink-0">
            <FileText size={18} className="text-indigo-600 dark:text-indigo-400"/>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                {user?.role === "faculty"
                  ? `${sub.reports?.[0]?.subjectCode || 'Report'} (${sub.reports?.[0]?.programme || 'Feedback'})`
                  : (sub.hodId?.name || "HOD")}
              </p>
              <span className="text-xs bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle size={10}/> Approved
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {sub.academicYear && <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">📅 {sub.academicYear}</span>}
              {sub.session && <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">🗓 {sub.session === "jan-may" ? "Jan–Jun (Even)" : sub.session === "jul-dec" ? "Jul–Dec (Odd)" : sub.session}</span>}
              {sub.department && <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">🏢 {sub.department}</span>}
              {sub.feedbackFormNo && <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">📄 Form {sub.feedbackFormNo}</span>}
              {user?.role !== "faculty" && <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">📋 {reports.length} reports</span>}
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{new Date(sub.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {avgAll && (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${ffiBg(avgAll)}`}>FFI {avgAll}</span>
          )}
          <button onClick={() => download(null)} disabled={downloading === "all"}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-60">
            {downloading === "all"
              ? <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              : <Download size={12}/>}
            Download All
          </button>
          {semesters.length > 0 && (
            <button onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 px-3 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/60 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors">
              {expanded ? "Hide" : "Details"} {expanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
            </button>
          )}
        </div>
      </div>

      {/* Semester-wise breakdown */}
      {expanded && semesters.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-700 px-5 py-4 bg-slate-50/60 dark:bg-slate-900/30 space-y-5">
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Semester-wise Download</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {semesters.map(sem => {
                const semReports = semMap[sem];
                const semFFIs = semReports.map(r => r.ffiScore).filter(Boolean);
                const semAvg  = semFFIs.length ? (semFFIs.reduce((s,v)=>s+v,0)/semFFIs.length).toFixed(2) : null;
                const isLoading = downloading === sem;
                return (
                  <div key={sem} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-sm transition-all group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                          <BookOpen size={11} className="text-indigo-600 dark:text-indigo-400"/>
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{isNaN(parseInt(sem)) ? sem : `Sem ${sem}`}</span>
                      </div>
                      {semAvg && <span className={`text-xs font-bold ${ffiColor(semAvg)}`}>{semAvg}</span>}
                    </div>
                    <div className="flex items-center gap-2 mb-3 min-w-0">
                      {user?.role === "faculty" ? (
                        <span className="text-[10px] bg-slate-50 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono truncate">📚 {semReports[0]?.subjectCode || 'Subject'}</span>
                      ) : (
                        <><Users size={10} className="text-slate-400 shrink-0"/><span className="text-xs text-slate-500 truncate">{semReports.length} faculty</span></>
                      )}
                    </div>
                    {semAvg && (
                      <div className="h-1 bg-slate-100 dark:bg-slate-700 rounded-full mb-3 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${parseFloat(semAvg)>=4?"bg-emerald-500":parseFloat(semAvg)>=3?"bg-amber-500":"bg-red-500"}`}
                          style={{width:`${Math.min((parseFloat(semAvg)/5)*100,100)}%`}}/>
                      </div>
                    )}
                    <button onClick={() => download(sem)} disabled={isLoading}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60">
                      {isLoading ? <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : <Download size={11}/>}
                      Download PDF
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Records Table */}
          <div className="pt-4 space-y-6">
            {semesters.map(sem => (
              <div key={sem}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-4 w-1 bg-indigo-500 rounded-full"></div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Semester {sem}</h4>
                  <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-medium">{semMap[sem].length} reports</span>
                </div>
                <div className="overflow-hidden border border-slate-200/80 dark:border-slate-700/80 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700/60">
                        <tr>
                          {user?.role !== "faculty" && <th className="px-4 py-3">Faculty Member</th>}
                          <th className="px-4 py-3">Subject Code</th>
                          <th className="px-4 py-3">Course Name</th>
                          <th className="px-4 py-3 text-center">FFI Score</th>
                          <th className="px-4 py-3 text-center">Resp. %</th>
                          <th className="px-4 py-3 text-left">AI Analysis</th>
                          <th className="px-4 py-3">HOD Remarks / Actions</th>
                          <th className="px-4 py-3 text-center">View</th>
                          {user?.role === "faculty" && <th className="px-4 py-3 text-center">Download</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-200">
                        {semMap[sem].map(r => (
                          <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors align-top">
                            {user?.role !== "faculty" && (
                              <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">{r.facultyName || "—"}</td>
                            )}
                            <td className="px-4 py-3 font-mono font-medium text-slate-600 whitespace-nowrap">{r.subjectCode || "—"}</td>
                            <td className="px-4 py-3 text-slate-500">{r.programme || "—"}</td>
                            <td className="px-4 py-3 text-center font-bold">
                              {r.ffiScore != null ? <span className={`px-2 py-0.5 rounded-lg border text-xs ${ffiBg(r.ffiScore)}`}>{r.ffiScore.toFixed(2)}</span> : "—"}
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-slate-500 text-xs">
                              {r.responsePercent != null ? `${Number(r.responsePercent).toFixed(2)}%` : (r.responseCount ?? r.totalResponses ?? "—")}
                            </td>
                            <td className="px-4 py-3 min-w-[200px] max-w-[300px]">
                              <div className="space-y-3">
                                {r.appreciation?.length > 0 && (
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Appreciation</p>
                                    {r.appreciation.filter(c => c.trim().split(/\s+/).length >= 6).map((c,i) => <p key={i} className="text-[10px] text-slate-600 leading-snug">• {c}</p>)}
                                  </div>
                                )}
                                {r.commentsNeedingAttention?.length > 0 && (
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Needs Attention</p>
                                    {r.commentsNeedingAttention.map((c,i) => <p key={i} className="text-[10px] text-slate-600 leading-snug">• {c}</p>)}
                                  </div>
                                )}
                                {!r.appreciation?.length && !r.commentsNeedingAttention?.length && <span className="text-slate-300">—</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3 max-w-[240px]">
                              <div className="space-y-1">
                                {r.hodRemarks && <p className="text-[10px] text-slate-600"><span className="font-semibold">Remarks:</span> {r.hodRemarks}</p>}
                                {r.actionTaken && <p className="text-[10px] text-slate-600"><span className="font-semibold">Action Taken:</span> {r.actionTaken}</p>}
                                {!r.hodRemarks && !r.actionTaken && <span className="text-slate-300">—</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <button onClick={() => onViewReport(r)} className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg transition-colors border border-indigo-100 flex items-center gap-1 mx-auto">
                                <Eye size={11}/> View
                              </button>
                            </td>
                            {user?.role === "faculty" && (
                              <td className="px-4 py-3 text-center whitespace-nowrap">
                                <button onClick={() => download(r.semester)} className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg transition-colors border border-indigo-100 flex items-center gap-1 mx-auto">
                                  <Download size={11}/> PDF
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function History() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filterYear, setFilterYear]   = useState("");
  const [filterSession, setFilterSession] = useState("");
  const [filterDept, setFilterDept]   = useState("");
  const [filterFaculty, setFilterFaculty] = useState("");
  const [yearInput, setYearInput]     = useState("");
  const [viewReport, setViewReport]   = useState(null);
  const api = axios.create({ headers: { Authorization: `Bearer ${token}` } });

  // Role-based dashboard path
  const dashboardPath = user?.role === "faculty" ? "/faculty"
    : user?.role === "hod" || user?.activeWorkspace === "hod" ? "/hod"
    : user?.role === "vc"  || user?.activeWorkspace === "vc"  ? "/vc"
    : user?.role === "admin" ? "/admin"
    : "/";

  useEffect(() => { fetchHistory(); }, []);

  async function fetchHistory() {
    setLoading(true);
    try {
      const url = user?.role === "vc"
        ? "/api/submissions/all"
        : user?.role === "faculty"
        ? "/api/submissions/faculty"
        : "/api/submissions/my";
      const { data } = await api.get(url);
      setSubmissions((data || []).filter(s => s.status === "approved"));
    } catch { toast.error("Failed to load history"); }
    finally { setLoading(false); }
  }

  // Build unique department list from actual submission data
  const depts = [...new Set(
    submissions.map(s => s.hodId?.department || s.department).filter(Boolean)
  )].sort();

  const allFacultyList = [...new Set(
    submissions.flatMap(s => (s.reports || []).map(r => r.facultyName)).filter(Boolean)
  )].sort();

  // ── Filtering logic ──
  const filtered = submissions.filter(s => {
    // Year filter: match academicYear exactly or by start year
    if (filterYear) {
      const ay = s.academicYear || "";
      // filterYear is like "2025-2026" — match exact or if user typed just "2025"
      if (ay !== filterYear && !ay.startsWith(filterYear.split("-")[0])) return false;
    }
    // Session filter
    if (filterSession && s.session !== filterSession) return false;
    // Department filter — check both hodId.department and submission.department
    if (filterDept) {
      const subDept = (s.hodId?.department || s.department || "").toLowerCase();
      if (!subDept.includes(filterDept.toLowerCase())) return false;
    }
    // Faculty filter — partial match anywhere in faculty names
    if (filterFaculty) {
      const hasMatch = (s.reports || []).some(r =>
        r.facultyName && r.facultyName.toLowerCase().includes(filterFaculty.toLowerCase())
      );
      if (!hasMatch) return false;
    }
    return true;
  });

  const totalReports = filtered.reduce((s, sub) => s + (sub.reports?.length || 0), 0);
  const allFFIs = filtered.flatMap(sub => (sub.reports||[]).map(r=>r.ffiScore).filter(Boolean));
  const overallAvg = allFFIs.length ? (allFFIs.reduce((s,v)=>s+v,0)/allFFIs.length).toFixed(2) : null;

  const grouped = {};
  filtered.forEach(s => {
    const yr = s.academicYear || "Unknown Year";
    if (!grouped[yr]) grouped[yr] = [];
    grouped[yr].push(s);
  });

  const hasFilters = filterYear || filterSession || filterDept || filterFaculty;

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <Navbar title="History" subtitle="Approved Reports" />

      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Page header with Back to Dashboard ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Archive size={22} className="text-indigo-600 dark:text-indigo-400"/> Report History
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">All VC-approved submissions with semester-wise PDF download</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
              {filtered.length} submission{filtered.length !== 1 ? "s" : ""}
            </span>
            <button onClick={() => navigate(dashboardPath)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow transition-colors">
              <ArrowLeft size={14}/> Back to Dashboard
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label:"Submissions",   value:filtered.length,   icon:Archive,   color:"text-indigo-600 dark:text-indigo-400", bg:"bg-indigo-50 dark:bg-indigo-900/30" },
              { label:"Total Reports", value:totalReports,       icon:FileText,  color:"text-teal-600 dark:text-teal-400",    bg:"bg-teal-50 dark:bg-teal-900/30"   },
              { label:"Overall Avg FFI", value:overallAvg||"—",  icon:TrendingUp, color:overallAvg?ffiColor(overallAvg):"text-slate-450", bg:"bg-slate-50 dark:bg-slate-900/30" },
            ].map(({ label, value, icon:Icon, color, bg }) => (
              <div key={label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm p-4 flex items-center gap-3">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon size={18} className={color}/>
                </div>
                <div>
                  <p className={`text-xl font-black ${color}`}>{value}</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Filters ── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={13} className="text-slate-400"/>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Filter Records</span>
          </div>
          <div className="flex flex-wrap gap-4 items-end">

            {/* Academic Year */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Academic Year</label>
              <div className="flex items-center gap-2">
                <input type="number" min="2000" max="2100" placeholder={`e.g. ${currentYear}`}
                  value={yearInput}
                  onChange={e => {
                    const v = e.target.value;
                    setYearInput(v);
                    if (v.length === 4 && !isNaN(v)) {
                      const yr = parseInt(v);
                      setFilterYear(`${yr}-${yr + 1}`);
                    } else if (v === "") {
                      setFilterYear("");
                    }
                  }}
                  className="px-3 py-2 w-28 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                {filterYear && (
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">{filterYear}</span>
                )}
              </div>
            </div>

            {/* Session */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Session</label>
              <select value={filterSession} onChange={e => setFilterSession(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-200 w-44">
                <option value="">All Sessions</option>
                {SESSIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            {/* Department — VC and HOD */}
            {(user?.role === "vc" || user?.role === "hod" || user?.activeWorkspace === "hod") && depts.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Department</label>
                <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 w-64">
                  <option value="">All Departments</option>
                  {depts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}

            {/* Faculty Name */}
            {user?.role !== "faculty" && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Faculty Name</label>
                <div className="relative">
                  <select value={filterFaculty} onChange={e => setFilterFaculty(e.target.value)}
                    className="px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-200 w-48 appearance-none">
                    <option value="">All Faculty</option>
                    {allFacultyList.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                </div>
              </div>
            )}

            {hasFilters && (
              <button onClick={() => { setFilterYear(""); setFilterSession(""); setFilterDept(""); setYearInput(""); setFilterFaculty(""); }}
                className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-2 rounded-xl hover:bg-red-50 transition-colors">
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-20 text-center">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"/>
            <p className="text-slate-400 text-sm">Loading history...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-20 text-center">
            <Archive size={40} className="text-slate-200 mx-auto mb-4"/>
            <p className="text-slate-500 font-semibold">
              {hasFilters ? "No records match the selected filters" : "No approved submissions found"}
            </p>
            <p className="text-slate-400 text-sm mt-1">
              {hasFilters
                ? <button onClick={() => { setFilterYear(""); setFilterSession(""); setFilterDept(""); setYearInput(""); setFilterFaculty(""); }} className="text-indigo-500 hover:underline">Clear filters</button>
                : "Approved submissions will appear here"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).sort((a,b) => b[0].localeCompare(a[0])).map(([year, subs]) => (
              <div key={year}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-slate-200"/>
                  <span className="flex items-center gap-2 bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">📅 {year}</span>
                  <div className="h-px flex-1 bg-slate-200"/>
                </div>
                <div className="space-y-3">
                  {subs.map(sub => (
                    <SubmissionCard key={sub._id} sub={sub} token={token} onViewReport={setViewReport} filterFaculty={filterFaculty} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer/>

      {viewReport && (
        <ReportDetailModal report={viewReport} onClose={() => setViewReport(null)} />
      )}
    </div>
  );
}
