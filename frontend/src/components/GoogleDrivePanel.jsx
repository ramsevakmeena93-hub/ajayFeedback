/**
 * GoogleDrivePanel.jsx
 *
 * Google Drive panel using Service Account — no HOD OAuth needed.
 * HODs just click "Load Drive Files" and files appear automatically.
 * Uses React Portal so it renders above the dark dashboard.
 */

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  HardDrive, ExternalLink, Link2, CheckCircle2,
  Loader2, Search, FileText, X, ChevronDown,
  FolderOpen, RefreshCw, Database,
} from "lucide-react";

export default function GoogleDrivePanel({ token }) {
  const [status,      setStatus]      = useState({ connected: false, loading: true });
  const [files,       setFiles]       = useState([]);
  const [savedFiles,  setSavedFiles]  = useState([]);
  const [fetching,    setFetching]    = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [syncing,     setSyncing]     = useState(false);
  const [search,      setSearch]      = useState("");
  const [nextPage,    setNextPage]    = useState(null);
  const [open,        setOpen]        = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [btnRect,     setBtnRect]     = useState(null);
  const [syncResult,  setSyncResult]  = useState(null);

  const btnRef  = useRef(null);
  const api     = axios.create({ headers: { Authorization: `Bearer ${token}` } });

  // ── mount ──────────────────────────────────────────────────────────────
  useEffect(() => {
    checkStatus();
    loadSavedFiles();
  }, []);

  // ── close on outside click ─────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    function onOut(e) {
      if (btnRef.current && !btnRef.current.contains(e.target)) {
        const portal = document.getElementById("gdrive-portal");
        if (portal && portal.contains(e.target)) return;
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOut);
    return () => document.removeEventListener("mousedown", onOut);
  }, [open]);

  // ── reposition on scroll ───────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    function update() {
      if (btnRef.current) setBtnRect(btnRef.current.getBoundingClientRect());
    }
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  // ── api ────────────────────────────────────────────────────────────────
  async function checkStatus() {
    try {
      const { data } = await api.get("/api/drive/status");
      setStatus({ connected: !!data.connected, mode: data.mode, loading: false });
    } catch {
      setStatus({ connected: false, loading: false });
    }
  }

  async function loadSavedFiles() {
    try {
      const { data } = await api.get("/api/drive/saved-files");
      setSavedFiles(Array.isArray(data) ? data : []);
    } catch {}
  }

  function handleToggle() {
    if (!open && btnRef.current) setBtnRect(btnRef.current.getBoundingClientRect());
    setOpen(o => !o);
  }

  // ── load files from shared Drive folder ───────────────────────────────
  async function handleLoadFiles(pageToken = null) {
    setFetching(true);
    setSyncResult(null);
    try {
      const params = new URLSearchParams();
      if (search)    params.set("search",    search);
      if (pageToken) params.set("pageToken", pageToken);

      const { data } = await api.get(`/api/drive/folder-files?${params}`);
      const newFiles = data.files || [];

      if (pageToken) setFiles(prev => [...prev, ...newFiles]);
      else {
        setFiles(newFiles);
        setSelectedIds(new Set(newFiles.filter(f => !f.isFolder).map(f => f.fileId)));
      }
      setNextPage(data.nextPageToken || null);

      if (!newFiles.length) toast("No files found in the shared Drive folder", { icon: "📂" });
      else toast.success(`Found ${newFiles.length} file(s) in Drive`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to load Drive files");
    } finally {
      setFetching(false);
    }
  }

  // ── save links to DriveFile DB ─────────────────────────────────────────
  async function handleSaveLinks() {
    const toSave = files.filter(f => selectedIds.has(f.fileId));
    if (!toSave.length) return toast.error("Select at least one file");
    setSaving(true);
    try {
      const { data } = await api.post("/api/drive/save-links", { files: toSave });
      toast.success(`${data.saved} link(s) saved to database`);
      await loadSavedFiles();
      setSelectedIds(new Set());
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save links");
    } finally {
      setSaving(false);
    }
  }

  // ── sync Drive files to FacultyReport records ──────────────────────────
  async function handleSyncToReports() {
    const toSync = files.filter(f => selectedIds.has(f.fileId) && !f.isFolder);
    if (!toSync.length) return toast.error("Select at least one file to sync");
    setSyncing(true);
    setSyncResult(null);
    try {
      const { data } = await api.post("/api/drive/sync-to-reports", { files: toSync });
      setSyncResult(data);
      if (data.matched > 0) {
        toast.success(`${data.matched} file(s) matched and saved to reports`);
      } else {
        toast("No files matched faculty names automatically", { icon: "⚠️" });
      }
      await loadSavedFiles();
    } catch (err) {
      toast.error(err.response?.data?.error || "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  function toggleSelect(id) {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    const allIds = files.filter(f => !f.isFolder).map(f => f.fileId);
    setSelectedIds(selectedIds.size === allIds.length ? new Set() : new Set(allIds));
  }

  const filtered = files.filter(f =>
    !search || f.name.toLowerCase().includes(search.toLowerCase())
  );
  const pdfFiles = filtered.filter(f => !f.isFolder);
  const allPdfIds = pdfFiles.map(f => f.fileId);

  // ── styles ─────────────────────────────────────────────────────────────
  const panelStyle = {
    position: "fixed",
    top:      (btnRect?.bottom ?? 120) + 6,
    left:     btnRect?.left ?? 20,
    zIndex:   999999,
    width:    420,
    maxHeight: 580,
    background: "#ffffff",
    color:      "#1e293b",
    borderRadius: 16,
    boxShadow: "0 24px 64px rgba(0,0,0,0.20), 0 4px 16px rgba(0,0,0,0.08)",
    border:    "1px solid #e2e8f0",
    overflow:  "hidden",
    display:   "flex",
    flexDirection: "column",
    fontFamily: "inherit",
  };

  // ── portal panel ───────────────────────────────────────────────────────
  const panelJSX = (
    <div id="gdrive-portal" style={panelStyle}>

      {/* Header */}
      <div style={{ background: "linear-gradient(to right,#eef2ff,#f8fafc)", borderBottom: "1px solid #f1f5f9", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <HardDrive size={14} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: 0 }}>Google Drive Files</p>
            <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>Shared folder · Service Account</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8", display: "flex", padding: 4, borderRadius: 8 }}>
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: 14, overflowY: "auto", flex: 1, background: "#ffffff", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Status badge */}
        {status.loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#94a3b8", fontSize: 13 }}>
            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Checking connection…
          </div>
        ) : status.connected ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "8px 12px" }}>
            <CheckCircle2 size={15} color="#16a34a" />
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#166534", margin: 0 }}>Google Drive ✓ Ready</p>
              <p style={{ fontSize: 11, color: "#22c55e", margin: 0 }}>Service account connected — no login needed</p>
            </div>
          </div>
        ) : (
          <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 12, padding: "10px 12px" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#854d0e", margin: "0 0 2px" }}>⚠️ Service Account Not Configured</p>
            <p style={{ fontSize: 11, color: "#a16207", margin: 0 }}>Ask the admin to set GOOGLE_SERVICE_ACCOUNT_KEY and GOOGLE_DRIVE_FOLDER_ID in Render.</p>
          </div>
        )}

        {/* Search + Load button */}
        {status.connected && (
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                type="text"
                placeholder="Search files…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLoadFiles()}
                style={{ width: "100%", paddingLeft: 28, paddingRight: 10, paddingTop: 7, paddingBottom: 7, fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 10, outline: "none", background: "#fff", color: "#334155", boxSizing: "border-box" }}
              />
            </div>
            <button
              onClick={() => handleLoadFiles()}
              disabled={fetching}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: fetching ? "#818cf8" : "#4f46e5", color: "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: fetching ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
            >
              {fetching ? <><Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Loading…</> : <><FolderOpen size={12} /> Load Files</>}
            </button>
          </div>
        )}

        {/* File list */}
        {pdfFiles.length > 0 && (
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
              <input type="checkbox" checked={selectedIds.size === allPdfIds.length && allPdfIds.length > 0} onChange={toggleAll} style={{ accentColor: "#4f46e5" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", flex: 1, textTransform: "uppercase", letterSpacing: 1 }}>
                File Name ({pdfFiles.length})
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>Open</span>
            </div>

            {/* Rows */}
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {pdfFiles.map(f => (
                <div key={f.fileId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: "1px solid #f8fafc", background: selectedIds.has(f.fileId) ? "#eef2ff" : "#fff" }}>
                  <input type="checkbox" checked={selectedIds.has(f.fileId)} onChange={() => toggleSelect(f.fileId)} style={{ accentColor: "#4f46e5" }} />
                  <FileText size={12} color="#f87171" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#334155", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={f.name}>{f.name}</span>
                  <a href={f.driveUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#4f46e5", textDecoration: "none", flexShrink: 0 }}>
                    Open <ExternalLink size={10} />
                  </a>
                </div>
              ))}
            </div>

            {nextPage && (
              <div style={{ padding: "8px 12px", textAlign: "center", background: "#fff", borderTop: "1px solid #f1f5f9" }}>
                <button onClick={() => handleLoadFiles(nextPage)} disabled={fetching} style={{ fontSize: 12, color: "#4f46e5", background: "none", border: "none", cursor: "pointer" }}>
                  Load more…
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        {pdfFiles.length > 0 && (
          <div style={{ display: "flex", gap: 8 }}>
            {/* Save links to DB */}
            <button
              onClick={handleSaveLinks}
              disabled={saving || selectedIds.size === 0}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 12px", background: saving || selectedIds.size === 0 ? "#86efac" : "#16a34a", color: "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: saving || selectedIds.size === 0 ? "not-allowed" : "pointer" }}
            >
              {saving ? <><Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Saving…</> : <><Link2 size={12} /> Save Links</>}
            </button>

            {/* Sync to FacultyReport */}
            <button
              onClick={handleSyncToReports}
              disabled={syncing || selectedIds.size === 0}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 12px", background: syncing || selectedIds.size === 0 ? "#a5b4fc" : "#4f46e5", color: "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: syncing || selectedIds.size === 0 ? "not-allowed" : "pointer" }}
            >
              {syncing ? <><Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Syncing…</> : <><Database size={12} /> Sync to Reports</>}
            </button>
          </div>
        )}

        {/* Sync result */}
        {syncResult && (
          <div style={{ background: syncResult.matched > 0 ? "#f0fdf4" : "#fffbeb", border: `1px solid ${syncResult.matched > 0 ? "#bbf7d0" : "#fde68a"}`, borderRadius: 12, padding: "10px 12px" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: syncResult.matched > 0 ? "#166534" : "#92400e", margin: "0 0 4px" }}>
              {syncResult.matched > 0 ? "✅" : "⚠️"} Sync Result
            </p>
            <p style={{ fontSize: 12, color: "#374151", margin: 0 }}>
              <strong>{syncResult.matched}</strong> matched · <strong>{syncResult.unmatched}</strong> unmatched · <strong>{syncResult.total}</strong> total
            </p>
            {syncResult.matched > 0 && (
              <p style={{ fontSize: 11, color: "#15803d", margin: "4px 0 0" }}>
                Drive URLs saved to faculty report records ✓
              </p>
            )}
          </div>
        )}

        {/* Saved files */}
        {savedFiles.length > 0 && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 8px" }}>
              Saved Links ({savedFiles.length})
            </p>
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, maxHeight: 150, overflowY: "auto" }}>
              {savedFiles.map(f => (
                <div key={f._id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: "1px solid #f8fafc", background: "#fff" }}>
                  <FileText size={12} color="#f87171" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#334155", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={f.fileName}>{f.fileName}</span>
                  <a href={f.googleDriveUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#4f46e5", textDecoration: "none", flexShrink: 0 }}>
                    Open <ExternalLink size={10} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!fetching && status.connected && files.length === 0 && savedFiles.length === 0 && (
          <div style={{ textAlign: "center", padding: "16px 0", color: "#94a3b8", fontSize: 12 }}>
            <FolderOpen size={24} style={{ margin: "0 auto 8px", color: "#cbd5e1", display: "block" }} />
            Click "Load Files" to fetch PDFs from the shared Drive folder
          </div>
        )}
      </div>
    </div>
  );

  // ── render ─────────────────────────────────────────────────────────────
  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "6px 12px",
          background: status.connected ? "#f0fdf4" : "#ffffff",
          color:      status.connected ? "#15803d" : "#475569",
          border:     status.connected ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
          borderRadius: 10, fontSize: 12, fontWeight: 600,
          cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
          transition: "all 0.15s",
        }}
      >
        {status.loading
          ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
          : <HardDrive size={13} />
        }
        {status.connected ? "Drive ✓" : "Google Drive"}
        <ChevronDown size={11} style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
      </button>

      {open && btnRect && typeof document !== "undefined"
        ? createPortal(panelJSX, document.body)
        : null
      }
    </>
  );
}
