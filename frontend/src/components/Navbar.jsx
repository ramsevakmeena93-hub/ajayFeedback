import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LogOut, Bell, Settings, Sun, Moon, Home,
  CheckCheck, X, User, ChevronDown, Clock,
  LayoutDashboard, History, BarChart3, PenLine,
  GraduationCap, Users, ArrowLeftRight
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import mitsLogo from "../assets/mits-logo.png";
import WorkspaceSwitcher from "./WorkspaceSwitcher";

const ROLE_CFG = {
  hod:     { label: "HOD",     color: "from-blue-600 to-blue-700",    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",     home: "/hod"     },
  vc:      { label: "VC",      color: "from-violet-600 to-purple-700", badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300", home: "/vc"      },
  faculty: { label: "Faculty", color: "from-emerald-600 to-emerald-700",badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",home: "/faculty" },
  admin:   { label: "Admin",   color: "from-rose-600 to-rose-700",    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",       home: "/admin"   },
};

const NAV_LINKS = {
  hod:     [{ label: "Dashboard", href: "/hod", icon: LayoutDashboard }, { label: "History", href: "/hod/history", icon: History }],
  faculty: [{ label: "Dashboard", href: "/faculty", icon: LayoutDashboard }, { label: "History", href: "/faculty/history", icon: History }],
  vc:      [{ label: "Dashboard", href: "/vc", icon: LayoutDashboard }, { label: "History", href: "/vc/history", icon: History }],
  admin:   [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
};

function getInitialDark() {
  try {
    const s = localStorage.getItem("theme");
    if (s) return s === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch { return false; }
}
function applyDark(dark) {
  document.documentElement.classList.toggle("dark", dark);
  localStorage.setItem("theme", dark ? "dark" : "light");
}

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function Navbar({ title, subtitle }) {
  const { user, token, logout, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isDark, setIsDark] = useState(getInitialDark);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSigModal, setShowSigModal] = useState(false);
  const [sigPreview, setSigPreview] = useState(null);
  const [sigSaving, setSigSaving] = useState(false);
  const [switchingWS, setSwitchingWS] = useState(false);
  const sigRef = useRef();

  const isHOD = user?.role === 'hod' || (user?.roles && user.roles.includes('hod'));
  const activeWS = user?.activeWorkspace || (location.pathname.startsWith('/faculty') ? 'faculty' : (user?.role || 'hod'));

  const userMenuRef = useRef();
  const notifRef = useRef();

  useEffect(() => { applyDark(isDark); }, [isDark]);

  const api = useCallback(
    () => axios.create({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  useEffect(() => {
    if (!token) return;
    function fetchNotifs() {
      api().get("/api/notifications")
        .then(({ data }) => {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        })
        .catch(() => {});
    }
    fetchNotifs();
    const iv = setInterval(fetchNotifs, 60000);
    return () => clearInterval(iv);
  }, [token, api]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handle(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  async function markAllRead() {
    try {
      await api().patch("/api/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  }

  async function handleNotifClick(n) {
    if (!n.read) {
      try {
        await api().patch(`/api/notifications/${n._id}/read`);
        setNotifications(prev => prev.map(item => item._id === n._id ? { ...item, read: true } : item));
        setUnreadCount(c => Math.max(0, c - 1));
      } catch {}
    }
    setNotifOpen(false);
    const ws = user?.activeWorkspace || user?.role;
    if (ws === "faculty") navigate(n.type === "vc_approved" ? "/faculty/history" : "/faculty");
    else if (ws === "hod") navigate(["vc_approved", "vc_rejected"].includes(n.type) ? "/hod/history" : "/hod");
  }

  // Signature handlers (for HOD/Faculty in navbar)
  function handleSigFile(e) {
    const file = e.target.files[0]; if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please upload an image file");
    if (file.size > 2 * 1024 * 1024) return toast.error("Image must be under 2MB");
    const reader = new FileReader();
    reader.onload = (ev) => setSigPreview(ev.target.result);
    reader.readAsDataURL(file);
  }
  async function handleSigSave() {
    if (!sigPreview) return;
    setSigSaving(true);
    try {
      await api().post("/api/auth/signature", { signatureImage: sigPreview });
      toast.success("Signature saved!");
      setShowSigModal(false);
    } catch { toast.error("Failed to save signature"); }
    finally { setSigSaving(false); }
  }

  function handleLogout() {
    logout();
    navigate("/landing");
    toast.success("Logged out successfully");
  }

  const role = user?.activeWorkspace || user?.role || "hod";
  const cfg = ROLE_CFG[role] || ROLE_CFG.hod;
  const navLinks = NAV_LINKS[role] || [];
  const initials = user?.name ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "U";

  async function handleQuickSwitch(targetWS) {
    if (targetWS === activeWS || switchingWS) return;
    setSwitchingWS(true);
    try {
      const res = await api().post("/api/workspace/switch", { workspace: targetWS });
      if (res.data.token && res.data.user) {
        login(res.data.user, res.data.token);
        toast.success(`Switched to ${targetWS === 'faculty' ? 'Faculty (My Teaching)' : 'HOD (Department Overview)'}`);
        navigate(targetWS === 'faculty' ? '/faculty' : '/hod');
      }
    } catch (err) {
      navigate(targetWS === 'faculty' ? '/faculty' : '/hod');
    } finally {
      setSwitchingWS(false);
    }
  }

  return (
    <>
    <nav className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15" style={{ height: "60px" }}>

          {/* Left — Logo + Nav Links */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <a href={cfg.home} className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm bg-white">
                <img src={mitsLogo} alt="MITS" className="w-full h-full object-contain" />
              </div>
              <div className="hidden sm:block">
                <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight">MITS Gwalior</p>
                <p className="text-blue-600 dark:text-blue-400 text-[10px] leading-tight font-medium">Feedback System</p>
              </div>
            </a>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => {
                const Icon = link.icon;
                const isActive = location.pathname === link.href || (link.href !== cfg.home && location.pathname.startsWith(link.href));
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}>
                    <Icon size={15} />
                    {link.label}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Center — Page title (on mobile) */}
          {title && (
            <div className="flex-1 text-center hidden sm:block md:hidden">
              <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{title}</p>
            </div>
          )}

          {/* Right — Actions */}
          <div className="flex items-center gap-2">

            {/* HOD / Faculty Dual-Role Quick Toggle Button */}
            {isHOD && (
              <button
                onClick={() => handleQuickSwitch(activeWS === 'faculty' ? 'hod' : 'faculty')}
                disabled={switchingWS}
                className={`hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm transform hover:scale-[1.03] active:scale-[0.98] border cursor-pointer ${
                  activeWS === 'faculty'
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-blue-400/40 shadow-blue-500/25"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-emerald-400/40 shadow-emerald-500/25"
                }`}
                title={activeWS === 'faculty' ? "Switch to HOD Department Management Dashboard" : "You teach subjects too! Switch to view your personal faculty feedback & subjects"}
              >
                {activeWS === 'faculty' ? (
                  <>
                    <Users size={14} className="text-blue-200" />
                    <span>HOD View</span>
                    <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-md font-semibold tracking-wide">Dept</span>
                  </>
                ) : (
                  <>
                    <GraduationCap size={15} className="text-emerald-200" />
                    <span>My Teaching</span>
                    <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-md font-semibold tracking-wide">Faculty View</span>
                  </>
                )}
              </button>
            )}

            {/* Workspace Switcher — only shows for multi-role users with > 2 roles or custom setups */}
            <WorkspaceSwitcher />

            {/* Theme toggle */}
            <button
              onClick={() => setIsDark(d => !d)}
              className="btn-icon w-9 h-9 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white">
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen(o => !o); setUserMenuOpen(false); }}
                className="btn-icon w-9 h-9 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white relative">
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification panel */}
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in overflow-hidden z-50">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">Notifications</p>
                      {unreadCount > 0 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">{unreadCount} unread</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button onClick={markAllRead}
                          className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1">
                          <CheckCheck size={12} /> All read
                        </button>
                      )}
                      <button onClick={() => setNotifOpen(false)}
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* List */}
                  <div className="max-h-72 overflow-y-auto scrollbar-thin">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center">
                        <Bell size={28} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm">No notifications yet</p>
                      </div>
                    ) : notifications.map(n => (
                      <button
                        key={n._id}
                        onClick={() => handleNotifClick(n)}
                        className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-slate-100 dark:border-slate-800/50
                          hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!n.read ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}>
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? "bg-blue-500" : "bg-transparent"}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug ${!n.read ? "font-semibold text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>
                            {n.message}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock size={10} className="text-slate-400" />
                            <p className="text-xs text-slate-400 dark:text-slate-500">{timeAgo(n.createdAt)}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => { setUserMenuOpen(o => !o); setNotifOpen(false); }}
                className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                {/* Avatar */}
                {user?.profilePhoto ? (
                  <img src={user.profilePhoto} alt={user.name} className="w-8 h-8 rounded-xl object-cover shadow-sm" />
                ) : (
                  <div className={`w-8 h-8 bg-gradient-to-br ${cfg.color} rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm`}>
                    {initials}
                  </div>
                )}
                  <div className="hidden sm:block text-left whitespace-nowrap">
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                      {user?.name || "User"}
                    </p>
                    <p className={`text-[9px] font-bold ${cfg.badge} px-1.5 py-0.5 rounded-md inline-block mt-0.5`}>
                    {cfg.label}
                  </p>
                </div>
                <ChevronDown size={12} className={`text-slate-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in overflow-hidden z-50">
                  {/* Profile header */}
                  <div className="px-5 py-4 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      {/* Large avatar */}
                      {user?.profilePhoto ? (
                        <img src={user.profilePhoto} alt={user.name}
                          className="w-12 h-12 rounded-2xl object-cover shadow-md" />
                      ) : (
                        <div className={`w-12 h-12 bg-gradient-to-br ${cfg.color} rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md`}>
                          {initials}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white text-sm truncate leading-tight">{user?.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user?.email}</p>
                        {user?.department && (
                          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-1 leading-tight line-clamp-2">{user.department}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className={`text-[10px] font-bold ${cfg.badge} px-2.5 py-1 rounded-lg inline-flex items-center gap-1`}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {(user?.role === "hod" || user?.role === "faculty" || user?.role === "vc") && (
                    <div className="p-2">
                      <button
                        onClick={() => { setSigPreview(user?.signatureImage || null); setShowSigModal(true); setUserMenuOpen(false); }}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full text-left">
                        <PenLine size={15} className="text-indigo-500" /> Upload / Edit Signature
                      </button>
                    </div>
                  )}

                  <div className={`p-2 ${(user?.role === "hod" || user?.role === "faculty" || user?.role === "vc") ? "border-t border-slate-100 dark:border-slate-800" : ""}`}>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors w-full text-left font-semibold">
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Page title bar (when title prop is given) */}
      {(title || subtitle) && (
        <div className="border-t border-slate-100 dark:border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2.5 bg-slate-50/80 dark:bg-slate-900/60">
          <div className="max-w-screen-2xl mx-auto flex items-center gap-3">
            <div>
              {title && <h1 className="font-semibold text-slate-900 dark:text-white text-base">{title}</h1>}
              {subtitle && <p className="text-slate-500 dark:text-slate-400 text-xs">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}
    </nav>

    {/* Signature Modal — HOD/Faculty, triggered from Navbar */}
    {showSigModal && (user?.role === "hod" || user?.role === "faculty") && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-scale-in overflow-hidden">
          <div className="px-6 py-4 border-b bg-gradient-to-r from-indigo-50 to-violet-50">
            <h2 className="font-bold text-indigo-900 text-lg">Upload / Edit Signature</h2>
            <p className="text-xs text-indigo-600 mt-0.5">This will appear on all feedback reports</p>
          </div>
          <div className="p-6 space-y-4">
            <div
              onClick={() => sigRef.current.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                sigPreview ? "border-indigo-400 bg-indigo-50" : "border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50"
              }`}
            >
              {sigPreview ? (
                <div>
                  <img src={sigPreview} alt="Signature preview" className="max-h-24 mx-auto object-contain mb-2" />
                  <p className="text-xs text-indigo-600 font-medium">Signature loaded — click to change</p>
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
            <p className="text-xs text-slate-400 text-center">Your signature will appear on all feedback reports</p>
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
  </>
  );
}
