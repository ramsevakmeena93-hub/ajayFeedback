import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SignatureUpload from '../components/SignatureUpload';


import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { CheckCircle, XCircle, Eye, TrendingUp, Users, FileText, AlertTriangle, Search, ChevronRight } from "lucide-react";

const STATUS_CFG = {
  submitted: { bg:"bg-amber-50",   text:"text-amber-700",   border:"border-amber-200",  dot:"bg-amber-400",   label:"Pending Review" },
  approved:  { bg:"bg-teal-50",    text:"text-teal-700",    border:"border-teal-200",   dot:"bg-teal-500",    label:"Approved"       },
  rejected:  { bg:"bg-rose-50",    text:"text-rose-700",    border:"border-rose-200",   dot:"bg-rose-500",    label:"Rejected"       },
  reviewed:  { bg:"bg-slate-50",   text:"text-slate-600",   border:"border-slate-200",  dot:"bg-slate-400",   label:"Reviewed"       },
};

export default function VCDashboard() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectComment, setRejectComment] = useState("");
  const [activeTab, setActiveTab] = useState("submissions"); // "submissions" | "analysis"
  const [showSignatureModal, setShowSignatureModal] = useState(false);
const [pendingApproveId, setPendingApproveId] = useState(null);

  const api = axios.create({ headers: { Authorization: `Bearer ${token}` } });

  async function handleApprove(id) {
    try {
      await api.patch(`/api/submissions/${id}/status`, { status: "approved", vcComment: "" });
      toast.success("Approved successfully");
      fetchSubmissions();
    } catch (err) {
      if (err.response?.data?.needSignature) {
        setPendingApproveId(id);
        setShowSignatureModal(true);
      } else {
        toast.error("Failed to approve");
      }
    }
  }


  useEffect(() => { fetchSubmissions(); }, []);

  async function fetchSubmissions() {
    setLoading(true);
    try { const { data } = await api.get("/api/submissions/all"); setSubmissions(data); }
    catch (err) { if (err.response?.status === 401) { logout(); return; } toast.error("Failed to load"); }
    finally { setLoading(false); }
  }

  const handleSignatureSaved = async (preview) => {
    // Close modal and retry the pending approval
    setShowSignatureModal(false);
    if (pendingApproveId) {
      await handleApprove(pendingApproveId);
      setPendingApproveId(null);
    }
  };

  async function handleRejectConfirm() {
    if (!rejectModal) return;
    try {
      await api.patch(`/api/submissions/${rejectModal}/status`, { status:"rejected", vcComment:rejectComment });
      toast.success("Submission rejected"); setRejectModal(null); setRejectComment(""); fetchSubmissions();
    } catch { toast.error("Failed to reject"); }
  }

  const filtered = submissions.filter(sub => {
    const ms = !search || (sub.hodId?.name||"").toLowerCase().includes(search.toLowerCase()) || (sub.hodId?.department||"").toLowerCase().includes(search.toLowerCase());
    const mf = !filterStatus || sub.status === filterStatus;
    return ms && mf;
  });

  const totalReports  = submissions.reduce((s,sub) => s + (sub.reports?.length||0), 0);
  const allFFIs       = submissions.flatMap(sub => (sub.reports||[]).map(r=>r.ffiScore).filter(Boolean));
  const avgFFI        = allFFIs.length ? (allFFIs.reduce((s,v)=>s+v,0)/allFFIs.length).toFixed(2) : "—";
  const pendingCount  = submissions.filter(s=>s.status==="submitted").length;
  const approvedCount = submissions.filter(s=>s.status==="approved").length;

  const STATS = [
    { label:"Total Submissions", value:submissions.length, icon:FileText,      accent:"#1e3a5f" },
    { label:"Total Reports",     value:totalReports,       icon:Users,         accent:"#0f766e" },
    { label:"Avg FFI Score",     value:avgFFI,             icon:TrendingUp,    accent:"#92400e" },
    { label:"Pending Review",    value:pendingCount,       icon:AlertTriangle, accent:"#9f1239" },
  ];

  // ── Analysis data ──────────────────────────────────────────
  // Department-wise analysis
  const deptAnalysis = {};
  submissions.forEach(sub => {
    const dept = sub.hodId?.department || sub.department || "Unknown";
    if (!deptAnalysis[dept]) deptAnalysis[dept] = { reports:[], ffis:[], attention:0, appreciation:0 };
    (sub.reports||[]).forEach(r => {
      deptAnalysis[dept].reports.push(r);
      if (r.ffiScore) deptAnalysis[dept].ffis.push(r.ffiScore);
      deptAnalysis[dept].attention   += r.attentionCount   || 0;
      deptAnalysis[dept].appreciation += r.appreciationCount || 0;
    });
  });

  // Faculty-wise analysis across all submissions
  const facultyAnalysis = {};
  submissions.forEach(sub => {
    (sub.reports||[]).forEach(r => {
      const key = r.facultyName || "Unknown";
      if (!facultyAnalysis[key]) facultyAnalysis[key] = { reports:[], ffis:[], dept: sub.hodId?.department || sub.department || "—" };
      facultyAnalysis[key].reports.push(r);
      if (r.ffiScore) facultyAnalysis[key].ffis.push(r.ffiScore);
    });
  });

  // Subject-wise analysis
  const subjectAnalysis = {};
  submissions.forEach(sub => {
    (sub.reports||[]).forEach(r => {
      const key = r.subjectCode || "Unknown";
      if (!subjectAnalysis[key]) subjectAnalysis[key] = { name:r.facultyName||"—", programme:r.programme||"—", ffis:[], count:0 };
      subjectAnalysis[key].count++;
      if (r.ffiScore) subjectAnalysis[key].ffis.push(r.ffiScore);
    });
  });

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <Navbar title="VC Dashboard" subtitle="MITS Gwalior" />

      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 py-8 space-y-7">

        {/* Top banner */}
        <div className="rounded-2xl overflow-hidden shadow-md" style={{background:"linear-gradient(120deg,#1e3a5f 0%,#1e4d8c 60%,#1a3a6e 100%)"}}>
          <div className="px-8 py-7 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-blue-200 text-sm font-medium">Pro Vice-Chancellor Portal</p>
              <h1 className="text-white text-2xl font-bold mt-0.5">Welcome, {user?.name || "Pro Vice-Chancellor"}</h1>
              <p className="text-blue-300 text-xs mt-1">MITS Gwalior · Madhav Institute of Technology & Science · 2025–26</p>
            </div>
            <div className="flex gap-3">
              <div className="bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-center">
                <p className="text-white text-xl font-black">{approvedCount}</p>
                <p className="text-blue-200 text-xs mt-0.5">Approved</p>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-center">
                <p className="text-amber-300 text-xl font-black">{pendingCount}</p>
                <p className="text-blue-200 text-xs mt-0.5">Pending</p>
              </div>
            </div>
          </div>
          {/* Gold accent bar */}
          <div className="h-1" style={{background:"linear-gradient(90deg,#d4a017,#f0c040,#d4a017)"}}></div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(({ label, value, icon:Icon, accent }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:`${accent}18`}}>
                  <Icon size={18} style={{color:accent}} />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-800">{value}</p>
              <p className="text-slate-500 text-xs font-medium mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          {[
            { id:"submissions", label:"Submissions" },
            { id:"analysis",    label:"📊 Analysis" },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab===t.id?"bg-white shadow text-slate-800":"text-slate-500 hover:text-slate-700"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── ANALYSIS TAB ── */}
        {activeTab === "analysis" && (
          <div className="space-y-6 animate-fade-in">

            {/* Department-wise */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                <h2 className="font-bold text-slate-800 text-base">Department-wise Analysis</h2>
                <p className="text-xs text-slate-400 mt-0.5">{Object.keys(deptAnalysis).length} departments</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="table-header">
                    <tr>
                      {["Department","Reports","Avg FFI","Appreciation","Needs Attention","Performance"].map(h=>(
                        <th key={h} className="px-4 py-3 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(deptAnalysis).sort((a,b)=>{
                      const aAvg=a[1].ffis.length?a[1].ffis.reduce((s,v)=>s+v,0)/a[1].ffis.length:0;
                      const bAvg=b[1].ffis.length?b[1].ffis.reduce((s,v)=>s+v,0)/b[1].ffis.length:0;
                      return bAvg-aAvg;
                    }).map(([dept,d])=>{
                      const avg=d.ffis.length?(d.ffis.reduce((s,v)=>s+v,0)/d.ffis.length).toFixed(2):null;
                      const ffiColor=avg?(parseFloat(avg)>=4?"text-emerald-600":parseFloat(avg)>=3?"text-amber-600":"text-red-600"):"text-slate-400";
                      return (
                        <tr key={dept} className="table-row">
                          <td className="px-4 py-3 font-semibold text-slate-800 max-w-[200px] truncate">{dept}</td>
                          <td className="px-4 py-3 text-slate-600">{d.reports.length}</td>
                          <td className={`px-4 py-3 font-bold ${ffiColor}`}>{avg||"—"}</td>
                          <td className="px-4 py-3 text-emerald-600 font-semibold">{d.appreciation}</td>
                          <td className="px-4 py-3 text-amber-600 font-semibold">{d.attention}</td>
                          <td className="px-4 py-3">
                            {avg && (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-100 rounded-full h-2 max-w-[80px]">
                                  <div className={`h-2 rounded-full ${parseFloat(avg)>=4?"bg-emerald-500":parseFloat(avg)>=3?"bg-amber-500":"bg-red-500"}`}
                                    style={{width:`${Math.min((parseFloat(avg)/5)*100,100)}%`}}/>
                                </div>
                                <span className={`text-xs font-bold ${ffiColor}`}>{avg}</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Faculty-wise */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                <h2 className="font-bold text-slate-800 text-base">Faculty-wise Analysis</h2>
                <p className="text-xs text-slate-400 mt-0.5">{Object.keys(facultyAnalysis).length} faculty members</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="table-header">
                    <tr>
                      {["Faculty Name","Department","Subjects","Avg FFI","Performance"].map(h=>(
                        <th key={h} className="px-4 py-3 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(facultyAnalysis).sort((a,b)=>{
                      const aAvg=a[1].ffis.length?a[1].ffis.reduce((s,v)=>s+v,0)/a[1].ffis.length:0;
                      const bAvg=b[1].ffis.length?b[1].ffis.reduce((s,v)=>s+v,0)/b[1].ffis.length:0;
                      return bAvg-aAvg;
                    }).map(([name,f])=>{
                      const avg=f.ffis.length?(f.ffis.reduce((s,v)=>s+v,0)/f.ffis.length).toFixed(2):null;
                      const ffiColor=avg?(parseFloat(avg)>=4?"text-emerald-600":parseFloat(avg)>=3?"text-amber-600":"text-red-600"):"text-slate-400";
                      return (
                        <tr key={name} className="table-row">
                          <td className="px-4 py-3 font-semibold text-slate-800">{name}</td>
                          <td className="px-4 py-3 text-xs text-slate-500 max-w-[180px] truncate">{f.dept}</td>
                          <td className="px-4 py-3 text-slate-600">{f.reports.length}</td>
                          <td className={`px-4 py-3 font-bold ${ffiColor}`}>{avg||"—"}</td>
                          <td className="px-4 py-3">
                            {avg && (
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${parseFloat(avg)>=4?"bg-emerald-100 text-emerald-700":parseFloat(avg)>=3?"bg-amber-100 text-amber-700":"bg-red-100 text-red-700"}`}>
                                {parseFloat(avg)>=4?"Excellent":parseFloat(avg)>=3?"Good":"Needs Improvement"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Subject-wise */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                <h2 className="font-bold text-slate-800 text-base">Subject-wise Analysis</h2>
                <p className="text-xs text-slate-400 mt-0.5">{Object.keys(subjectAnalysis).length} subjects</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="table-header">
                    <tr>
                      {["Subject Code","Faculty","Programme","Sections","Avg FFI"].map(h=>(
                        <th key={h} className="px-4 py-3 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(subjectAnalysis).sort((a,b)=>{
                      const aAvg=a[1].ffis.length?a[1].ffis.reduce((s,v)=>s+v,0)/a[1].ffis.length:0;
                      const bAvg=b[1].ffis.length?b[1].ffis.reduce((s,v)=>s+v,0)/b[1].ffis.length:0;
                      return bAvg-aAvg;
                    }).map(([code,s])=>{
                      const avg=s.ffis.length?(s.ffis.reduce((sv,v)=>sv+v,0)/s.ffis.length).toFixed(2):null;
                      const ffiColor=avg?(parseFloat(avg)>=4?"text-emerald-600":parseFloat(avg)>=3?"text-amber-600":"text-red-600"):"text-slate-400";
                      return (
                        <tr key={code} className="table-row">
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-700">{code}</td>
                          <td className="px-4 py-3 text-slate-700">{s.name}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{s.programme}</td>
                          <td className="px-4 py-3 text-slate-600">{s.count}</td>
                          <td className={`px-4 py-3 font-bold ${ffiColor}`}>{avg||"—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── SUBMISSIONS TAB ── */}
        {activeTab === "submissions" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
            <div>
              <h2 className="font-bold text-slate-800 text-base">HOD Submissions</h2>
              <p className="text-xs text-slate-400 mt-0.5">{filtered.length} record{filtered.length!==1?"s":""}</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search HOD or dept..."
                  className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 w-48"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 w-36">
                <option value="">All Status</option>
                <option value="submitted">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              {(search||filterStatus) && (
                <button onClick={()=>{setSearch("");setFilterStatus("");}} className="text-xs text-red-400 hover:text-red-600 font-medium">Clear</button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-20 text-center">
              <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400 text-sm">Loading submissions...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText size={28} className="text-slate-300" />
              </div>
              <p className="text-slate-500 font-semibold">{submissions.length===0?"No submissions yet":"No results found"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/40">
                    {["HOD","Department","Reports","Avg FFI","Submitted","Status","VC Comment","Actions"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(sub => {
                    const ffis = (sub.reports||[]).map(r=>r.ffiScore).filter(Boolean);
                    const avg  = ffis.length ? (ffis.reduce((s,v)=>s+v,0)/ffis.length).toFixed(2) : "—";
                    const avgN = parseFloat(avg);
                    const sc   = STATUS_CFG[sub.status] || STATUS_CFG.submitted;
                    const hodName = sub.hodId?.name || "—";
                    const initials = hodName.split(" ").map(w=>w[0]||"").join("").toUpperCase().slice(0,2) || "H";
                    return (
                      <tr key={sub._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                              style={{background:"linear-gradient(135deg,#1e3a5f,#2563eb)"}}>
                              {initials}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 text-sm leading-tight">{hodName}</p>
                              <p className="text-xs text-slate-400">{sub.hodId?.email||""}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-600 text-xs">{sub.hodId?.department||sub.department||"—"}</td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">
                            {sub.reports?.length||0}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          {avg !== "—" ? (
                            <span className={`text-sm font-bold ${avgN>=4?"text-teal-600":avgN>=3?"text-amber-600":"text-rose-600"}`}>{avg}</span>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">
                          {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—"}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.bg} ${sc.text} ${sc.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></span>
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500 max-w-[130px]">
                          {sub.vcComment ? <span className="italic">"{sub.vcComment}"</span> : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            <button onClick={() => navigate(`/vc/submission/${sub._id}`)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors">
                              <Eye size={11}/> View
                            </button>
                            {sub.status==="submitted" && <>
                              <button onClick={() => handleApprove(sub._id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors">
                                <CheckCircle size={11}/> Approve
                              </button>
                              <button onClick={() => { setRejectModal(sub._id); setRejectComment(""); }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg transition-colors">
                                <XCircle size={11}/> Reject
                              </button>
                            </>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )} {/* end submissions tab */}
      </main>

      <Footer />

      {showSignatureModal && (
        <SignatureUpload token={token} onSaved={handleSignatureSaved} onSkip={() => setShowSignatureModal(false)} />
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7 space-y-5 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-100">
                <XCircle size={20} className="text-rose-500"/>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Reject Submission</h2>
                <p className="text-xs text-slate-400">Provide a reason (optional)</p>
              </div>
            </div>
            <textarea rows={3}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300"
              placeholder="Enter rejection reason..."
              value={rejectComment} onChange={e => setRejectComment(e.target.value)} />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRejectModal(null)}
                className="px-5 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleRejectConfirm}
                className="px-5 py-2 text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors flex items-center gap-2">
                <XCircle size={14}/> Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
