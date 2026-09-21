import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import {
  GraduationCap,
  Users,
  CheckCircle,
  ArrowLeft,
  Shield
} from "lucide-react";
import mitsLogo from "../assets/mits-logo.png";

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Already logged in → redirect to dashboard
  useEffect(() => {
    if (user) go(user.activeWorkspace || user.role);
  }, [user]);

  // Google Identity Services Sign-In
  useEffect(() => {
    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      "32902780570-ltgii8ds5cf6pp8elj3uapsao7a78u88.apps.googleusercontent.com";

    function initializeGoogle() {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleSuccess,
          auto_select: false,
        });

        const btnContainer = document.getElementById("google-login-btn");
        if (btnContainer) {
          btnContainer.innerHTML = "";
          window.google.accounts.id.renderButton(btnContainer, {
            theme: "outline",
            size: "large",
            type: "standard",
            text: "signin_with",
            shape: "rectangular",
            logo_alignment: "left",
            width: 320,
          });
        }
        return true;
      }
      return false;
    }

    if (!initializeGoogle()) {
      const interval = setInterval(() => {
        if (initializeGoogle()) clearInterval(interval);
      }, 300);
      return () => clearInterval(interval);
    }
  }, []);

  async function handleGoogleSuccess(response) {
    if (!response?.credential) return;
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/google", {
        credential: response.credential,
      });
      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name || "User"}! 🎉`);
      go(data.user.activeWorkspace || data.user.role);
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
          "Google Sign-In failed. Please use your @mitsgwalior.in institutional account."
      );
    } finally {
      setLoading(false);
    }
  }

  function go(role) {
    const dest =
      role === "vc"
        ? "/vc"
        : role === "faculty"
        ? "/faculty"
        : role === "admin"
        ? "/admin"
        : "/hod";
    navigate(dest, { replace: true });
  }

  return (
    <div className="min-h-screen flex bg-[#0a0f1e]">
      {/* ── Left Branding Panel ── */}
      <div className="hidden lg:flex lg:w-[45%] flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 opacity-90" />
        <div className="absolute inset-0 bg-[#0a0f1e]/30" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-float-slow" />

        <div className="relative flex flex-col h-full p-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/20 shrink-0 shadow-lg p-1">
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
            <p className="text-white/70 text-base mb-8">
              Manual portal login for HODs, Faculties, VC, and Administrators.
            </p>

            <div className="space-y-3 mb-8">
              {[
                "Instant manual email and password authentication",
                "Automated Google Drive batch PDF processing",
                "AI-powered sentiment analysis and feedback metrics",
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle size={12} className="text-white" />
                  </div>
                  <span className="text-white/80 text-sm">{t}</span>
                </div>
              ))}
            </div>

            {/* Role Cards */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Users, label: "HOD", desc: "Batch upload & send" },
                { icon: GraduationCap, label: "Faculty", desc: "View PDF feedback" },
                { icon: Shield, label: "VC", desc: "Final report approval" },
                { icon: Shield, label: "Admin", desc: "System management" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="p-3 bg-white/10 rounded-xl border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Icon size={12} className="text-blue-200" />
                    <span className="text-white text-xs font-bold">{label}</span>
                  </div>
                  <p className="text-white/50 text-[10px]">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/30 text-xs">
            Faculty Feedback Analysis System · MITS Gwalior
          </p>
        </div>
      </div>

      {/* ── Right Login Form Panel ── */}
      <div className="flex-1 flex flex-col">
        <div className="px-6 lg:px-10 py-5 flex items-center justify-between">
          <button
            onClick={() => navigate("/landing")}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} /> Back to Home
          </button>
          <Link
            to="/register"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
          >
            Create an Account →
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 pb-10">
          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl p-2">
                <img src={mitsLogo} alt="MITS" className="w-12 h-12 object-contain" />
              </div>
              <h1 className="text-2xl font-bold text-white">Sign In</h1>
              <p className="text-slate-400 text-xs mt-1">
                Enter your registered institutional credentials
              </p>
            </div>

            {/* Google Sign-In Card */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
              <div className="text-center mb-5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-300 text-xs font-medium mb-3">
                  <Shield size={12} /> Google OAuth 2.0
                </div>
                <h2 className="text-white text-base font-semibold">Institute Single Sign-On</h2>
                <p className="text-slate-400 text-xs mt-1">
                  Sign in using your authorized MITS institutional Google account
                </p>
              </div>

              {/* Google Button Container */}
              <div className="flex justify-center w-full min-h-[44px] my-3">
                <div id="google-login-btn" className="w-full flex justify-center" />
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-blue-400">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating with Google...</span>
                </div>
              )}

              {/* Allowed Domains Info Box */}
              <div className="mt-5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[11px] text-slate-400 space-y-1.5">
                <p className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <CheckCircle size={13} className="text-emerald-400" />
                  Authorized Institutional Domain:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-300 font-mono text-xs font-semibold">
                    @mitsgwalior.in
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 pt-1">
                  Applicable for all Faculty, HODs, Administration & Pro Vice-Chancellor.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
