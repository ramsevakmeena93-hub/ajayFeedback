import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { GraduationCap, CheckCircle, ArrowLeft, Shield, Users } from "lucide-react";
import mitsLogo from "../assets/mits-logo.png";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1084044671986-10c6e17vbbl87d4fjdj2tqnbps9t55g7.apps.googleusercontent.com";

export default function Login() {
  const navigate    = useNavigate();
  const { login, user } = useAuth();
  const btnRef      = useRef(null);
  const [ready, setReady] = useState(false);

  // Already logged in → redirect
  useEffect(() => {
    if (user) go(user.activeWorkspace || user.role);
  }, [user]);

  // Mount Google button
  useEffect(() => {
    function mount() {
      if (!window.google?.accounts?.id || !btnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback:  onCredential,
        auto_select: false,
      });
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: "filled_blue",
        size:  "large",
        width: 340,
        text:  "signin_with",
        shape: "rectangular",
        logo_alignment: "left",
      });
      setReady(true);
    }

    if (window.google?.accounts?.id) { mount(); return; }

    // Dynamically load Google Identity Services script
    if (!document.querySelector('script[src*="accounts.google.com/gsi"]')) {
      const s  = document.createElement("script");
      s.src    = "https://accounts.google.com/gsi/client";
      s.async  = true;
      s.defer  = true;
      document.head.appendChild(s);
    }

    const iv = setInterval(() => {
      if (window.google?.accounts?.id) { clearInterval(iv); mount(); }
    }, 200);
    return () => clearInterval(iv);
  }, []);

  async function onCredential(response) {
    if (!response?.credential) {
      toast.error("Google sign-in failed"); return;
    }
    try {
      const { data } = await axios.post("/api/auth/google", {
        credential: response.credential,
      });
      login(data.user, data.token);
      toast.success(`Welcome, ${data.user.name?.split(" ")[0]}! 👋`);
      if (data.needsDeptSetup) navigate("/profile-completion", { replace: true });
      else go(data.user.activeWorkspace || data.user.role);
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
        "Only @mitsgwalior.in accounts are allowed",
        { duration: 6000 }
      );
    }
  }

  function go(role) {
    const dest = role === "vc"      ? "/vc"
               : role === "faculty" ? "/faculty"
               : role === "admin"   ? "/admin"
               : "/hod";
    navigate(dest, { replace: true });
  }

  return (
    <div className="min-h-screen flex bg-[#0a0f1e]">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[45%] flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-violet-700 opacity-90" />
        <div className="absolute inset-0 bg-[#0a0f1e]/30" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-float-slow" />

        <div className="relative flex flex-col h-full p-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/20 shrink-0 shadow-lg">
              <img src={mitsLogo} alt="MITS" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-white font-bold leading-tight">MITS Gwalior</p>
              <p className="text-white/60 text-xs">Faculty Feedback System</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
              <GraduationCap size={36} className="text-white" />
            </div>
            <h2 className="text-4xl font-extrabold text-white mb-3">Welcome Back</h2>
            <p className="text-white/60 text-lg mb-8">
              Sign in with your MITS Google account
            </p>
            <div className="space-y-3 mb-8">
              {[
                "Use your @mitsgwalior.in Google account",
                "Secure OAuth 2.0 — no password needed",
                "Auto role detection after sign-in",
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle size={12} className="text-white" />
                  </div>
                  <span className="text-white/80 text-sm">{t}</span>
                </div>
              ))}
            </div>

            {/* Role grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Users,        label: "HOD",     desc: "Manage reports" },
                { icon: GraduationCap,label: "Faculty",  desc: "View feedback"  },
                { icon: Shield,       label: "VC",       desc: "Approve final"  },
                { icon: Shield,       label: "Admin",    desc: "System control" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="p-3 bg-white/10 rounded-xl border border-white/10">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Icon size={11} className="text-blue-300" />
                    <span className="text-white text-xs font-bold">{label}</span>
                  </div>
                  <p className="text-white/50 text-[10px]">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/30 text-xs">
            Automated Faculty Feedback Analysis System · MITS 2025–26
          </p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col">
        <div className="px-6 lg:px-10 py-5">
          <button
            onClick={() => navigate("/landing")}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} /> Back to Home
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <div className="w-full max-w-sm animate-fade-up text-center">

            {/* Logo */}
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <img src={mitsLogo} alt="MITS" className="w-14 h-14 object-contain" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">Sign in to MITS</h1>
            <p className="text-slate-400 text-sm mb-8">
              Use your{" "}
              <span className="text-blue-400 font-semibold">@mitsgwalior.in</span>{" "}
              Google account
            </p>

            {/* Google button */}
            <div className="flex flex-col items-center gap-4">
              <div
                ref={btnRef}
                className="w-full flex items-center justify-center"
                style={{ minHeight: 44 }}
              />

              {/* Loading placeholder (hidden once ready) */}
              {!ready && (
                <div className="w-full h-11 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-3">
                  <svg className="w-5 h-5 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <span className="text-slate-400 text-sm">Loading Google Sign-In…</span>
                </div>
              )}

              {/* Note */}
              <div className="w-full p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-blue-300 text-xs leading-relaxed">
                  🔒 Only <strong>@mitsgwalior.in</strong> institute accounts are accepted.
                </p>
              </div>
            </div>

            <p className="text-slate-700 text-xs mt-8">
              By signing in you agree to MITS institutional policies
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
