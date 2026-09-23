import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import FeedbackTable from "../components/FeedbackTable";
import StatsBar from "../components/StatsBar";
import BatchPDFUploadModal from "../components/BatchPDFUploadModal";
import Footer from "../components/Footer";
import WorkspaceSwitcher from "../components/WorkspaceSwitcher";
import { Upload, Send, Trash2, RefreshCw, Wrench, Users, Plus, Download, FileText, X, ChevronRight, PenLine, Clock, CheckCircle, AlertTriangle, ShieldAlert } from "lucide-react";


// Dynamic academic year list from 2020 to 10 years ahead
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 11 }, (_, i) => {
  const y = 2020 + i;
  return `${y}-${y + 1}`;
});

export default function HODDashboard() {
  const { token, user, logout, updateUser, isMultiRole, activeWorkspace } = useAuth();
  const sigRef = useRef();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [okReviewed, setOkReviewed] = useState(new Set());
  const [vcUser, setVcUser] = useState(null);
  
  const [dismissedNotifs, setDismissedNotifs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dismissedNotifs') || '[]'); } catch { return []; }
  });

  function dismissNotif(id) {
    const updated = [...dismissedNotifs, id];
    setDismissedNotifs(updated);
    localStorage.setItem('dismissedNotifs', JSON.stringify(updated));
  }

  const [currentSession, setCurrentSession] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);

  // Signature modal
  const [showSigModal, setShowSigModal] = useState(false);
  const [sigPreview, setSigPreview] = useState(user?.signatureImage || null);
  const [sigSaving, setSigSaving] = useState(false);

  // PDF preview (before VC)
  const [exportingPDF, setExportingPDF] = useState(false);

  const api = axios.create({ headers: { Authorization: `Bearer ${token}` } });

  useEffect(() => { fetchReports(); fetchSubmissions(); fetchVCUser(); }, []);

  async function fetchSubmissions() {
    try { const { data } = await api.get("/api/submissions/my"); setSubmissions(data); } catch { }
  }
  async function fetchVCUser() {
    try { const { data } = await api.get("/api/auth/vc-info"); setVcUser(data); } catch { }
  }
  async function fetchReports() {
    setLoading(true);
    try {
      const { data } = await api.get("/api/reports/my");
      setReports(data);
      const autoSelect = [];
      setSelected(autoSelect);
    }
    catch (err) {
      if (err.response?.status === 401) { toast.error("Session expired"); logout(); return; }
      toast.error("Failed to load reports");
    } finally { setLoading(false); }
  }

  // Compute which report IDs are in any submission
  const submittedIds = new Set(
    submissions
      .flatMap(s => (s.reports || []).map(r => (typeof r === "string" ? r : r?._id?.toString())))
      .filter(Boolean)
  );



  async function handleSendToVC() {
    if (selected.length === 0) return toast.error("Select at least one report");
    const notApproved = reports.filter(r => selected.includes(r._id) && r.status !== "faculty_approved");
    if (notApproved.length > 0) {
      const names = notApproved.map(r => r.facultyName || "Unknown").join(", ");
      return toast.error(`Cannot send to VC: The following report(s) must be approved by faculty first:\n${names}`);
    }
    try {
      await api.post("/api/submissions/send", {
        reportIds: selected,
        academicYear: currentSession?.academicYear || YEARS[Math.max(0, CURRENT_YEAR - 2020)],
        department: currentSession?.department || user?.department || "",
        session: currentSession?.session || "",
        feedbackFormNo: currentSession?.feedbackFormNo || "I",
        submissionDate: new Date().toISOString()
      });
      toast.success("Reports sent to VC successfully"); setSelected([]);
      fetchSubmissions();
    } catch (err) { toast.error(err.response?.data?.error || "Failed to send"); }
  }

  async function handleBulkSendToFaculty() {
    const ids = reports.filter(r => r.status === "processed").map(r => r._id);
    if (ids.length === 0) return toast.error("No processed reports to send");
    try {
      const { data } = await api.post("/api/reports/bulk-send-to-faculty", { reportIds: ids });
      toast.success(`Sent ${data.sent} reports to faculty`); fetchReports();
    } catch (err) { toast.error(err.response?.data?.error || "Failed"); }
  }

  async function handleExportCSV() {
    try {
      toast.success("Downloading CSV...");
      const res = await api.get("/api/reports/my/export", { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "feedback-reports.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Failed to export CSV");
    }
  }

  // Export PDF before VC approval (HOD review)
  async function handleExportPDF() {
    if (reports.length === 0) return toast.error("No reports to export");
    setExportingPDF(true);
    toast.loading("Generating preview PDF...", { id: "pdf-preview" });
    try {
      const res = await api.get("/api/reports/my/preview-pdf", { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hod-review-report-${new Date().toISOString().split("T")[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded for review!", { id: "pdf-preview" });
    } catch (err) {
      toast.error("Failed to generate PDF", { id: "pdf-preview" });
    } finally { setExportingPDF(false); }
  }

  async function handleSendToFaculty(reportId) {
    try { await api.post(`/api/reports/${reportId}/send-to-faculty`); toast.success("Report sent to faculty"); fetchReports(); }
    catch (err) { toast.error(err.response?.data?.error || "Failed to send"); }
  }

  async function handleHODApprove(reportId, reason) {
    try {
      await api.patch(`/api/reports/${reportId}/edit`, { status: "faculty_approved", actionTaken: reason });
      setReports(prev => prev.map(r => r._id === reportId ? { ...r, status: "faculty_approved", actionTaken: reason || r.actionTaken } : r));
      toast.success("Report approved by HOD");
    } catch { toast.error("Failed to approve"); }
  }
  async function handleFieldEdit(reportId, field, value) {
    try {
      await api.patch(`/api/reports/${reportId}/edit`, { [field]: value });
      setReports(prev => prev.map(r => r._id === reportId ? { ...r, [field]: value } : r));
    } catch { toast.error("Failed to update"); }
  }

  // Single report delete (only for non-approved, non-VC-approved reports)
  async function handleDeleteReport(reportId) {
    if (!window.confirm("Delete this report? This cannot be undone.")) return;
    try {
      await api.delete(`/api/reports/${reportId}`);
      setReports(prev => prev.filter(r => r._id !== reportId));
      setSelected(prev => prev.filter(id => id !== reportId));
      toast.success("Report deleted");
    } catch (err) { toast.error(err.response?.data?.error || "Failed to delete"); }
  }

  async function clearAllReports() {
    if (!window.confirm("Delete all non-approved reports? This cannot be undone.")) return;
    try {
      const { data } = await api.delete("/api/reports/my/all");
      await fetchReports();
      toast.success(`Deleted ${data.deleted} reports`);
    } catch { toast.error("Failed to delete"); }
  }
  async function fixMetadata() {
    toast("Re-extracting names from PDFs...", { icon: "🔄" });
    try {
      const { data } = await api.post("/api/reports/my/fix-metadata");
      toast.success(`Fixed ${data.fixed} of ${data.total} reports`); fetchReports();
    } catch { toast.error("Failed to fix metadata"); }
  }
  function handleInlineOk(reportId) {
    setOkReviewed(prev => new Set([...prev, reportId]));
    api.post(`/api/reports/${reportId}/send-to-faculty`)
      .then(() => { toast.success("Report sent to faculty dashboard"); fetchReports(); })
      .catch(err => toast.error("Failed: " + (err.response?.data?.error || err.message)));
  }

  // Signature upload handlers
  function handleSigFile(e) {
    const file = e.target.files[0]; if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please upload an image file (PNG/JPG)");
    if (file.size > 2 * 1024 * 1024) return toast.error("Image must be under 2MB");
    const reader = new FileReader();
    reader.onload = (ev) => setSigPreview(ev.target.result);
    reader.readAsDataURL(file);
  }
  async function handleSigSave() {
    if (!sigPreview) return;
    setSigSaving(true);
    try {
      const res = await api.post("/api/auth/signature", { signatureImage: sigPreview });
      if (res.data.user) updateUser(res.data.user);
      toast.success("Signature saved successfully");
      setShowSigModal(false);
    } catch { toast.error("Failed to save signature"); }
    finally { setSigSaving(false); }
  }

  const processed = reports.filter(r => r.status === "processed");
  const approvedSubs = submissions.filter(s => s.status === "approved" || s.status === "rejected" || s.status === "sent_back");

  // ── VC decision popup ─────────────────────────────────────────────────────
  // Show once per session for each unacknowledged VC decision.
  // Dismissed IDs are persisted to localStorage so reloads don't re-show.
  const [vcPopupQueue, setVcPopupQueue] = useState([]);
  const [vcPopupIdx,   setVcPopupIdx]   = useState(0);
  const [showVcPopup,  setShowVcPopup]  = useState(false);

  useEffect(() => {
    const dismissed = JSON.parse(localStorage.getItem('dismissedVcDecisions') || '[]');
    const pending = approvedSubs.filter(s => !dismissed.includes(s._id));
    if (pending.length > 0) {
      setVcPopupQueue(pending);
      setVcPopupIdx(0);
      setShowVcPopup(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissions.length]);

  function dismissVcPopup() {
    const current = vcPopupQueue[vcPopupIdx];
    if (current) {
      const dismissed = JSON.parse(localStorage.getItem('dismissedVcDecisions') || '[]');
      dismissed.push(current._id);
      localStorage.setItem('dismissedVcDecisions', JSON.stringify(dismissed));
    }
    if (vcPopupIdx + 1 < vcPopupQueue.length) {
      setVcPopupIdx(i => i + 1);
    } else {
      setShowVcPopup(false);
    }
  }

  const visibleReports = reports.filter(r => {
    if (sessionStartTime) return new Date(r.createdAt).getTime() >= sessionStartTime;
    return !submittedIds.has(String(r._id));
  });

  const hodStats = [
    { label: "Total Reports",   value: visibleReports.length, icon: FileText,    color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
    { label: "Pending Action",  value: visibleReports.filter(r => r.status === 'processed').length, icon: Clock,       color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-100" },
    { label: "Sent to Faculty", value: visibleReports.filter(r => r.status === 'sent_to_faculty').length, icon: Send,        color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-100" },
    { label: "Approved",        value: visibleReports.filter(r => r.status === 'faculty_approved').length, icon: CheckCircle, color: "text-emerald-600",bg: "bg-emerald-50",border: "border-emerald-100" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <Navbar title="HOD Dashboard" subtitle={currentSession ? `${currentSession.department} · ${currentSession.academicYear}` : `${user?.department || "Department"}`} />

      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 py-6 space-y-5">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 animate-fade-in mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-600 dark:from-indigo-400 dark:to-purple-400">HOD Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
              {currentSession
                ? `${currentSession.department} · ${currentSession.academicYear}`
                : `Academic Year ${YEARS[Math.max(0, CURRENT_YEAR - 2020)]} · ${user?.department || "Department"}`}
            </p>
          </div>

        </div>

        {/* VC Decision Popup Modal */}
        {showVcPopup && vcPopupQueue[vcPopupIdx] && (() => {
          const sub = vcPopupQueue[vcPopupIdx];
          const isApproved  = sub.status === "approved";
          const isRejected  = sub.status === "rejected";
          const isSentBack  = sub.status === "sent_back";
          const remaining   = vcPopupQueue.length - vcPopupIdx - 1;
          return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in">
              <div className={`bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in border-2 ${
                isApproved ? "border-emerald-400" : isRejected ? "border-red-400" : "border-amber-400"
              }`}>
                {/* Header strip */}
                <div className={`px-6 py-5 ${
                  isApproved  ? "bg-gradient-to-r from-emerald-500 to-green-500"
                  : isRejected ? "bg-gradient-to-r from-red-500 to-rose-500"
                  : "bg-gradient-to-r from-amber-500 to-orange-500"
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">
                      {isApproved ? "✅" : isRejected ? "❌" : "↩️"}
                    </span>
                    <div>
                      <p className="text-white font-black text-xl leading-tight">
                        {isApproved  ? "Submission Approved!" 
                        : isRejected ? "Submission Rejected"
                        : "Submission Sent Back"}
                      </p>
                      <p className="text-white/80 text-sm mt-0.5">
                        VC Decision — {sub.academicYear || new Date().getFullYear()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                    {isApproved && <>
                      The Pro Vice-Chancellor has <strong className="text-emerald-600">approved</strong> your feedback
                      submission for the <strong>{sub.department || "your department"}</strong> department,
                      Academic Year <strong>{sub.academicYear || "2026"}</strong>
                      {sub.session ? `, ${sub.session === "jan-may" ? "Jan – May" : "Jul – Dec"} session` : ""}.
                      The final PDF report is now available.
                    </>}
                    {isRejected && <>
                      The Pro Vice-Chancellor has <strong className="text-red-600">rejected</strong> your feedback
                      submission for <strong>{sub.department || "your department"}</strong>,
                      Academic Year <strong>{sub.academicYear || "2026"}</strong>.
                      Please review the comments and resubmit.
                    </>}
                    {isSentBack && <>
                      The Pro Vice-Chancellor has <strong className="text-amber-600">sent back</strong> your
                      submission for <strong>{sub.department || "your department"}</strong> for revision.
                    </>}
                  </p>

                  {sub.vcComment && (
                    <div className={`rounded-2xl p-4 border ${
                      isApproved  ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                      : isRejected ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
                      : "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
                    }`}>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">VC Comment</p>
                      <p className="text-sm text-slate-800 dark:text-slate-200 italic">"{sub.vcComment}"</p>
                    </div>
                  )}

                  {remaining > 0 && (
                    <p className="text-xs text-slate-400 text-center">
                      {remaining} more decision{remaining > 1 ? "s" : ""} waiting
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                  {isApproved && (
                    <a
                      href="/hod/history"
                      onClick={dismissVcPopup}
                      className="btn btn-success flex-1 text-center justify-center"
                    >
                      📄 View & Download PDF
                    </a>
                  )}
                  <button
                    onClick={dismissVcPopup}
                    className={`btn flex-1 justify-center ${isApproved ? "btn-secondary" : "btn-primary"}`}
                  >
                    {remaining > 0 ? "Next →" : "Dismiss"}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── REPORTS ── */}
        <>


          {loading ? (
            <div className="card p-12 text-center animate-fade-in">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 text-sm font-semibold">Loading reports...</p>
              <p className="text-slate-400 text-xs mt-1">Fetching from database</p>
            </div>
          ) : (
            <div className="animate-slide-up">
              <StatsBar stats={hodStats} />

              {/* ── Toolbar ── */}
              <div className="card px-5 py-3.5 flex flex-wrap gap-2 items-center justify-between animate-fade-in mt-4">
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setShowBatchModal(true)} className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm">
                    <Plus size={15} /> Upload Feedback Reports
                  </button>

                  {reports.length > 0 && <>
                    <button onClick={fixMetadata} className="btn btn-secondary btn-sm text-indigo-600">
                      <Wrench size={14} /> Fix Names
                    </button>
                    <button onClick={clearAllReports} className="btn btn-secondary btn-sm text-red-600">
                      <Trash2 size={14} /> Clear All
                    </button>
                  </>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={fetchReports} className="btn btn-ghost btn-sm">
                    <RefreshCw size={14} /> Refresh
                  </button>
                  {processed.length > 0 && (
                    <button onClick={handleBulkSendToFaculty} className="btn btn-secondary btn-sm text-teal-700">
                      <Users size={14} /> Send All to Faculty
                    </button>
                  )}
                  {reports.length > 0 && (
                      <button onClick={handleExportPDF} disabled={exportingPDF} className="btn btn-secondary btn-sm text-violet-700">
                        <FileText size={14} /> {exportingPDF ? "Generating..." : "Export PDF"}
                      </button>
                  )}
                  <button onClick={handleSendToVC} disabled={selected.length === 0} className="btn btn-success btn-sm">
                    <Send size={14} /> Send to VC {selected.length > 0 && `(${selected.length})`}
                  </button>
                </div>
              </div>

              <FeedbackTable
                reports={visibleReports}
                selected={selected} onSelect={setSelected}
                okReviewed={okReviewed} onInlineOk={handleInlineOk}
                onSendToFaculty={handleSendToFaculty} onHODApprove={handleHODApprove}
                onFieldEdit={handleFieldEdit} onDeleteReport={handleDeleteReport}
                submittedIds={submittedIds}
                hodUser={user} vcUser={vcUser}
              />
            </div>
          )}
        </>
      </main>

      <Footer />

      {/* Signature Modal */}
      {showSigModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-scale-in overflow-hidden">
            <div className="px-6 py-4 border-b bg-gradient-to-r from-indigo-50 to-violet-50">
              <h2 className="font-bold text-indigo-900 text-lg">Upload / Edit Signature</h2>
              <p className="text-xs text-indigo-600 mt-0.5">This will appear on all feedback reports</p>
            </div>
            <div className="p-6 space-y-4">
              <div
                onClick={() => sigRef.current.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${sigPreview ? "border-indigo-400 bg-indigo-50" : "border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50"}`}
              >
                {sigPreview ? (
                  <div>
                    <img src={sigPreview} alt="Signature preview" className="max-h-24 mx-auto object-contain mb-2" />
                    <p className="text-xs text-indigo-600 font-medium">Signature loaded — click to change</p>
                  </div>
                ) : user?.signatureImage ? (
                  <div>
                    <img src={user.signatureImage} alt="Current Signature" className="max-h-24 mx-auto object-contain mb-2" />
                    <p className="text-xs text-slate-500 font-medium">Current signature — click to replace</p>
                  </div>
                ) : (
                  <div>
                    <PenLine className="mx-auto text-slate-400 mb-2" size={32} />
                    <p className="text-sm font-medium text-slate-600">Click to upload signature image</p>
                    <p className="text-xs text-slate-400 mt-1">PNG or JPG · Max 2MB · White background recommended</p>
                  </div>
                )}
                <input ref={sigRef} type="file" accept="image/*" className="hidden" onChange={handleSigFile} />
              </div>
              <p className="text-xs text-slate-400 text-center">
                Your signature will appear on all feedback reports sent to VC
              </p>
            </div>
            <div className="px-6 py-4 border-t bg-slate-50 flex gap-3 justify-end">
              <button onClick={() => setShowSigModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSigSave} disabled={!sigPreview || sigSaving}
                className="btn btn-primary flex items-center gap-2 disabled:opacity-50">
                <PenLine size={14} />
                {sigSaving ? "Saving..." : "Save Signature"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Automated Batch PDF Upload Modal */}
      {showBatchModal && (
        <BatchPDFUploadModal
          user={user}
          token={token}
          onClose={() => setShowBatchModal(false)}
          onSuccess={() => {
            setShowBatchModal(false);
            fetchReports();
          }}
        />
      )}
    </div>
  );
}
