import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { getPdfUrl } from "../api";
import toast from "react-hot-toast";
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 11 }, (_, i) => {
  const y = CURRENT_YEAR - 5 + i;
  return `${y}-${y + 1}`;
});

export default function BatchPDFUploadModal({ user, token, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Session Info, 2: Upload Excel, 3: Processing, 4: Summary

  const [sessionInfo, setSessionInfo] = useState({
    department: user?.department || "",
    academicYear: YEARS[5],
    session: "jul-dec",
    feedbackFormNo: "I",
  });

  const [excelFile, setExcelFile] = useState(null);
  const [csvEntries, setCsvEntries] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);

  const [progress, setProgress] = useState(0);
  const [currentAction, setCurrentAction] = useState("");
  const [stats, setStats] = useState({ total: 0, successful: 0, failed: 0, matchedCount: 0 });
  const [processedResults, setProcessedResults] = useState([]);
  const [errorsList, setErrorsList] = useState([]);

  const fileInputRef = useRef(null);

  const api = axios.create({ headers: { Authorization: `Bearer ${token}` } });

  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape" && step !== 3) onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = orig; window.removeEventListener("keydown", onKey); };
  }, [onClose, step]);

  // Accept only .xlsx / .xls
  function isExcel(file) {
    return (
      file.name.toLowerCase().endsWith(".xlsx") ||
      file.name.toLowerCase().endsWith(".xls") ||
      file.type === "application/vnd.ms-excel" ||
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  }

  async function handleExcelFile(file) {
    if (!isExcel(file)) {
      toast.error("Please upload an Excel file (.xlsx or .xls)");
      return;
    }
    setExcelFile(file);
    setParsing(true);
    setCsvEntries([]);

    const fd = new FormData();
    fd.append("csv", file);

    try {
      const { data } = await api.post("/api/process/upload-csv", fd);
      console.log('[BatchModal] upload-csv response:', data);
      const links = (data.links || []).filter(e => e.pdfLink && e.pdfLink.startsWith('http'));
      if (links.length === 0 && data.links?.length > 0) {
        toast.error("Excel parsed but no valid http links found. Check your file.");
        setExcelFile(null); setCsvEntries([]); return;
      }
      setCsvEntries(links);
      toast.success(`${links.length} PDF links found in Excel`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to parse Excel file");
      setExcelFile(null);
      setCsvEntries([]);
    } finally {
      setParsing(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleExcelFile(file);
  }

  async function startProcessing() {
    if (!excelFile || csvEntries.length === 0) return toast.error("Please upload a valid Excel file first");

    setStep(3);
    setProgress(5);
    setCurrentAction("Starting PDF processing...");

    const totalLinks = csvEntries.length;
    setStats({ total: totalLinks, successful: 0, failed: 0, matchedCount: 0 });

    let completedCount = 0;
    let allResults = [];
    let allErrors = [];
    let matchedTotal = 0;

    for (let i = 0; i < totalLinks; i++) {
      const entry = csvEntries[i];
      if (!entry.pdfLink || !entry.pdfLink.startsWith('http')) {
        allErrors.push({ sno: i + 1, error: `Invalid link: "${entry.pdfLink}"` });
        completedCount++;
        continue;
      }
      setCurrentAction(`Analyzing PDF ${i + 1} of ${totalLinks}...`);

      try {
        const { data } = await api.post("/api/process/process-one", {
          pdfLink: entry.pdfLink,
          sno: i + 1,
          responseCount: entry.responseCount,
          department: sessionInfo.department,
          academicYear: sessionInfo.academicYear,
          session: sessionInfo.session,
          feedbackFormNo: sessionInfo.feedbackFormNo,
        });

        completedCount++;
        if (data.report) {
          allResults.push(data.report);
          if (data.report.matched) matchedTotal++;
        }
      } catch (err) {
        completedCount++;
        allErrors.push({
          sno: i + 1,
          error: err.response?.data?.error || "Failed to process PDF",
        });
      }

      setProgress(Math.round(((i + 1) / totalLinks) * 95));
      setStats({
        total: totalLinks,
        successful: allResults.length,
        failed: allErrors.length,
        matchedCount: matchedTotal,
      });
    }

    setProgress(100);
    setCurrentAction("Done!");
    setProcessedResults(allResults);
    setErrorsList(allErrors);
    setStep(4);
  }

  const modalJSX = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">

        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg">Upload Feedback Excel</h2>
              <p className="text-xs text-slate-500 mt-0.5">Upload your Excel sheet with PDF links · AI analyzes each report</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── STEP 1: Session Info ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4">
                <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2 mb-1">
                  <Sparkles size={16} className="text-indigo-600" />
                  Academic Session Details
                </h3>
                <p className="text-xs text-indigo-700/80">These details will be attached to every extracted faculty report.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Department Name</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="e.g. Computer Science & Engineering"
                    value={sessionInfo.department}
                    onChange={e => setSessionInfo(s => ({ ...s, department: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Academic Year</label>
                    <select className="input w-full" value={sessionInfo.academicYear}
                      onChange={e => setSessionInfo(s => ({ ...s, academicYear: e.target.value }))}>
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Session</label>
                    <select className="input w-full" value={sessionInfo.session}
                      onChange={e => setSessionInfo(s => ({ ...s, session: e.target.value }))}>
                      <option value="jul-dec">July – December</option>
                      <option value="jan-may">January – June</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Feedback Form No.</label>
                  <select className="input w-full" value={sessionInfo.feedbackFormNo}
                    onChange={e => setSessionInfo(s => ({ ...s, feedbackFormNo: e.target.value }))}>
                    <option value="I">Feedback Form – I</option>
                    <option value="II">Feedback Form – II</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Upload Excel ── */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Drop Zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                  dragOver ? "border-indigo-500 bg-indigo-50/80" : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50"
                }`}
              >
                <FileSpreadsheet size={40} className="mx-auto text-indigo-400 mb-3" />
                <p className="text-sm font-bold text-slate-700">Drag & drop your Excel file here</p>
                <p className="text-xs text-slate-400 mt-1">Supports .xlsx and .xls files</p>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition font-medium"
                >
                  <Upload size={15} /> Browse Excel File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={e => { if (e.target.files[0]) handleExcelFile(e.target.files[0]); }}
                />
              </div>

              {/* File status */}
              {parsing && (
                <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  Parsing Excel file...
                </div>
              )}

              {excelFile && !parsing && csvEntries.length > 0 && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">{excelFile.name}</p>
                    <p className="text-xs text-emerald-600">{csvEntries.length} PDF links found — ready to process</p>
                  </div>
                  <button onClick={() => { setExcelFile(null); setCsvEntries([]); }}
                    className="ml-auto text-xs text-rose-500 hover:text-rose-700 font-semibold">
                    Remove
                  </button>
                </div>
              )}

              {excelFile && !parsing && csvEntries.length === 0 && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <AlertCircle size={18} className="text-amber-600 shrink-0" />
                  <p className="text-sm text-amber-700">No PDF links found in this Excel file. Please check your file format.</p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Processing ── */}
          {step === 3 && (
            <div className="py-8 px-4 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center font-bold text-indigo-700 text-sm">
                  {progress}%
                </div>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Processing Feedback PDFs</h3>
                <p className="text-xs text-slate-500 mt-1">{currentAction}</p>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden max-w-md mx-auto">
                <div className="bg-gradient-to-r from-indigo-500 to-violet-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                <div className="bg-slate-50 border rounded-xl p-3">
                  <div className="text-xs text-slate-400">Total</div>
                  <div className="text-lg font-bold text-slate-700">{stats.total}</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <div className="text-xs text-emerald-600">Done</div>
                  <div className="text-lg font-bold text-emerald-700">{stats.successful}</div>
                </div>
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3">
                  <div className="text-xs text-rose-500">Failed</div>
                  <div className="text-lg font-bold text-rose-600">{stats.failed}</div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4: Summary ── */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
                <CheckCircle2 size={32} className="mx-auto text-emerald-600 mb-2" />
                <h3 className="font-bold text-emerald-900 text-base">Processing Complete!</h3>
                <p className="text-xs text-emerald-700 mt-1">
                  {stats.successful} of {stats.total} reports analyzed successfully.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border rounded-xl p-3 text-center">
                  <div className="text-xs text-slate-400">Successful</div>
                  <div className="text-xl font-bold text-emerald-600">{stats.successful}</div>
                </div>
                <div className="bg-white border rounded-xl p-3 text-center">
                  <div className="text-xs text-slate-400">Matched Faculty</div>
                  <div className="text-xl font-bold text-indigo-600">{stats.matchedCount}</div>
                </div>
                <div className="bg-white border rounded-xl p-3 text-center">
                  <div className="text-xs text-slate-400">Errors</div>
                  <div className={`text-xl font-bold ${stats.failed > 0 ? "text-rose-600" : "text-slate-400"}`}>{stats.failed}</div>
                </div>
              </div>

              {processedResults.length > 0 && (
                <div className="border rounded-2xl overflow-hidden max-h-52 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b text-slate-500 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">Faculty Name</th>
                        <th className="px-3 py-2 text-left">Subject</th>
                        <th className="px-3 py-2 text-center">Match</th>
                        <th className="px-3 py-2 text-right">PDF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {processedResults.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-medium text-slate-800 truncate max-w-[130px]">{r.facultyName}</td>
                          <td className="px-3 py-2 text-slate-500">{r.subjectCode || "—"}</td>
                          <td className="px-3 py-2 text-center">
                            {r.matched
                              ? <span className="text-emerald-600 font-semibold">✓</span>
                              : <span className="text-amber-500">—</span>}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <a href={getPdfUrl(r)} target="_blank" rel="noopener noreferrer"
                              className="text-indigo-600 hover:underline inline-flex items-center gap-0.5">
                              View <ExternalLink size={10} />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {errorsList.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-rose-700 mb-2">{errorsList.length} error(s):</p>
                  <ul className="space-y-1">
                    {errorsList.map((e, i) => (
                      <li key={i} className="text-xs text-rose-600">Link #{e.sno}: {e.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-slate-50/80 flex items-center justify-between">
          {step === 1 && (
            <>
              <button onClick={onClose} className="btn btn-secondary">Cancel</button>
              <button
                onClick={() => {
                  if (!sessionInfo.department.trim()) return toast.error("Please enter department name");
                  setStep(2);
                }}
                className="btn btn-primary flex items-center gap-1.5"
              >
                Next <ChevronRight size={15} />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button onClick={() => setStep(1)} className="btn btn-secondary">Back</button>
              <button
                onClick={startProcessing}
                disabled={!excelFile || csvEntries.length === 0 || parsing}
                className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles size={15} />
                Start AI Analysis ({csvEntries.length} PDFs)
              </button>
            </>
          )}

          {step === 3 && (
            <p className="w-full text-center text-xs text-slate-400">Please keep this tab open while processing...</p>
          )}

          {step === 4 && (
            <button
              onClick={() => { onSuccess?.(); onClose(); }}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} /> View Reports on Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalJSX, document.body) : modalJSX;
}
