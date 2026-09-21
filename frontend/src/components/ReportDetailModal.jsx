import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, FileText, User, BarChart3, CheckCircle2, Clock, AlertCircle, ExternalLink, ThumbsUp, AlertTriangle, Zap, ChevronDown } from "lucide-react";
import { getPdfUrl, API_BASE } from "../api";
import toast from "react-hot-toast";

const STATUS_CFG = {
  processed:        { color:"bg-emerald-100 text-emerald-700 border-emerald-200", icon:CheckCircle2, label:"Processed" },
  pending:          { color:"bg-slate-100 text-slate-600 border-slate-200",       icon:Clock,        label:"Pending" },
  error:            { color:"bg-red-100 text-red-700 border-red-200",             icon:AlertCircle,  label:"Error" },
  sent_to_faculty:  { color:"bg-indigo-100 text-indigo-700 border-indigo-200",    icon:Clock,        label:"Sent to Faculty" },
  faculty_approved: { color:"bg-emerald-100 text-emerald-700 border-emerald-200", icon:CheckCircle2, label:"Faculty Approved" },
};

export default function ReportDetailModal({ report, onClose, onApprove, onSendToFaculty, onHODApprove }) {
  if (!report) return null;

  const [showApproveForm, setShowApproveForm] = useState(false);
  const [approvalReason, setApprovalReason] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);

  // Download PDF using an authenticated fetch so the JWT is sent properly.
  // A plain <a href> would open in a new tab with no Authorization header,
  // causing a 401 which triggers the global interceptor and redirects the user.
  async function handleViewPDF(e) {
    e.preventDefault();

    // External links (Google Drive, GCS) don't need auth — open directly
    const url = getPdfUrl(report);
    if (url.startsWith('https://drive.google.com') || url.startsWith('https://storage.googleapis.com')) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    setPdfLoading(true);
    try {
      let token = '';
      try { token = JSON.parse(localStorage.getItem('auth') || '{}').token || ''; } catch {}

      const fetchRes = await fetch(`${API_BASE}/api/reports/${report._id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!fetchRes.ok) {
        const errData = await fetchRes.json().catch(() => ({}));
        if (errData.reason === 'stale_url') {
          throw new Error('This PDF was uploaded to a previous server and is no longer available. Please re-upload the feedback PDF from the HOD dashboard.');
        }
        throw new Error(errData.error || `Server returned ${fetchRes.status}`);
      }

      const blob = await fetchRes.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `${report.facultyName || 'feedback'}-report.pdf`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
    } catch (err) {
      toast.error(err.message || 'Could not load PDF', { duration: 6000 });
    } finally {
      setPdfLoading(false);
    }
  }

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose && onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const isEligibleForHODApprove = report.status === "sent_to_faculty" && report.sentToFacultyAt && (new Date() - new Date(report.sentToFacultyAt) >= 24 * 60 * 60 * 1000);

  const st = STATUS_CFG[report.status] || STATUS_CFG.pending;
  const StatusIcon = st.icon;
  const ffi = report.ffiScore;
  const ffiColor = ffi == null ? "text-slate-400" : ffi >= 4 ? "text-emerald-600" : ffi >= 3 ? "text-amber-600" : "text-red-600";
  const ffiBg    = ffi == null ? "bg-slate-50"    : ffi >= 4 ? "bg-emerald-50"    : ffi >= 3 ? "bg-amber-50"    : "bg-red-50";

  const pcts = report.commentPercentages || {};
  const pctEntries = Object.entries(pcts).filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1]);
  const attComments = report.commentsNeedingAttention || [];
  const appComments = report.appreciation || [];

  const modalJSX = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg">
              <User size={22} className="text-white"/>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{report.facultyName || "—"}</h2>
              <p className="text-sm text-slate-500">{report.subjectCode || "—"} · {report.programme || "—"} · Sem {report.semester || "—"}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-200 text-slate-500 transition-colors">
            <X size={18}/>
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

            {/* Card 1: Status */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center">
                  <StatusIcon size={16} className="text-slate-600"/>
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Status</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold border ${st.color}`}>
                <StatusIcon size={13}/> {st.label}
              </span>
              {report.errorMessage && (
                <p className="text-xs text-red-500 mt-2 leading-snug">{report.errorMessage}</p>
              )}
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Faculty ack.</span>
                  <span className={report.facultyAcknowledged ? "text-emerald-600 font-semibold" : "text-slate-400"}>
                    {report.facultyAcknowledged ? "✓ Yes" : "Pending"}
                  </span>
                </div>
                {report.facultyAcknowledgedAt && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Ack. date</span>
                    <span className="text-slate-600">{new Date(report.facultyAcknowledgedAt).toLocaleDateString("en-IN")}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Faculty Info */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <User size={16} className="text-indigo-600"/>
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Faculty</p>
              </div>
              <p className="font-bold text-slate-900 text-sm mb-1">{report.facultyName || "—"}</p>
              <div className="space-y-1.5 mt-2">
                {[
                  ["Subject Code", report.subjectCode],
                  ["Programme",   report.programme],
                  ["Semester",    report.semester ? `Sem ${report.semester}` : "—"],
                ].map(([l,v]) => (
                  <div key={l} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{l}</span>
                    <span className="text-slate-700 font-medium">{v || "—"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3: PDF */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center">
                  <FileText size={16} className="text-rose-600"/>
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">PDF</p>
              </div>
              {(report._id || report.driveLink) ? (
                <button
                  onClick={handleViewPDF}
                  disabled={pdfLoading}
                  className="flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-60 disabled:cursor-wait w-full"
                >
                  <ExternalLink size={13}/> {pdfLoading ? "Loading PDF..." : "View Feedback PDF"}
                </button>
              ) : (
                <p className="text-xs text-slate-400 italic">No PDF link</p>
              )}
            </div>

            {/* Card 4: FFI Score */}
            <div className={`${ffiBg} border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <BarChart3 size={16} className={ffiColor}/>
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">FFI Score</p>
              </div>
              <p className={`text-4xl font-black ${ffiColor} mb-1`}>
                {ffi != null ? ffi.toFixed(2) : "—"}
              </p>
              <p className="text-xs text-slate-500 mb-3">
                {ffi == null ? "Not calculated" : ffi >= 4 ? "Excellent performance" : ffi >= 3 ? "Good performance" : "Needs improvement"}
              </p>
              {/* FFI bar */}
              {ffi != null && (
                <div className="w-full bg-white/60 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${ffi>=4?"bg-emerald-500":ffi>=3?"bg-amber-500":"bg-red-500"}`}
                    style={{ width: `${Math.min((ffi/5)*100, 100)}%` }}/>
                </div>
              )}
            </div>
          </div>

          {/* Comment Percentages */}
          {pctEntries.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 mb-6">
              <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-3">📊 Response Breakdown</p>
              <div className="space-y-2.5">
                {pctEntries.map(([label, pct]) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 w-24 shrink-0">{label}</span>
                    <div className="flex-1 bg-blue-100 dark:bg-blue-900/40 rounded-full h-2.5">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300 w-12 text-right">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments Analysis — Separate Sections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Appreciation (Good Comments) */}
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ThumbsUp size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Appreciation</span>
                </div>
                <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-lg">{appComments.length}</span>
              </div>
              <div className="p-3 space-y-1.5 max-h-56 overflow-y-auto">
                {appComments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2 text-center">No appreciation comments</p>
                ) : appComments.map((t, i) => (
                  <div key={i} className="flex gap-2 text-xs text-slate-700 dark:text-slate-300 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-lg px-3 py-2 leading-snug">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Needs Attention (Bad Comments) */}
            <div className="rounded-2xl border border-amber-200 dark:border-amber-800 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Needs Attention</span>
                </div>
                <span className="text-xs font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-lg">{attComments.length}</span>
              </div>
              <div className="p-3 space-y-1.5 max-h-56 overflow-y-auto">
                {attComments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2 text-center">No concerns raised</p>
                ) : attComments.map((t, i) => (
                  <div key={i} className="flex gap-2 text-xs text-slate-700 dark:text-slate-300 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-lg px-3 py-2 leading-snug">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Raw Student Comments — Collapsible */}
          {report.rawStudentComments && report.rawStudentComments.length > 0 && (
            <details className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-6 group">
              <summary className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 cursor-pointer flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <span>📝 All Student Comments ({report.rawStudentComments.length})</span>
                <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
              </summary>
              <div className="p-3 space-y-1 max-h-64 overflow-y-auto">
                {report.rawStudentComments.map((t, i) => (
                  <div key={i} className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-lg px-3 py-1.5 leading-snug">
                    {i + 1}. {t}
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Action Taken */}
          {report.actionTaken && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Action Taken</p>
              <p className="text-sm text-slate-700 leading-relaxed">{report.actionTaken}</p>
            </div>
          )}

          {showApproveForm && (
            <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 mb-6 space-y-3 animate-fade-in text-left">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                <AlertTriangle size={16} /> Enter Action Taken / Approval Reason
              </div>
              <p className="text-xs text-amber-600">Please provide a valid action taken explanation. This will be stored on the report and visible to the VC and the Faculty member.</p>
              <textarea
                className="w-full border border-amber-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                placeholder="Describe action taken / reason for HOD approval..."
                rows={3}
                value={approvalReason}
                onChange={e => { setApprovalReason(e.target.value); if(e.target.value.trim()) setErrorMsg(""); }}
              />
              {errorMsg && <p className="text-xs text-red-500 font-semibold">{errorMsg}</p>}
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowApproveForm(false)} className="px-4 py-1.5 bg-slate-100 hover:bg-slate-250 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 text-xs font-bold rounded-xl transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!approvalReason.trim()) {
                      setErrorMsg("A valid Action Taken comment is required to approve.");
                      return;
                    }
                    onHODApprove(report._id, approvalReason);
                    onClose();
                  }}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Confirm Force Approve
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${st.color}`}>
              <StatusIcon size={12}/> {st.label}
            </span>
            {ffi != null && (
              <span className={`text-sm font-bold ${ffiColor}`}>FFI: {ffi.toFixed(2)}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="btn btn-secondary btn-sm">Close</button>
            {report.status === "processed" && onSendToFaculty && (
              <button onClick={() => { onSendToFaculty(report._id); onClose(); }}
                className="btn btn-primary btn-sm flex items-center gap-1.5">
                <Zap size={13}/> Send to Faculty
              </button>
            )}
            {isEligibleForHODApprove && onHODApprove && !showApproveForm && (
              <button onClick={() => setShowApproveForm(true)}
                className="btn btn-sm bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5">
                <CheckCircle2 size={13}/> HOD Approve
              </button>
            )}
            {report.status === "faculty_approved" && onApprove && (
              <button onClick={() => { onApprove(report._id); onClose(); }}
                className="btn btn-success btn-sm flex items-center gap-1.5">
                <CheckCircle2 size={13}/> Mark Ready
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalJSX, document.body) : modalJSX;
}
