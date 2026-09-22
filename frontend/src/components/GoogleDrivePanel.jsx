/**
 * GoogleDrivePanel.jsx
 *
 * Completely self-contained Google Drive integration panel.
 * Sits beside the Upload Feedback Reports button in HODDashboard.
 * Does NOT touch or modify any existing upload/report workflow.
 *
 * Flow:
 *   1. Check /api/drive/status on mount
 *   2. If not connected → show "Connect Google Drive" button
 *   3. Click → backend generates OAuth URL → open in popup window
 *   4. After OAuth callback → popup closes → panel polls for connection
 *   5. Connected → show file list + "Generate Links" button
 *   6. "Generate Links" → fetch files from Drive → save to DB → display
 */

import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  HardDrive,
  ExternalLink,
  RefreshCw,
  Link2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Unlink,
  Search,
  FileText,
  ChevronRight,
  ChevronDown,
  X,
} from "lucide-react";

export default function GoogleDrivePanel({ token }) {
  // ── state ────────────────────────────────────────────────────────────────
  const [status, setStatus]         = useState({ connected: false, email: "", loading: true });
  const [files, setFiles]           = useState([]);           // Drive files from API
  const [savedFiles, setSavedFiles] = useState([]);           // previously saved to DB
  const [fetching, setFetching]     = useState(false);        // loading Drive files
  const [saving, setSaving]         = useState(false);        // saving links to DB
  const [connecting, setConnecting] = useState(false);        // OAuth popup in progress
  const [search, setSearch]         = useState("");
  const [nextPage, setNextPage]     = useState(null);
  const [expanded, setExpanded]     = useState(true);         // panel open/close
  const [selectedIds, setSelectedIds] = useState(new Set());  // files HOD wants to save

  const pollRef   = useRef(null);
  const popupRef  = useRef(null);

  const api = axios.create({ headers: { Authorization: `Bearer ${token}` } });

  // ── on mount: check status + load saved files ────────────────────────────
  useEffect(() => {
    checkStatus();
    loadSavedFiles();

    // Handle redirect params from OAuth callback (when popup closes)
    const params = new URLSearchParams(window.location.search);
    if (params.get("drive_connected") === "1") {
      toast.success("Google Drive connected successfully!");
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
      checkStatus();
    }
    if (params.get("drive_error")) {
      const errMsg = decodeURIComponent(params.get("drive_error"));
      toast.error(`Drive connection failed: ${errMsg}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  async function checkStatus() {
    try {
      const { data } = await api.get("/api/drive/status");
      setStatus({ connected: data.connected, email: data.email || "", loading: false });
    } catch {
      setStatus({ connected: false, email: "", loading: false });
    }
  }

  async function loadSavedFiles() {
    try {
      const { data } = await api.get("/api/drive/saved-files");
      setSavedFiles(data || []);
    } catch {}
  }

  // ── Connect Google Drive — uses existing Google session silently ────────
  async function handleConnect() {
    setConnecting(true);

    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      "32902780570-ltgii8ds5cf6pp8elj3uapsao7a78u88.apps.googleusercontent.com";

    // Try Google Identity Services token client first (silent — reuses existing session)
    if (window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email",
          // Empty prompt = reuse existing Google session silently (no login screen)
          prompt: "",
          callback: async (tokenResponse) => {
            setConnecting(false);
            if (tokenResponse.error) {
              // If silent auth fails, fall back to full OAuth popup via backend
              _connectViaBackendOAuth();
              return;
            }
            try {
              const { data } = await api.post("/api/auth/google/drive-connect", {
                tokens: tokenResponse,
                email: tokenResponse.email || "",
              });
              setStatus({
                connected: true,
                email: data.user?.googleDriveEmail || "",
                loading: false,
              });
              toast.success("Google Drive connected!");
              await loadSavedFiles();
            } catch (err) {
              toast.error(err.response?.data?.error || "Failed to save Drive connection");
            }
          },
        });
        // Request token — Google will use existing session without showing login
        client.requestAccessToken({ prompt: "" });
        return;
      } catch {
        // Fall through to backend OAuth
      }
    }

    // Fallback: backend OAuth code flow (opens popup)
    _connectViaBackendOAuth();
  }

  // Backend OAuth popup fallback
  async function _connectViaBackendOAuth() {
    try {
      const { data } = await api.get("/api/drive/auth-url");
      const authUrl = data.url;
      if (!authUrl) throw new Error("Could not get authorization URL");

      const width  = 500;
      const height = 650;
      const left   = window.screenX + (window.outerWidth  - width)  / 2;
      const top    = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        "google_drive_oauth",
        `width=${width},height=${height},left=${left},top=${top},toolbar=0,menubar=0,location=0`
      );
      popupRef.current = popup;

      if (!popup) {
        window.location.href = authUrl;
        return;
      }

      pollRef.current = setInterval(async () => {
        if (popup.closed) {
          clearInterval(pollRef.current);
          setConnecting(false);
          setTimeout(async () => {
            await checkStatus();
            await loadSavedFiles();
          }, 800);
        }
      }, 1000);
    } catch (err) {
      setConnecting(false);
      toast.error(err.response?.data?.error || err.message || "Failed to connect Drive");
    }
  }

  // ── Disconnect ───────────────────────────────────────────────────────────
  async function handleDisconnect() {
    if (!window.confirm("Disconnect Google Drive? Your saved file links will remain.")) return;
    try {
      await api.post("/api/drive/disconnect");
      setStatus({ connected: false, email: "", loading: false });
      setFiles([]);
      setNextPage(null);
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

      const { data } = await api.get(`/api/drive/files?${params.toString()}`);

      if (pageToken) {
        setFiles(prev => [...prev, ...(data.files || [])]);
      } else {
        setFiles(data.files || []);
        setSelectedIds(new Set((data.files || []).map(f => f.fileId))); // select all by default
      }
      setNextPage(data.nextPageToken || null);

      if ((data.files || []).length === 0) {
        toast("No PDF files found in your Google Drive", { icon: "📂" });
      } else {
        toast.success(`Found ${data.files.length} PDF file(s) from Google Drive`);
      }
    } catch (err) {
      if (err.response?.data?.needsReconnect) {
        setStatus({ connected: false, email: "", loading: false });
        toast.error("Drive authorization expired. Please reconnect.");
      } else {
        toast.error(err.response?.data?.error || "Failed to fetch Drive files");
      }
    } finally {
      setFetching(false);
    }
  }

  // ── Save selected links to DB ────────────────────────────────────────────
  async function handleSaveLinks() {
    const toSave = files.filter(f => selectedIds.has(f.fileId));
    if (toSave.length === 0) return toast.error("Select at least one file to save");

    setSaving(true);
    try {
      const { data } = await api.post("/api/drive/save-links", { files: toSave });
      toast.success(`${data.saved} link(s) saved successfully`);
      await loadSavedFiles();
      setSelectedIds(new Set()); // clear selection after save
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save links");
    } finally {
      setSaving(false);
    }
  }

  // ── Toggle file selection ────────────────────────────────────────────────
  function toggleSelect(fileId) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(fileId) ? next.delete(fileId) : next.add(fileId);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === files.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(files.map(f => f.fileId)));
    }
  }

  // ── Filtered view ────────────────────────────────────────────────────────
  const filteredFiles = files.filter(f =>
    !search || f.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Cleanup popup poll on unmount ────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  if (status.loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400">
        <Loader2 size={14} className="animate-spin" />
        <span>Checking Drive…</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* ── Collapsed: just a button in the toolbar ── */}
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className={`btn btn-sm flex items-center gap-1.5 ${
            status.connected
              ? "btn-secondary text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
              : "btn-secondary text-slate-600"
          }`}
        >
          <HardDrive size={14} />
          {status.connected ? "Drive ✓" : "Google Drive"}
          <ChevronDown size={12} />
        </button>
      ) : (
        /* ── Expanded panel ── */
        <div className="absolute right-0 top-8 z-50 w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 animate-scale-in overflow-hidden">

          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <HardDrive size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Google Drive Files</p>
                {status.connected && (
                  <p className="text-[11px] text-slate-400 leading-none mt-0.5">{status.email}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400"
            >
              <X size={13} />
            </button>
          </div>

          <div className="p-4 space-y-3 max-h-[520px] overflow-y-auto">

            {/* ── NOT CONNECTED ── */}
            {!status.connected && (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
                  <HardDrive size={26} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">Connect Your Google Drive</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[260px] mx-auto leading-relaxed">
                    Authorise once with your Google account. The system will automatically
                    retrieve your uploaded PDF files and generate shareable links.
                  </p>
                </div>
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="btn btn-primary flex items-center gap-2 mx-auto disabled:opacity-60"
                >
                  {connecting ? (
                    <><Loader2 size={15} className="animate-spin" /> Connecting…</>
                  ) : (
                    <><HardDrive size={15} /> Connect Google Drive</>
                  )}
                </button>
                <p className="text-[11px] text-slate-400">
                  Only you can see your Drive files · Read-only access
                </p>
              </div>
            )}

            {/* ── CONNECTED ── */}
            {status.connected && (
              <>
                {/* Connection badge */}
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
                    title="Disconnect Google Drive"
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
                      className="input text-xs py-1.5 pl-7 w-full"
                    />
                  </div>
                  <button
                    onClick={() => handleGenerateLinks()}
                    disabled={fetching}
                    className="btn btn-primary btn-sm flex items-center gap-1.5 whitespace-nowrap disabled:opacity-60"
                  >
                    {fetching ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Link2 size={13} />
                    )}
                    {fetching ? "Loading…" : "Generate Links"}
                  </button>
                </div>

                {/* File list from Drive */}
                {filteredFiles.length > 0 && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    {/* table header */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === files.length && files.length > 0}
                        onChange={toggleAll}
                        className="rounded accent-indigo-600"
                      />
                      <span className="flex-1">File Name</span>
                      <span>Open</span>
                    </div>

                    {/* rows */}
                    <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto">
                      {filteredFiles.map(f => (
                        <div
                          key={f.fileId}
                          className={`flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition-colors ${
                            selectedIds.has(f.fileId) ? "bg-indigo-50/40" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.has(f.fileId)}
                            onChange={() => toggleSelect(f.fileId)}
                            className="rounded accent-indigo-600 shrink-0"
                          />
                          <FileText size={13} className="text-red-400 shrink-0" />
                          <span
                            className="text-xs text-slate-700 flex-1 truncate max-w-[220px]"
                            title={f.name}
                          >
                            {f.name}
                          </span>
                          <a
                            href={f.driveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline shrink-0"
                          >
                            Open <ExternalLink size={10} />
                          </a>
                        </div>
                      ))}
                    </div>

                    {/* load more */}
                    {nextPage && (
                      <div className="px-3 py-2 border-t border-slate-100 text-center">
                        <button
                          onClick={() => handleGenerateLinks(nextPage)}
                          disabled={fetching}
                          className="text-xs text-indigo-600 hover:underline disabled:opacity-50 flex items-center gap-1 mx-auto"
                        >
                          {fetching ? <Loader2 size={11} className="animate-spin" /> : <ChevronRight size={11} />}
                          Load more
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Save Links button */}
                {files.length > 0 && (
                  <button
                    onClick={handleSaveLinks}
                    disabled={saving || selectedIds.size === 0}
                    className="btn btn-success btn-sm w-full flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <><Loader2 size={13} className="animate-spin" /> Saving…</>
                    ) : (
                      <><Link2 size={13} /> Save {selectedIds.size > 0 ? `${selectedIds.size} ` : ""}Link{selectedIds.size !== 1 ? "s" : ""} to Database</>
                    )}
                  </button>
                )}

                {/* Saved files section */}
                {savedFiles.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                      <CheckCircle2 size={11} className="text-emerald-500" />
                      Saved Links ({savedFiles.length})
                    </p>
                    <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-[180px] overflow-y-auto">
                      {savedFiles.map(f => (
                        <div key={f._id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50">
                          <FileText size={12} className="text-red-400 shrink-0" />
                          <span
                            className="text-xs text-slate-700 flex-1 truncate max-w-[240px]"
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

                {/* Empty state after generate */}
                {files.length === 0 && savedFiles.length === 0 && (
                  <div className="text-center py-4 text-xs text-slate-400">
                    <FileText size={24} className="mx-auto mb-2 text-slate-300" />
                    Click "Generate Links" to fetch your Drive PDFs
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
