/**
 * GoogleDrivePanel.jsx
 * Google Drive panel — sits beside "Upload Feedback Reports" button.
 * Uses React Portal so it renders at document.body level,
 * completely outside the dark dashboard container.
 */

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  HardDrive, ExternalLink, Link2, CheckCircle2,
  Loader2, Unlink, Search, FileText, X, ChevronDown,
} from "lucide-react";

export default function GoogleDrivePanel({ token }) {
  const [status,      setStatus]      = useState({ connected: false, email: "", loading: true });
  const [files,       setFiles]       = useState([]);
  const [savedFiles,  setSavedFiles]  = useState([]);
  const [fetching,    setFetching]    = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [connecting,  setConnecting]  = useState(false);
  const [search,      setSearch]      = useState("");
  const [nextPage,    setNextPage]    = useState(null);
  const [open,        setOpen]        = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [btnRect,     setBtnRect]     = useState(null);

  const btnRef   = useRef(null);
  const pollRef  = useRef(null);
  const popupRef = useRef(null);

  const GOOGLE_CLIENT_ID =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    "32902780570-ltgii8ds5cf6pp8elj3uapsao7a78u88.apps.googleusercontent.com";

  const api = axios.create({ headers: { Authorization: `Bearer ${token}` } });

  // ── mount ────────────────────────────────────────────────────────────────
  useEffect(() => {
    checkStatus();
    loadSavedFiles();
    const p = new URLSearchParams(window.location.search);
    if (p.get("drive_connected") === "1") {
      toast.success("Google Drive connected!");
      window.history.replaceState({}, "", window.location.pathname);
      checkStatus(); loadSavedFiles(); setOpen(true);
    }
    if (p.get("drive_error")) {
      toast.error("Drive error: " + decodeURIComponent(p.get("drive_error")));
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    function onOutside(e) {
      if (btnRef.current && !btnRef.current.contains(e.target)) {
        // check if click is inside the portal panel
        const portal = document.getElementById("gdrive-panel-portal");
        if (portal && portal.contains(e.target)) return;
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  // reposition on scroll/resize
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

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // ── api helpers ──────────────────────────────────────────────────────────
  async function checkStatus() {
    try {
      const { data } = await api.get("/api/drive/status");
      setStatus({ connected: !!data.connected, email: data.email || "", loading: false });
    } catch {
      setStatus({ connected: false, email: "", loading: false });
    }
  }

  async function loadSavedFiles() {
    try {
      const { data } = await api.get("/api/drive/saved-files");
      setSavedFiles(Array.isArray(data) ? data : []);
    } catch {}
  }

  // ── toggle button ────────────────────────────────────────────────────────
  function handleToggle() {
    if (!open && btnRef.current) setBtnRect(btnRef.current.getBoundingClientRect());
    setOpen(o => !o);
  }

  // ── connect ──────────────────────────────────────────────────────────────
  async function handleConnect() {
    setConnecting(true);
    if (window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: "https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/userinfo.email",
          prompt: "",
          callback: async (resp) => {
            if (resp.error) { connectViaPopup(); return; }
            try {
              const { data } = await api.post("/api/auth/google/drive-connect", {
                tokens: { access_token: resp.access_token },
                email: "",
              });
              setStatus({ connected: true, email: data.user?.googleDriveEmail || data.user?.email || "", loading: false });
              toast.success("Google Drive connected!");
              setConnecting(false);
              await loadSavedFiles();
            } catch (err) {
              setConnecting(false);
              toast.error(err.response?.data?.error || "Failed to save Drive token");
            }
          },
        });
        client.requestAccessToken({ prompt: "" });
        return;
      } catch { /* fall through */ }
    }
    connectViaPopup();
  }

  async function connectViaPopup() {
    try {
      const { data } = await api.get("/api/drive/auth-url");
      if (!data.url) throw new Error("No auth URL");
      const w = 500, h = 650;
      const l = window.screenX + (window.outerWidth  - w) / 2;
      const t = window.screenY + (window.outerHeight - h) / 2;
      const popup = window.open(data.url, "gdrive_oauth", `width=${w},height=${h},left=${l},top=${t},toolbar=0,menubar=0`);
      if (!popup) { window.location.href = data.url; return; }
      popupRef.current = popup;
      pollRef.current = setInterval(async () => {
        if (popup.closed) {
          clearInterval(pollRef.current);
          setConnecting(false);
          setTimeout(async () => { await checkStatus(); await loadSavedFiles(); }, 800);
        }
      }, 1000);
    } catch (err) {
      setConnecting(false);
      toast.error(err.response?.data?.error || "Failed to connect Drive");
    }
  }

  // ── disconnect ───────────────────────────────────────────────────────────
  async function handleDisconnect() {
    if (!window.confirm("Disconnect Google Drive?")) return;
    try {
      await api.post("/api/drive/disconnect");
      setStatus({ connected: false, email: "", loading: false });
      setFiles([]); setNextPage(null);
      toast.success("Google Drive disconnected");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to disconnect");
    }
  }

  // ── generate links ───────────────────────────────────────────────────────
  async function handleGenerateLinks(pageToken = null) {
    setFetching(true);
    try {
      const params = new URLSearchParams();
      if (search)    params.set("search",    search);
      if (pageToken) params.set("pageToken", pageToken);
      const { data } = await api.get(`/api/drive/files?${params}`);
      const newFiles = data.files || [];
      if (pageToken) setFiles(prev => [...prev, ...newFiles]);
      else { setFiles(newFiles); setSelectedIds(new Set(newFiles.map(f => f.fileId))); }
      setNextPage(data.nextPageToken || null);
      if (!newFiles.length) toast("No PDF files found in your Drive", { icon: "📂" });
      else toast.success(`Found ${newFiles.length} PDF(s)`);
    } catch (err) {
      if (err.response?.data?.needsReconnect) {
        setStatus({ connected: false, email: "", loading: false });
        toast.error("Drive session expired. Please reconnect.");
      } else {
        toast.error(err.response?.data?.error || "Failed to fetch Drive files");
      }
    } finally { setFetching(false); }
  }

  // ── save links ───────────────────────────────────────────────────────────
  async function handleSaveLinks() {
    const toSave = files.filter(f => selectedIds.has(f.fileId));
    if (!toSave.length) return toast.error("Select at least one file");
    setSaving(true);
    try {
      const { data } = await api.post("/api/drive/save-links", { files: toSave });
      toast.success(`${data.saved} link(s) saved`);
      await loadSavedFiles();
      setSelectedIds(new Set());
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save links");
    } finally { setSaving(false); }
  }

  function toggleSelect(id) {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    setSelectedIds(selectedIds.size === files.length ? new Set() : new Set(files.map(f => f.fileId)));
  }
  const filtered = files.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()));

  // ── styles (plain JS objects — immune to Tailwind dark mode) ────────────
  const S = {
    panel: {
      position: "fixed",
      top:      (btnRect?.bottom ?? 120) + 6,
      left:     btnRect?.left ?? 20,
      zIndex:   999999,
      width:    400,
      maxHeight: 540,
      background: "#ffffff",
      color:      "#1e293b",
      borderRadius: 16,
      boxShadow: "0 24px 64px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.10)",
      border:    "1px solid #e2e8f0",
      overflow:  "hidden",
      display:   "flex",
      flexDirection: "column",
      fontFamily: "inherit",
    },
    header: { background: "linear-gradient(to right,#eef2ff,#f8fafc)", borderBottom: "1px solid #f1f5f9", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 },
    body:   { padding: 16, overflowY: "auto", flex: 1, background: "#ffffff", display: "flex", flexDirection: "column", gap: 12 },
    iconBox:{ width: 28, height: 28, borderRadius: 8, background: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    badge:  { display:"flex", alignItems:"center", justifyContent:"space-between", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:12, padding:"8px 12px" },
    row:    (sel) => ({ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderBottom:"1px solid #f8fafc", background: sel ? "#eef2ff" : "#ffffff" }),
  };

  // ── portal content ───────────────────────────────────────────────────────
  const panelJSX = (
    <div id="gdrive-panel-portal" style={S.panel}>
      {/* Header */}
      <div style={S.header}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={S.iconBox}><HardDrive size={14} color="#fff" /></div>
          <div>
            <p style={{ fontSize:14, fontWeight:700, color:"#1e293b", margin:0 }}>Google Drive Files</p>
            {status.connected && <p style={{ fontSize:11, color:"#94a3b8", margin:0 }}>{status.email}</p>}
          </div>
        </div>
        <button onClick={() => setOpen(false)} style={{ border:"none", background:"none", cursor:"pointer", color:"#94a3b8", display:"flex", padding:4, borderRadius:8 }}>
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div style={S.body}>

        {/* ── NOT CONNECTED ── */}
        {!status.connected && (
          <div style={{ textAlign:"center", padding:"20px 0" }}>
            <div style={{ width:56, height:56, borderRadius:16, background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}>
              <HardDrive size={24} color="#94a3b8" />
            </div>
            <p style={{ fontSize:14, fontWeight:700, color:"#334155", margin:"0 0 6px" }}>Connect Your Google Drive</p>
            <p style={{ fontSize:12, color:"#94a3b8", margin:"0 0 16px", lineHeight:1.6 }}>
              One click to link your Google account.<br />
              System automatically fetches PDFs and generates links.
            </p>
            <button
              onClick={handleConnect}
              disabled={connecting}
              style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"10px 20px", background: connecting ? "#818cf8" : "#4f46e5", color:"#fff", border:"none", borderRadius:12, fontSize:13, fontWeight:600, cursor: connecting ? "not-allowed" : "pointer" }}
            >
              {connecting
                ? <><Loader2 size={14} style={{ animation:"spin 1s linear infinite" }} /> Connecting…</>
                : <><HardDrive size={14} /> Connect Google Drive</>
              }
            </button>
            <p style={{ fontSize:11, color:"#cbd5e1", marginTop:10 }}>Read-only access · Only you see your files</p>
          </div>
        )}

        {/* ── CONNECTED ── */}
        {status.connected && (
          <>
            {/* Status badge */}
            <div style={S.badge}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <CheckCircle2 size={15} color="#16a34a" />
                <div>
                  <p style={{ fontSize:12, fontWeight:700, color:"#166534", margin:0 }}>Google Drive ✓ Connected</p>
                  <p style={{ fontSize:11, color:"#22c55e", margin:0 }}>{status.email}</p>
                </div>
              </div>
              <button onClick={handleDisconnect} style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:"#ef4444", background:"none", border:"none", cursor:"pointer", padding:"4px 8px", borderRadius:8 }}>
                <Unlink size={11} /> Disconnect
              </button>
            </div>

            {/* Search + Generate */}
            <div style={{ display:"flex", gap:8 }}>
              <div style={{ position:"relative", flex:1 }}>
                <Search size={12} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }} />
                <input
                  type="text"
                  placeholder="Search PDFs…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width:"100%", paddingLeft:28, paddingRight:10, paddingTop:7, paddingBottom:7, fontSize:12, border:"1px solid #e2e8f0", borderRadius:10, outline:"none", background:"#fff", color:"#334155", boxSizing:"border-box" }}
                />
              </div>
              <button
                onClick={() => handleGenerateLinks()}
                disabled={fetching}
                style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 14px", background: fetching ? "#818cf8" : "#4f46e5", color:"#fff", border:"none", borderRadius:10, fontSize:12, fontWeight:600, cursor: fetching ? "not-allowed" : "pointer", whiteSpace:"nowrap" }}
              >
                {fetching ? <><Loader2 size={12} style={{ animation:"spin 1s linear infinite" }} /> Loading…</> : <><Link2 size={12} /> Generate Links</>}
              </button>
            </div>

            {/* File list */}
            {filtered.length > 0 && (
              <div style={{ border:"1px solid #e2e8f0", borderRadius:12, overflow:"hidden" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:"#f8fafc", borderBottom:"1px solid #f1f5f9" }}>
                  <input type="checkbox" checked={selectedIds.size === files.length && files.length > 0} onChange={toggleAll} style={{ accentColor:"#4f46e5" }} />
                  <span style={{ fontSize:11, fontWeight:700, color:"#64748b", flex:1, textTransform:"uppercase", letterSpacing:1 }}>File Name</span>
                  <span style={{ fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:1 }}>Open</span>
                </div>
                <div style={{ maxHeight:200, overflowY:"auto" }}>
                  {filtered.map(f => (
                    <div key={f.fileId} style={S.row(selectedIds.has(f.fileId))}>
                      <input type="checkbox" checked={selectedIds.has(f.fileId)} onChange={() => toggleSelect(f.fileId)} style={{ accentColor:"#4f46e5" }} />
                      <FileText size={12} color="#f87171" style={{ flexShrink:0 }} />
                      <span style={{ fontSize:12, color:"#334155", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={f.name}>{f.name}</span>
                      <a href={f.driveUrl} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, color:"#4f46e5", textDecoration:"none", flexShrink:0 }}>
                        Open <ExternalLink size={10} />
                      </a>
                    </div>
                  ))}
                </div>
                {nextPage && (
                  <div style={{ padding:"8px 12px", textAlign:"center", background:"#fff", borderTop:"1px solid #f1f5f9" }}>
                    <button onClick={() => handleGenerateLinks(nextPage)} disabled={fetching} style={{ fontSize:12, color:"#4f46e5", background:"none", border:"none", cursor:"pointer" }}>Load more…</button>
                  </div>
                )}
              </div>
            )}

            {/* Save button */}
            {files.length > 0 && (
              <button
                onClick={handleSaveLinks}
                disabled={saving || selectedIds.size === 0}
                style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 16px", background: saving || selectedIds.size === 0 ? "#86efac" : "#16a34a", color:"#fff", border:"none", borderRadius:12, fontSize:13, fontWeight:700, cursor: saving || selectedIds.size === 0 ? "not-allowed" : "pointer" }}
              >
                {saving
                  ? <><Loader2 size={13} style={{ animation:"spin 1s linear infinite" }} /> Saving…</>
                  : <><Link2 size={13} /> Save {selectedIds.size > 0 ? `${selectedIds.size} ` : ""}Link{selectedIds.size !== 1 ? "s" : ""} to Database</>
                }
              </button>
            )}

            {/* Saved files */}
            {savedFiles.length > 0 && (
              <div>
                <p style={{ fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:1, margin:"0 0 8px" }}>Saved Links ({savedFiles.length})</p>
                <div style={{ border:"1px solid #e2e8f0", borderRadius:12, maxHeight:160, overflowY:"auto" }}>
                  {savedFiles.map(f => (
                    <div key={f._id} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderBottom:"1px solid #f8fafc", background:"#fff" }}>
                      <FileText size={12} color="#f87171" style={{ flexShrink:0 }} />
                      <span style={{ fontSize:12, color:"#334155", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={f.fileName}>{f.fileName}</span>
                      <a href={f.googleDriveUrl} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, color:"#4f46e5", textDecoration:"none", flexShrink:0 }}>
                        Open <ExternalLink size={10} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {files.length === 0 && savedFiles.length === 0 && (
              <div style={{ textAlign:"center", padding:"16px 0", color:"#94a3b8", fontSize:12 }}>
                <FileText size={22} style={{ margin:"0 auto 8px", color:"#cbd5e1", display:"block" }} />
                Click "Generate Links" to fetch PDFs from your Drive
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  // ── render ───────────────────────────────────────────────────────────────
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
