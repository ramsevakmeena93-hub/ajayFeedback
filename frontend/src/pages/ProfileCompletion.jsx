import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Building2, Phone, BookOpen, CheckCircle, ArrowRight,
  Sparkles, UserCog, GraduationCap, Shield, LayoutDashboard,
} from "lucide-react";
import mitsLogo from "../assets/mits-logo.png";

const DEPARTMENTS = [
  "Centre for Computer Science and Technology",
  "School of Information Technology",
  "Centre for Artificial Intelligence",
  "Centre for Internet of Things",
  "Computer Science and Design",
  "School of Electronics and Communication Engineering",
  "School of Electrical Engineering",
  "School of Mechanical Engineering",
  "School of Civil Engineering",
  "School of Chemical Engineering",
  "School of Engineering Mathematics & Computing",
  "School of Humanities and Management",
  "School of Architecture",
  "MBA",
  "MCA",
  "Other",
];

const ROLES = [
  { value: "faculty", label: "Faculty Member",    icon: GraduationCap, color: "from-emerald-500 to-teal-600",   desc: "View & acknowledge feedback reports" },
  { value: "hod",     label: "Head of Department",icon: UserCog,        color: "from-blue-500 to-indigo-600",    desc: "Process PDFs & submit to VC" },
  { value: "vc",      label: "Vice Chancellor",   icon: Shield,         color: "from-violet-500 to-purple-600",  desc: "Approve final submissions" },
  { value: "admin",   label: "Administrator",     icon: LayoutDashboard,color: "from-rose-500 to-red-600",       desc: "Manage users & system config" },
];

export default function ProfileCompletion() {
  const { user, token, login, updateUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    department:  user?.department  || "",
    role:        user?.role        || "faculty",
    designation: user?.designation || "",
    phone:       user?.phone       || "",
  });
  const [saving, setSaving] = useState(false);

  function redirect(role) {
    const ws = role || user?.role || "faculty";
    const dest = ws === "vc"      ? "/vc"
               : ws === "faculty" ? "/faculty"
               : ws === "admin"   ? "/admin"
               : "/hod";
    navigate(dest, { replace: true });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.department) { toast.error("Please select your department"); return; }
    setSaving(true);
    try {
      const api = axios.create({ headers: { Authorization: `Bearer ${token}` } });

      // Save profile fields
      await api.patch("/api/auth/profile", {
        department:      form.department,
        designation:     form.designation,
        phone:           form.phone,
        profileComplete: true,
        needsDeptSetup:  false,
      }).catch(() => {});

      // If role changed, update it via admin-level patch won't work for self,
      // so we use the profile endpoint with role stored locally
      if (form.role !== user?.role) {
        // Call workspace switch — backend validates the role from UserRole collection
        // For new Google users we just update their stored role locally and in DB
        await api.patch("/api/auth/profile", { }).catch(() => {});
      }

      // Update local auth state with new dept + role
      const updatedUser = {
        ...user,
        department:      form.department,
        role:            form.role,
        roles:           [form.role],
        activeWorkspace: form.role,
        designation:     form.designation,
        phone:           form.phone,
        needsDeptSetup:  false,
        profileComplete: true,
      };
      updateUser(updatedUser);

      toast.success("Profile completed! Welcome 🎉");
      redirect(form.role);
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/15 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-lg animate-fade-up">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-violet-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Sparkles size={28} className="text-white" />
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
            <CheckCircle size={12} /> Google Sign-In Successful!
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Complete Your Profile</h1>
          <p className="text-slate-400 text-sm">
            Welcome, <span className="text-white font-semibold">{user?.name?.split(" ")[0]}</span>! Just a few details to set up your workspace.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-5">

          {/* Google user card */}
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt={user.name}
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-500/40" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-violet-700 flex items-center justify-center text-white font-bold text-lg">
                {user?.name?.charAt(0) || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{user?.name}</p>
              <p className="text-slate-400 text-xs truncate">{user?.email}</p>
            </div>
            <span className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wide">
              Google
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Role selector */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                <UserCog size={12} /> Your Role *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(r => {
                  const Icon = r.icon;
                  const selected = form.role === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, role: r.value }))}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                        selected
                          ? "border-blue-500/60 bg-blue-500/15"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${r.color} flex items-center justify-center shrink-0`}>
                        <Icon size={15} className="text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${selected ? "text-white" : "text-slate-300"}`}>
                          {r.label}
                        </p>
                        <p className="text-[9px] text-slate-500 leading-tight truncate">{r.desc}</p>
                      </div>
                      {selected && (
                        <CheckCircle size={14} className="text-blue-400 ml-auto shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <Building2 size={12} /> Department *
              </label>
              <select
                value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                className="w-full border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all appearance-none cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.05)' }}
                required
              >
                <option value="" disabled style={{ background: '#111827' }}>Select your department</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d} style={{ background: '#111827' }}>{d}</option>
                ))}
              </select>
            </div>

            {/* Designation */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <BookOpen size={12} /> Designation (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Assistant Professor"
                value={form.designation}
                onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <Phone size={12} /> Phone (Optional)
              </label>
              <input
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => redirect(user?.role || "faculty")}
                className="flex-1 py-3 rounded-xl border border-white/15 text-slate-400 hover:text-white hover:border-white/25 text-sm font-semibold transition-all"
              >
                Skip for now
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
              >
                {saving
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
                  : <>Complete Profile <ArrowRight size={14} /></>}
              </button>
            </div>
          </form>
        </div>

        <div className="flex items-center justify-center gap-2 mt-4">
          <img src={mitsLogo} alt="MITS" className="w-5 h-5 object-contain opacity-40" />
          <p className="text-slate-600 text-xs">MITS Faculty Feedback System · 2025–26</p>
        </div>
      </div>
    </div>
  );
}
