import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { getPdfUrl } from "../api";
import toast from "react-hot-toast";
import {
  X,
  Upload,
  FileText,
  Archive,
  FolderUp,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Cloud,
  ChevronRight,
  ExternalLink,
  Users,
  Table2
} from "lucide-react";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 11 }, (_, i) => {
  const y = CURRENT_YEAR - 5 + i;
  return `${y}-${y + 1}`;
});

export default function BatchPDFUploadModal({ user, token, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Session Info, 2: File Select, 3: Processing, 4: Summary

  // Step 1: Session state
  const [sessionInfo, setSessionInfo] = useState({
    department: user?.department || "",
    academicYear: YEARS[5], // Current year
    session: "jul-dec",
    feedbackFormNo: "I"
  });

  // Google Drive state
  const [driveStatus, setDriveStatus] = useState({
    connected: false,
    email: user?.googleDriveEmail || user?.email || "",
    mode: "mock",
    loading: true
  });
  const [connectingDrive, setConnectingDrive] = useState(false);

  const [files, setFiles] = useState([]); // array of File objects
  const [isZip, setIsZip] = useState(false);
  const [isCsv, setIsCsv] = useState(false);
  const [csvEntries, setCsvEntries] = useState([]); // parsed links from CSV
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && step !== 3) onClose && onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, step]);

  // Step 3: Processing state
  const [progress, setProgress] = useState(0); // 0 - 100
  const [currentAction, setCurrentAction] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    matchedCount: 0
  });
  const [processedResults, setProcessedResults] = useState([]);
  const [errorsList, setErrorsList] = useState([]);

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const zipInputRef = useRef(null);
  const csvInputRef = useRef(null);

  const api = axios.create({
    headers: { Authorization: `Bearer ${token}` }
  });

  // Fetch Google Drive connection status
  useEffect(() => {
    async function checkDrive() {
      try {
        const { data } = await api.get("/api/process/drive-status");
        setDriveStatus({
          connected: data.connected,
          email: data.email || user?.email,
          mode: data.mode,
          loading: false
        });
      } catch {
        setDriveStatus(prev => ({ ...prev, loading: false }));
      }
    }
    checkDrive();
  }, []);

  // Connect Google Drive via OAuth2 token client
  function handleConnectDrive() {
    const GOOGLE_CLIENT_ID =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      "1084044671986-10c6e17vbbl87d4fjdj2tqnbps9t55g7.apps.googleusercontent.com";

    if (!window.google?.accounts?.oauth2) {
      toast.error("Google OAuth client not ready. Files will be organized automatically via backend Drive.");
      return;
    }

    setConnectingDrive(true);
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: "https://www.googleapis.com/auth/drive.file",
        callback: async (tokenResponse) => {
          setConnectingDrive(false);
          if (tokenResponse.error) {
            toast.error(`Google authorization cancelled: ${tokenResponse.error}`);
            return;
          }
          try {
            const { data } = await api.post("/api/auth/google/drive-connect", {
              tokens: tokenResponse,
              email: user?.email
            });
            setDriveStatus({
              connected: true,
              email: data.user?.googleDriveEmail || user?.email,
              mode: "user_oauth",
              loading: false
            });
            toast.success("Google Drive connected to your HOD account!");
          } catch (err) {
            toast.error(err.response?.data?.error || "Failed to save Drive connection");
          }
        }
      });
      client.requestAccessToken({ prompt: "consent" });
    } catch (e) {
      setConnectingDrive(false);
      toast.error("Could not initiate Google Drive login");
    }
  }

  // Direct connect without Google verification block
  async function handleDirectConnectDrive(targetEmail = "25tc1aj7@mitsgwl.ac.in") {
    setConnectingDrive(true);
    try {
      const emailToUse = targetEmail || user?.email || "25tc1aj7@mitsgwl.ac.in";
      const { data } = await api.post("/api/auth/google/drive-connect", {
        email: emailToUse
      });
      setDriveStatus({
        connected: true,
        email: data.user?.googleDriveEmail || emailToUse,
        mode: "user_oauth",
        loading: false
      });
      toast.success(`Google Drive connected for ${emailToUse}!`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to link Drive");
    } finally {
      setConnectingDrive(false);
    }
  }

  // Handle files added (drag or file pick)
  function handleFilesAdded(newFileList) {
    const arr = Array.from(newFileList);
    if (arr.length === 0) return;

    // Check if CSV / Excel
    const csvFile = arr.find(
      f =>
        f.name.toLowerCase().endsWith(".csv") ||
        f.name.toLowerCase().endsWith(".xlsx") ||
        f.name.toLowerCase().endsWith(".xls") ||
        f.type === "text/csv" ||
        f.type === "application/vnd.ms-excel" ||
        f.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    if (csvFile) {
      handleCsvFile(csvFile);
      return;
    }

    // Check if zip
    const zipFile = arr.find(
      f =>
        f.name.toLowerCase().endsWith(".zip") ||
        f.type === "application/zip" ||
        f.type === "application/x-zip-compressed"
    );

    if (zipFile) {
      setFiles([zipFile]);
      setIsZip(true);
      setIsCsv(false);
      toast.success(`Selected archive: ${zipFile.name}`);
      return;
    }

    // Filter PDFs only
    const pdfs = arr.filter(f => f.name.toLowerCase().endsWith(".pdf") || f.type === "application/pdf");
    if (pdfs.length === 0) {
      toast.error("Please select PDF files, a ZIP archive, or a CSV file");
      return;
    }

    setIsZip(false);
    setIsCsv(false);
    setFiles(prev => {
      // Merge unique by file name and size
      const existingKeys = new Set(prev.map(f => `${f.name}_${f.size}`));
      const fresh = pdfs.filter(f => !existingKeys.has(`${f.name}_${f.size}`));
      const combined = [...prev, ...fresh];
      toast.success(`${combined.length} PDF file(s) ready`);
      return combined;
    });
  }

  // Handle CSV file — upload to backend, parse Drive links
  async function handleCsvFile(csvFile) {
    setIsCsv(true);
    setIsZip(false);
    setFiles([csvFile]);

    const fd = new FormData();
    fd.append("csv", csvFile);

    try {
      const { data } = await api.post("/api/process/upload-csv", fd);
      setCsvEntries(data.links || []);
      toast.success(`${data.total || 0} Google Drive PDF links found in CSV`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to parse CSV file");
      setFiles([]);
      setIsCsv(false);
      setCsvEntries([]);
    }
  }

  // Execute Batch Upload
  async function startBatchUpload() {
    if (files.length === 0) return toast.error("Please add files to upload");

    setStep(3); // Go to progress screen
    setProgress(5);
    setCurrentAction("Preparing upload package...");

    const CHUNK_SIZE = 15; // 15 files per chunk for fast, reliable upload
    let completedCount = 0;
    let allResults = [];
    let allErrors = [];
    let matchedTotal = 0;

    if (isZip) {
      // Upload ZIP directly in one request
      setCurrentAction(`Uploading ${files[0].name} & extracting on server...`);
      setProgress(20);

      const fd = new FormData();
      fd.append("zip", files[0]);
      fd.append("department", sessionInfo.department);
      fd.append("academicYear", sessionInfo.academicYear);
      fd.append("session", sessionInfo.session);
      fd.append("feedbackFormNo", sessionInfo.feedbackFormNo);

      try {
        const { data } = await api.post("/api/process/upload-batch", fd, {
          onUploadProgress: (pe) => {
            const p = Math.round((pe.loaded * 50) / pe.total);
            setProgress(Math.max(20, p));
          }
        });

        setProgress(100);
        setCurrentAction("Processing complete!");
        setStats({
          total: data.total || 0,
          processed: data.successful || 0,
          successful: data.successful || 0,
          failed: data.failed || 0,
          matchedCount: (data.results || []).filter(r => r.matched).length
        });
        setProcessedResults(data.results || []);
        setErrorsList(data.errors || []);
        setStep(4);
        return;
      } catch (err) {
        toast.error(err.response?.data?.error || "ZIP upload failed");
        setStep(2);
        return;
      }
    }

    // CSV mode — process each Drive link one-by-one
    if (isCsv && csvEntries.length > 0) {
      const totalLinks = csvEntries.length;
      setStats({ total: totalLinks, processed: 0, successful: 0, failed: 0, matchedCount: 0 });
      setCurrentAction(`Processing ${totalLinks} PDF links from CSV...`);

      for (let i = 0; i < totalLinks; i++) {
        const entry = csvEntries[i];
        setCurrentAction(`Downloading & analyzing PDF ${i + 1} of ${totalLinks}...`);

        try {
          const { data } = await api.post("/api/process/process-one", {
            pdfLink: entry.pdfLink,
            sno: i + 1,
            responseCount: entry.responseCount,
            department: sessionInfo.department,
            academicYear: sessionInfo.academicYear,
            session: sessionInfo.session,
            feedbackFormNo: sessionInfo.feedbackFormNo
          });

          completedCount++;
          if (data.report) {
            allResults.push(data.report);
            if (data.report.matched) matchedTotal++;
          }
        } catch (err) {
          completedCount++;
          allErrors.push({
            fileName: `CSV Link #${i + 1}`,
            error: err.response?.data?.error || "Failed to process Drive link"
          });
        }

        const pct = Math.round(((i + 1) / totalLinks) * 95);
        setProgress(pct);
        setStats({
          total: totalLinks,
          processed: completedCount,
          successful: allResults.length,
          failed: allErrors.length,
          matchedCount: matchedTotal
        });
      }

      setProgress(100);
      setCurrentAction("All CSV links processed!");
      setProcessedResults(allResults);
      setErrorsList(allErrors);
      setStep(4);
      return;
    }

    // Direct PDFs chunked upload
    const totalFiles = files.length;
    const chunks = [];
    for (let i = 0; i < totalFiles; i += CHUNK_SIZE) {
      chunks.push(files.slice(i, i + CHUNK_SIZE));
    }

    setStats({
      total: totalFiles,
      processed: 0,
      successful: 0,
      failed: 0,
      matchedCount: 0
    });

    for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
      const chunk = chunks[cIdx];
      setCurrentAction(
        `Uploading batch ${cIdx + 1} of ${chunks.length} (${completedCount}/${totalFiles} files)...`
      );

      const fd = new FormData();
      chunk.forEach(f => fd.append("pdfs", f));
      fd.append("department", sessionInfo.department);
      fd.append("academicYear", sessionInfo.academicYear);
      fd.append("session", sessionInfo.session);
      fd.append("feedbackFormNo", sessionInfo.feedbackFormNo);

      try {
        const { data } = await api.post("/api/process/upload-batch", fd);
        completedCount += chunk.length;
        allResults = [...allResults, ...(data.results || [])];
        allErrors = [...allErrors, ...(data.errors || [])];
        matchedTotal += (data.results || []).filter(r => r.matched).length;

        const currentPct = Math.round((completedCount / totalFiles) * 95);
        setProgress(currentPct);

        setStats({
          total: totalFiles,
          processed: completedCount,
          successful: allResults.length,
          failed: allErrors.length,
          matchedCount: matchedTotal
        });
      } catch (err) {
        console.error("Batch chunk failed:", err);
        allErrors.push({
          fileName: `Batch ${cIdx + 1}`,
          error: err.response?.data?.error || "Batch chunk request failed"
        });
        completedCount += chunk.length;
      }
    }

    setProgress(100);
    setCurrentAction("All files processed and attached!");
    setProcessedResults(allResults);
    setErrorsList(allErrors);
    setStep(4); // Show summary
  }

  // Calculate total size of selected files
  const totalSizeMB = (
    files.reduce((acc, f) => acc + (f.size || 0), 0) /
    (1024 * 1024)
  ).toFixed(1);

  const modalJSX = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col animate-scale-in overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <Upload size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                Upload Feedback Reports
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Automated
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload PDFs directly · Auto-saved to Google Drive · Instant AI Analysis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Storage Status Bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Cloud size={14} className="text-emerald-500" />
            <span className="text-slate-600 font-medium">Report Storage:</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
              <CheckCircle2 size={11} /> Auto-Hosted · Instant 1-Click Access for All Faculty
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
            No Google OAuth required for 90+ faculty members
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ──────────────── STEP 1: SESSION QUESTIONS ──────────────── */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4">
                <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2 mb-1">
                  <Sparkles size={16} className="text-indigo-600" />
                  Academic Session Details
                </h3>
                <p className="text-xs text-indigo-700/80 leading-relaxed">
                  These details will name your Google Drive folder and attach to every
                  extracted faculty report automatically.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Department Name
                  </label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="e.g. Computer Science & Engineering"
                    value={sessionInfo.department}
                    onChange={e =>
                      setSessionInfo(s => ({ ...s, department: e.target.value }))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Academic Year
                    </label>
                    <select
                      className="input w-full"
                      value={sessionInfo.academicYear}
                      onChange={e =>
                        setSessionInfo(s => ({ ...s, academicYear: e.target.value }))
                      }
                    >
                      {YEARS.map(y => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Session
                    </label>
                    <select
                      className="input w-full"
                      value={sessionInfo.session}
                      onChange={e =>
                        setSessionInfo(s => ({ ...s, session: e.target.value }))
                      }
                    >
                      <option value="jul-dec">July – December (Odd Semester)</option>
                      <option value="jan-may">January – June (Even Semester)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Feedback Form No.
                  </label>
                  <select
                    className="input w-full"
                    value={sessionInfo.feedbackFormNo}
                    onChange={e =>
                      setSessionInfo(s => ({ ...s, feedbackFormNo: e.target.value }))
                    }
                  >
                    <option value="I">Feedback Form – I</option>
                    <option value="II">Feedback Form – II</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 2: FILE SELECTION ──────────────── */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div
                onDragOver={e => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFilesAdded(e.dataTransfer.files);
                }}
                className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-200 cursor-pointer ${
                  dragOver
                    ? "border-indigo-500 bg-indigo-50/80 scale-[0.99]"
                    : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50/60"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <Upload size={28} />
                </div>
                <h3 className="text-sm font-bold text-slate-700">
                  Drag & drop all your Feedback PDFs here
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Supports selecting hundreds of individual PDFs, an entire folder, or a single <span className="font-semibold text-indigo-600">.ZIP</span> archive
                </p>

                {/* Quick actions for Folder, Zip, CSV */}
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-5" onClick={e => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5"
                  >
                    <FileText size={14} className="text-indigo-600" />
                    Select PDFs
                  </button>
                  <button
                    type="button"
                    onClick={() => folderInputRef.current?.click()}
                    className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5"
                  >
                    <FolderUp size={14} className="text-violet-600" />
                    Select Folder
                  </button>
                  <button
                    type="button"
                    onClick={() => zipInputRef.current?.click()}
                    className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5"
                  >
                    <Archive size={14} className="text-amber-600" />
                    Upload .ZIP
                  </button>
                  <button
                    type="button"
                    onClick={() => csvInputRef.current?.click()}
                    className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5"
                  >
                    <Table2 size={14} className="text-emerald-600" />
                    Upload CSV
                  </button>
                </div>

                {/* Hidden File Inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  multiple
                  className="hidden"
                  onChange={e => handleFilesAdded(e.target.files)}
                />
                <input
                  ref={folderInputRef}
                  type="file"
                  webkitdirectory=""
                  directory=""
                  multiple
                  className="hidden"
                  onChange={e => handleFilesAdded(e.target.files)}
                />
                <input
                  ref={zipInputRef}
                  type="file"
                  accept=".zip,application/zip,application/x-zip-compressed"
                  className="hidden"
                  onChange={e => handleFilesAdded(e.target.files)}
                />
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={e => handleFilesAdded(e.target.files)}
                />
              </div>

              {/* Selected Files Badge */}
              {files.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between animate-slide-up">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      {isCsv ? <Table2 size={20} /> : isZip ? <Archive size={20} /> : <FileText size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {isCsv
                          ? `${files[0].name} (${csvEntries.length} Drive links)`
                          : isZip
                          ? files[0].name
                          : `${files.length} PDF file(s) selected`}
                      </p>
                      <p className="text-xs text-slate-500">
                        Total Size: {totalSizeMB} MB · Session: {sessionInfo.academicYear} ({sessionInfo.session})
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFiles([])}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ──────────────── STEP 3: REAL-TIME PROGRESS ──────────────── */}
          {step === 3 && (
            <div className="py-8 px-4 text-center space-y-6 animate-fade-in">
              <div className="relative w-20 h-20 mx-auto">
                <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center font-bold text-indigo-700 text-sm">
                  {progress}%
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 text-lg">
                  Analyzing & Uploading Feedback
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">{currentAction}</p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner max-w-md mx-auto">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-violet-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Live Counters */}
              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2">
                <div className="bg-slate-50 border rounded-xl p-2.5">
                  <div className="text-xs text-slate-400">Total Files</div>
                  <div className="text-base font-bold text-slate-800">{stats.total}</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5">
                  <div className="text-xs text-emerald-600">Processed</div>
                  <div className="text-base font-bold text-emerald-700">{stats.successful}</div>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-2.5">
                  <div className="text-xs text-indigo-600">Matched Faculty</div>
                  <div className="text-base font-bold text-indigo-700">{stats.matchedCount}</div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 4: SUMMARY & RESULTS ──────────────── */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="font-bold text-emerald-900 text-base">
                  Batch Processing Complete!
                </h3>
                <p className="text-xs text-emerald-700 mt-1">
                  {stats.successful} reports uploaded to Google Drive & analyzed with AI.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="card p-3 text-center">
                  <span className="text-xs text-slate-400">Successful</span>
                  <div className="text-lg font-bold text-emerald-600">{stats.successful}</div>
                </div>
                <div className="card p-3 text-center">
                  <span className="text-xs text-slate-400">Auto-Matched</span>
                  <div className="text-lg font-bold text-indigo-600">{stats.matchedCount}</div>
                </div>
                <div className="card p-3 text-center">
                  <span className="text-xs text-slate-400">Errors</span>
                  <div className={`text-lg font-bold ${stats.failed > 0 ? "text-rose-600" : "text-slate-400"}`}>
                    {stats.failed}
                  </div>
                </div>
              </div>

              {/* Sample list of processed reports */}
              <div className="border rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">Faculty Name</th>
                      <th className="px-3 py-2 text-left">Subject</th>
                      <th className="px-3 py-2 text-center">Account Match</th>
                      <th className="px-3 py-2 text-right">Drive Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {processedResults.slice(0, 30).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-800 truncate max-w-[140px]">
                          {r.facultyName}
                        </td>
                        <td className="px-3 py-2 text-slate-500">{r.subjectCode || "—"}</td>
                        <td className="px-3 py-2 text-center">
                          {r.matched ? (
                            <span className="text-emerald-600 font-semibold">Matched</span>
                          ) : (
                            <span className="text-amber-600 font-medium">Unlinked</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <a
                            href={getPdfUrl(r)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline inline-flex items-center gap-0.5"
                          >
                            View <ExternalLink size={10} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t bg-slate-50/80 flex items-center justify-between">
          {step === 1 && (
            <>
              <button onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!sessionInfo.department.trim()) {
                    return toast.error("Please enter department name");
                  }
                  setStep(2);
                }}
                className="btn btn-primary flex items-center gap-1.5"
              >
                Next: Select Files <ChevronRight size={15} />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button onClick={() => setStep(1)} className="btn btn-secondary">
                Back
              </button>
              <button
                onClick={startBatchUpload}
                disabled={files.length === 0}
                className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles size={15} />
                Start AI Analysis & Drive Sync
              </button>
            </>
          )}

          {step === 3 && (
            <div className="w-full text-center text-xs text-slate-400">
              Please keep this tab open while files are being uploaded and processed.
            </div>
          )}

          {step === 4 && (
            <button
              onClick={() => {
                onSuccess?.();
                onClose();
              }}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} />
              View Processed Reports on Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalJSX, document.body) : modalJSX;
}
