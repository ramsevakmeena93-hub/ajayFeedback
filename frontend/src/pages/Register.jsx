import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import {
  GraduationCap, ArrowLeft, Eye, EyeOff,
  Mail, Lock, User, Building2, ChevronDown
} from "lucide-react";
import mitsLogo from "../assets/mits-logo.png";

const ROLES = [
  { value: "faculty",  label: "Faculty Member",     icon: "👨‍🏫", desc: "Submit & track feedback forms"    },
  { value: "hod",      label: "Head of Department",  icon: "🏛️",  desc: "Review and approve HOD reports"  },
  { value: "vc",       label: "Vice Chancellor",     icon: "🎓",  desc: "View final VC-level reports"     },
  { value: "admin",    label: "Administrator",       icon: "🛡️",  desc: "Manage users and system config"  },
];

const DEPARTMENTS = [
  "Computer Science & Technology",
  "Electronics & Communication",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Information Technology",
  "Applied Sciences & Humanities",
  "MBA",
  "MCA",
];

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    role: "faculty",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);

  const selectedRole = ROLES.find(r => r.value === form.role);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.role) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/register", form);
      login(data.user, data.token);
      toast.success(`Account created! Welcome, ${data.user.name?.split(" ")[0]}! 🎉`);
      const dest =
        data.user.role === "vc"      ? "/vc"
        : data.user.role === "faculty" ? "/faculty"
        : data.user.role === "admin"   ? "/admin"
        : "/hod";
      navigate(dest, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[#0a0f1e] overflow-hidden">

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[42%] flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-700 to-blue-600 opacity-90" />
        <div className="absolute inset-0 bg-[#0a0f1e]/30" />
        <div className="absolute top-1/3 left-1/3 w-56 h-56 bg-white/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-float-slow" />

        <div className="relative flex flex-col h-full p-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/20 flex-shrink-0 shadow-lg">
              <img src={mitsLogo} alt="MITS" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-white font-bold leading-tight">MITS Gwalior</p>
              <p className="text-white/60 text-xs">Faculty Feedback System</p>
            </div>
          </div>

          {/* Centre */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
              <GraduationCap size={36} className="text-white" />
            </div>

            <h2 className="text-4xl font-extrabold text-white mb-3 leading-tight">
              Create your account
            </h2>
            <p className="text-white/60 text-lg mb-8">
              Register to explore all dashboards in demo mode
            </p>

            {/* Role preview cards */}
            <div className="space-y-2">
              {ROLES.map(r => (
                <div
                  key={r.value}
                  onClick={() => setForm(f => ({ ...f, role: r.value }))}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                    form.role === r.value
                      ? "bg-white/25 border border-white/30"
                      : "bg-white/5 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  <span className="text-xl">{r.icon}</span>
                  <div>
                    <p className="text-white text-sm font-semibold leading-tight">{r.label}</p>
                    <p className="text-white/50 text-xs">{r.desc}</p>
                  </div>
                  {form.role === r.value && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="text-white/40 text-xs">
            Demo Mode · MITS Faculty Feedback System 2025–26
          </div>
        </div>
      </div>

      {/* ── Right register panel ── */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center px-6 lg:px-10 py-5 shrink-0">
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Login
          </button>
        </div>

        {/* Centered form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 lg:px-12 py-8">
          <div className="w-full max-w-sm animate-fade-up">

            {/* Header */}
            <div className="mb-6 text-center">
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                <img src={mitsLogo} alt="MITS" className="w-10 h-10 object-contain" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">Create Demo Account</h1>
              <p className="text-slate-400 text-sm">Fill in the details below to get started</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="reg-name"
                    type="text"
                    placeholder="Dr. John Smith"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                    className="w-full pl-9 pr-11 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Role Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Role <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <button
                    id="reg-role-btn"
                    type="button"
                    onClick={() => { setRoleOpen(v => !v); setDeptOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all hover:bg-white/8"
                  >
                    <span className="text-lg">{selectedRole?.icon}</span>
                    <span className="flex-1 text-left font-medium">{selectedRole?.label}</span>
                    <ChevronDown size={15} className={`text-slate-400 transition-transform ${roleOpen ? "rotate-180" : ""}`} />
                  </button>
                  {roleOpen && (
                    <div className="absolute z-30 mt-1.5 w-full rounded-xl bg-slate-900 border border-white/15 shadow-2xl overflow-hidden">
                      {ROLES.map(r => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => { setForm(f => ({ ...f, role: r.value })); setRoleOpen(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                            form.role === r.value
                              ? "bg-violet-600/30 text-white"
                              : "text-slate-300 hover:bg-white/5"
                          }`}
                        >
                          <span className="text-lg">{r.icon}</span>
                          <div>
                            <p className="font-semibold leading-tight">{r.label}</p>
                            <p className="text-xs text-slate-500">{r.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Department
                </label>
                <div className="relative">
                  <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <button
                    id="reg-dept-btn"
                    type="button"
                    onClick={() => { setDeptOpen(v => !v); setRoleOpen(false); }}
                    className="w-full flex items-center gap-2 pl-9 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all hover:bg-white/8"
                  >
                    <span className={`flex-1 text-left ${form.department ? "text-white" : "text-slate-500"}`}>
                      {form.department || "Select department (optional)"}
                    </span>
                    <ChevronDown size={15} className={`text-slate-400 transition-transform ${deptOpen ? "rotate-180" : ""}`} />
                  </button>
                  {deptOpen && (
                    <div className="absolute z-30 mt-1.5 w-full rounded-xl bg-slate-900 border border-white/15 shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => { setForm(f => ({ ...f, department: "" })); setDeptOpen(false); }}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-500 hover:bg-white/5 italic"
                      >
                        None / Not applicable
                      </button>
                      {DEPARTMENTS.map(dept => (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => { setForm(f => ({ ...f, department: dept })); setDeptOpen(false); }}
                          className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                            form.department === dept
                              ? "bg-violet-600/30 text-white"
                              : "text-slate-300 hover:bg-white/5"
                          }`}
                        >
                          {dept}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <button
                id="reg-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-violet-900/40 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating account…
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            {/* Sign in link */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-slate-600 text-xs">Already registered?</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <Link
              to="/login"
              id="go-to-login-btn"
              className="block w-full py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-semibold text-sm text-center transition-all duration-200"
            >
              Sign In Instead
            </Link>

            <p className="text-slate-600 text-xs text-center mt-4">
              By registering you agree to MITS institutional policies
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
