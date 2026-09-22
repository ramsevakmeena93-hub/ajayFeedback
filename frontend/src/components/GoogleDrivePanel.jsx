/**
 * GoogleDrivePanel.jsx — Google Drive integration panel
 * Sits beside "Upload Feedback Reports" button in HODDashboard toolbar.
 * Completely separate from existing upload workflow.
 */

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  HardDrive, ExternalLink, Link2, CheckCircle2,
  Loader2, Unlink, Search, FileText, X, ChevronDown,
} from "lucide-react";

export default function GoogleDrivePanel({ token }) {
  const [status,     setStatus]     = useState({ connected: false, email: "", loading: true });
  const [files,      setFiles]      = useState([]);
  const [savedFiles, setSavedFiles] = useState([]);
  const [fetching,   setFetching]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [search,     setSearch]     = useState("");
  const [nextPage,   setNextPage]   = useState(null);
  const [open,       setOpen]       = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const pollRef  = useRef(null);
  const popupRef = useRef(null);
  const panelRef = useRef(null);

  const api = axios.create({ headers: { Authorization: `Bearer ${token}` } });

  const GOOGLE_CLIENT_ID =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    "32902780570-ltgii8ds5cf6pp8elj3uapsao7a78u88.apps.googleusercontent.com";

  // ── Close panel when clicking outside ──────────────────────────────────
  useEffect(() => {
    function handleOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  // ── On mount: check status + load saved files ───────────────────────────
  useEffect(() => {
    checkStatus();
    loadSavedFiles();

    // Handle redirect after backend OAuth callback
    const p = new URLSearchParams(window.location.search);
    if (p.get("drive_connected") === "1") {
      toast.success("Google Drive connected!");
      window.history.replaceState({}, "", window.location.pathname);
      checkStatus();
      loadSavedFiles();
      setOpen(true);
    }
    if (p.get("drive_error")) {
      toast.error("Drive error: " + decodeURIComponent(p.get("drive_error")));
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

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

  // ── Connect: try silent token first, fall back to popup OAuth ───────────
  async function handleConnect() {
    setConnecting(true);

    // Try Google Identity Services token client (silent — reuses logged-in session)
    if (window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: [
            "https://www.googleapis.com/auth/drive.readonly",
            "https://www.googleapis.com/auth/userinfo.email",
          ].join(" "),
          prompt: "",  // empty = reuse existing Google session, no login screen
          callback: async (resp) => {
            if (resp.error) {
              // Silent failed → try popup OAuth
              connectViaPopup();
              return;
            }
            // Send access token to existing drive-connect endpoint
            try {
              const { data } = await api.post("/api/auth/google/drive-connect", {
                tokens: { access_token: resp.access_token },
                email: "",
              });
              setStatus({
                connected: true,
                email: data.user?.googleDriveEmail || data.user?.email || "",
                loading: false,
              });
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
      } catch {
        // fall through
      }
    }

    // Fallback: backend authorization code flow → popup
    connectViaPopup();
  }

  async function connectViaPopup() {
    try {
      const { data } = await api.get("/api/drive/auth-url");
      if (!data.url) throw new Error("No auth URL returned");

      const w = 500, h = 650;
      const l = window.screenX + (window.outerWidth  - w) / 2;
      const t = window.screenY + (window.outerHeight - h) / 2;

      const popup = window.open(
        data.url,
        "gdrive_oauth",
        `width=${w},height=${h},left=${l},top=${t},toolbar=0,menubar=0`
      );
      popupRef.current = popup;

      if (!popup) { window.location.href = data.url; return; }

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

  // ── Disconnect ───────────────────────────────────────────────────────────
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

  // ── Fetch files from Drive ───────────────────────────────────────────────
  async function handleGenerateLinks(pageToken = null) {
    setFetching(true);
    try {
      const params = new URLSearchParams();
      if (search)    params.set("search",    search);
      if (pageToken) params.set("pageToken", pageToken);

      const { data } = await api.get(`/api/drive/files?${params}`);
      const newFiles = data.files || [];

      if (pageToken) {
        setFiles(prev => [...prev, ...newFiles]);
      } else {
        setFiles(newFiles);
        setSelectedIds(new Set(newFiles.map(f => f.fileId)));
      }
      setNextPage(data.nextPageToken || null);

      if (newFiles.length === 0) toast("No PDF files found in your Drive", { icon: "📂" });
      else toast.success(`Found ${newFiles.length} PDF(s)`);
    } catch (err) {
      if (err.response?.data?.needsReconnect) {
        setStatus({ connected: false, email: "", loading: false });
        toast.error("Drive session expired. Please reconnect.");
      } else {
        toast.error(err.response?.data?.error || "Failed to fetch Drive files");
      }
    } finally {
      setFetching(false);
    }
  }

  // ── Save links to DB ─────────────────────────────────────────────────────
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
    } finally {
      setSaving(false);
    }
  }

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  function toggleAll() {
    setSelectedIds(selectedIds.size === files.length ? new Set() : new Set(files.map(f => f.fileId)));
  }

  const filtered = files.filter(f =>
    !search || f.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // ── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="relative" ref={panelRef}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`btn btn-sm flex items-center gap-1.5 ${
          status.connected
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
        } rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors shadow-sm`}
      >
        {status.loading
          ? <Loader2 size={13} className="animate-spin" />
          : <HardDrive size={13} />
        }
        {status.connected ? "Drive ✓" : "Google Drive"}
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown panel — forced light background, no dark mode */}
      {open && (
        <div
          className="absolute left-0 top-10 z-[9999] w-[400px] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          style={{ background: "#ffffff", color: "#1e293b" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-slate-100"
            style={{ background: "linear-gradient(to right, #eef2ff, #f8fafc)" }}
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                <HardDrive size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Google Drive Files</p>
                {status.connected && (
                  <p className="text-[11px] text-slate-400">{status.email}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400"
            >
              <X size={13} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto" style={{ background: "#ffffff" }}>

            {/* ── NOT CONNECTED ── */}
            {!status.connected && (
              <div className="text-center py-5 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
                  <HardDrive size={24} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">Connect Your Google Drive</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-[260px] mx-auto">
                    One click to link your Google account. The system automatically
                    fetches your PDFs and generates shareable links.
                  </p>
                </div>
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 shadow-sm"
                >
                  {connecting
                    ? <><Loader2 size={14} className="animate-spin" /> Connecting…</>
                    : <><HardDrive size={14} /> Connect Google Drive</>
                  }
                </button>
                <p className="text-[11px] text-slate-400">Read-only access · Only you see your files</p>
              </div>
            )}

            {/* ── CONNECTED ── */}
            {status.connected && (
              <>
                {/* Status badge */}
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-emerald-800">Google Drive ✓ Connected</p>
                      <p className="text-[11px] text-emerald-600">{status.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                  >
                    <Unlink size={11} /> Disconnect
                  </button>
                </div>

                {/* Search + Generate */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search PDFs…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white text-slate-700"
                    />
                  </div>
                  <button
                    onClick={() => handleGenerateLinks()}
                    disabled={fetching}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-60 whitespace-nowrap"
                  >
                    {fetching
                      ? <><Loader2 size={12} className="animate-spin" /> Loading…</>
                      : <><Link2 size={12} /> Generate Links</>
                    }
                  </button>
                </div>

                {/* File list */}
                {filtered.length > 0 && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    {/* Header row */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-100">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === files.length && files.length > 0}
                        onChange={toggleAll}
                        className="rounded accent-indigo-600"
                      />
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex-1">
                        File Name
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Open</span>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-slate-100 max-h-[200px] overflow-y-auto">
                      {filtered.map(f => (
                        <div
                          key={f.fileId}
                          className={`flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition-colors ${
                            selectedIds.has(f.fileId) ? "bg-indigo-50/50" : "bg-white"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.has(f.fileId)}
                            onChange={() => toggleSelect(f.fileId)}
                            className="rounded accent-indigo-600 shrink-0"
                          />
                          <FileText size={12} className="text-red-400 shrink-0" />
                          <span
                            className="text-xs text-slate-700 flex-1 truncate"
                            title={f.name}
                          >
                            {f.name}
                          </span>
                          <a
                            href={f.driveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] text-indigo-600 hover:underline shrink-0"
                          >
                            Open <ExternalLink size={10} />
                          </a>
                        </div>
                      ))}
                    </div>

                    {/* Load more */}
                    {nextPage && (
                      <div className="px-3 py-2 border-t border-slate-100 text-center bg-white">
                        <button
                          onClick={() => handleGenerateLinks(nextPage)}
                          disabled={fetching}
                          className="text-xs text-indigo-600 hover:underline disabled:opacity-50"
                        >
                          Load more…
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Save button */}
                {files.length > 0 && (
                  <button
                    onClick={handleSaveLinks}
                    disabled={saving || selectedIds.size === 0}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {saving
                      ? <><Loader2 size={13} className="animate-spin" /> Saving…</>
                      : <><Link2 size={13} /> Save {selectedIds.size > 0 ? `${selectedIds.size} ` : ""}Link{selectedIds.size !== 1 ? "s" : ""} to Database</>
                    }
                  </button>
                )}

                {/* Saved files */}
                {savedFiles.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      Saved Links ({savedFiles.length})
                    </p>
                    <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-[160px] overflow-y-auto">
                      {savedFiles.map(f => (
                        <div key={f._id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 bg-white">
                          <FileText size={12} className="text-red-400 shrink-0" />
                          <span
                            className="text-xs text-slate-700 flex-1 truncate"
                            title={f.fileName}
                          >
                            {f.fileName}
                          </span>
                          <a
                            href={f.googleDriveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] text-indigo-600 hover:underline shrink-0"
                          >
                            Open <ExternalLink size={10} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {files.length === 0 && savedFiles.length === 0 && (
                  <div className="text-center py-4 text-xs text-slate-400">
                    <FileText size={22} className="mx-auto mb-2 text-slate-300" />
                    Click "Generate Links" to fetch PDFs from your Drive
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
