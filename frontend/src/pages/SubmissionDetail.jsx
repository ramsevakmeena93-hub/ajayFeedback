import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getPdfUrl } from "../api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ArrowLeft, CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";

export default function SubmissionDetail() {
  const { id }    = useParams();
  const { token } = useAuth();
  const navigate  = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    axios.get(`/api/reports/submission/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        // Deduplicate reports by _id
        if (data.reports) {
          const seen = new Set();
          data.reports = data.reports.filter(r => {
            const key = r._id?.toString();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        }
        setSubmission(data);
      })
      .catch(() => toast.error("Failed to load submission"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );
  if (!submission) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-500">Submission not found</p>
    </div>
  );

  const reports = submission.reports || [];

  // Deduplicate again just in case
  const seen = new Set();
  const uniqueReports = reports.filter(r => {
    const k = r._id?.toString();
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });

  const ffis    = uniqueReports.map(r => r.ffiScore).filter(Boolean);
  const avgFFI  = ffis.length ? (ffis.reduce((s,v)=>s+v,0)/ffis.length).toFixed(2) : "—";

  const chartData = uniqueReports.map(r => ({
    name: (r.facultyName||"Faculty").split(" ").slice(-1)[0],
    FFI:  r.ffiScore || 0,
  }));

  const api = axios.create({ headers: { Authorization: `Bearer ${token}` } });

  async function handleApprove() {
    try {
      await api.patch(`/api/submissions/${id}/status`, { status: "approved", vcComment: "" });
      toast.success("Submission approved successfully");
      setSubmission(s => ({ ...s, status: "approved" }));
    } catch {
      toast.error("Failed to approve submission");
    }
  }

  async function handleReject() {
    const reason = prompt("Enter rejection reason (optional):");
    try {
      await api.patch(`/api/submissions/${id}/status`, { status: "rejected", vcComment: reason || "" });
      toast.success("Submission rejected");
      setSubmission(s => ({ ...s, status: "rejected", vcComment: reason || "" }));
    } catch {
      toast.error("Failed to reject submission");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar title="Submission Detail" subtitle="VC Review" />

      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Back & Actions Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium">
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          {submission.status !== "approved" && submission.status !== "rejected" && (
            <div className="flex items-center gap-2">
              <button onClick={handleApprove}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow transition">
                <CheckCircle size={14}/> Approve Submission
              </button>
              <button onClick={handleReject}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl shadow transition">
                <XCircle size={14}/> Reject Submission
              </button>
            </div>
          )}
        </div>

        {/* Submission info card */}
        <div className="card p-5">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">HOD</p>
              <p className="font-semibold text-slate-800">{submission.hodId?.name || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Department</p>
              <p className="font-semibold text-slate-800">{submission.hodId?.department || submission.department || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Academic Year</p>
              <p className="font-semibold text-slate-800">{submission.academicYear || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Semester</p>
              <p className="font-semibold text-slate-800">{submission.semester ? `Sem ${submission.semester}` : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Status</p>
              <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                submission.status==="approved" ? "bg-emerald-100 text-emerald-700" :
                submission.status==="rejected" ? "bg-red-100 text-red-700" :
                "bg-indigo-100 text-indigo-700"}`}>
                {submission.status}
              </span>
            </div>
          </div>
          {submission.vcComment && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-800">
              <span className="font-semibold">VC Comment:</span> {submission.vcComment}
            </div>
          )}
        </div>

        {/* FFI Chart */}
        {chartData.length > 0 && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="section-title">FFI Score by Faculty</p>
              <span className="text-sm font-bold text-slate-700">
                Avg: <span className={parseFloat(avgFFI)>=4?"text-emerald-600":parseFloat(avgFFI)>=3?"text-amber-600":"text-red-600"}>{avgFFI}</span>
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{top:0,right:0,left:-20,bottom:0}}>
                <XAxis dataKey="name" tick={{fontSize:11}} />
                <YAxis domain={[0,5]} tick={{fontSize:11}} />
                <Tooltip formatter={v=>[v,"FFI Score"]} />
                <Bar dataKey="FFI" radius={[4,4,0,0]}>
                  {chartData.map((e,i)=>(
                    <Cell key={i} fill={e.FFI>=4?"#059669":e.FFI>=3?"#d97706":"#dc2626"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Reports table — same format as Faculty dashboard */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b bg-slate-50 flex items-center justify-between">
            <p className="section-title">Faculty Reports</p>
            <span className="text-xs text-slate-400">{uniqueReports.length} report{uniqueReports.length!==1?"s":""}</span>
          </div>

          {uniqueReports.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-slate-400">No reports in this submission</p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="table-header">
                  <tr>
                    <th className="px-4 py-3 text-left">S.No</th>
                    <th className="px-4 py-3 text-left">Faculty Name</th>
                    <th className="px-4 py-3 text-left">Subject Code</th>
                    <th className="px-4 py-3 text-left">Programme</th>
                    <th className="px-4 py-3 text-center">Sem</th>
                    <th className="px-4 py-3 text-center">Year</th>
                    <th className="px-4 py-3 text-center">FFI</th>
                    <th className="px-4 py-3 text-center">Resp.</th>
                    <th className="px-4 py-3 text-left">Appreciation</th>
                    <th className="px-4 py-3 text-left">Needs Attention</th>
                    <th className="px-4 py-3 text-left">HOD Remarks</th>
                    <th className="px-4 py-3 text-left">Action Taken</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {uniqueReports.map((r, idx) => {
                    const pcts    = r.commentPercentages || {};
                    const pctList = Object.entries(pcts).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
                    const longApp = (r.appreciation||[]).filter(c=>c.trim().split(/\s+/).length>4);
                    const attList = (r.commentsNeedingAttention||[]);
                    return (
                      <tr key={r._id} className="hover:bg-slate-50 align-top transition-colors">
                        <td className="px-4 py-3 text-slate-400 text-xs">{idx+1}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                          {r.facultyName||"—"}
                          {r._id && (
                            <a href={getPdfUrl(r)} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-0.5">
                              <ExternalLink size={10}/> View PDF
                            </a>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-600 whitespace-nowrap">{r.subjectCode||"—"}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{r.programme||"—"}</td>
                        <td className="px-4 py-3 text-center text-xs">{r.semester||"—"}</td>
                        <td className="px-4 py-3 text-center text-xs">{r.academicYear||"—"}</td>
                        <td className="px-4 py-3 text-center">
                          {r.ffiScore!=null
                            ? <span className={`text-sm font-bold ${r.ffiScore>=4?"text-emerald-600":r.ffiScore>=3?"text-amber-600":"text-red-600"}`}>{r.ffiScore.toFixed(2)}</span>
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs font-semibold text-slate-600">{r.responseCount ?? r.totalResponses ?? "—"}</span>
                        </td>
                        {/* Appreciation — percentages + long comments */}
                        <td className="px-4 py-3 max-w-[160px]">
                          <div className="space-y-0.5">
                            {pctList.map(([label,pct])=>(
                              <span key={label} className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-2 py-0.5 inline-block mr-1 mb-0.5">{label} {pct}%</span>
                            ))}
                            {longApp.slice(0,1).map((c,i)=>(
                              <div key={i} className="text-xs text-emerald-800 leading-snug mt-0.5">{c}</div>
                            ))}
                            {pctList.length===0&&longApp.length===0&&<span className="text-slate-300 text-xs">None</span>}
                          </div>
                        </td>
                        {/* Needs Attention — actual text */}
                        <td className="px-4 py-3 max-w-[200px]">
                          {attList.length>0
                            ? <div className="space-y-1">{attList.slice(0,2).map((c,i)=>(
                                <div key={i} className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-2 py-1 leading-snug">{c}</div>
                              ))}</div>
                            : <span className="text-slate-300 text-xs">None</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 max-w-[130px]">{r.hodRemarks||<span className="text-slate-300">—</span>}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 max-w-[130px]">{r.actionTaken||<span className="text-slate-300">—</span>}</td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {r.status==="faculty_approved"
                            ? <span className="badge-emerald flex items-center gap-1 justify-center"><CheckCircle size={10}/>Approved</span>
                            : r.status==="sent_to_faculty"
                            ? <span className="badge-indigo flex items-center gap-1 justify-center"><Clock size={10}/>Sent</span>
                            : <span className="badge-slate">{r.status||"—"}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
      <Footer />
    </div>
  );
}
