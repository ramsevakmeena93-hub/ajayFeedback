import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import mitsLogo from "../assets/mits-logo.png";
import campusImg from "../assets/mits-campus2.png";
import {
  Building2, Users, GraduationCap, Shield,
  MapPin, Phone, Mail, ArrowRight,
  Star, TrendingUp, CheckCircle, BarChart3,
  Zap, Menu, X, ChevronRight, Code2
} from "lucide-react";

const STATS = [
  { value: "500+", label: "Faculty Evaluated",  icon: Users,      color: "text-blue-400"   },
  { value: "14",   label: "Departments",         icon: Building2,  color: "text-violet-400" },
  { value: "98%",  label: "Response Rate",       icon: TrendingUp, color: "text-emerald-400"},
  { value: "4.2",  label: "Avg FFI Score",       icon: Star,       color: "text-amber-400"  }
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen]     = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const [counted, setCounted]       = useState(false);

  useEffect(() => {
    if (user) {
      const dest = user.role === "vc" ? "/vc"
        : user.role === "faculty" ? "/faculty"
        : user.role === "admin" ? "/admin" : "/hod";
      navigate(dest, { replace: true });
    }
  }, [user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setCounted(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-slate-900/95 backdrop-blur-xl shadow-sm border-b border-slate-800/80"
          : "bg-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="#home" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm bg-white/10 flex-shrink-0">
                <img src={mitsLogo} alt="MITS" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="font-bold text-sm leading-tight text-white">MITS Gwalior</p>
                <p className="text-[10px] leading-tight text-blue-300">Faculty Feedback System</p>
              </div>
            </a>

            <div className="hidden md:flex items-center gap-2 mr-2">
              <button
                onClick={() => navigate("/developer")}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-indigo-500/20 border border-indigo-400/50 shadow-[0_0_15px_rgba(99,102,241,0.6)] hover:shadow-[0_0_25px_rgba(99,102,241,0.9)] hover:bg-indigo-500/40 hover:border-indigo-400 transition-all duration-300 relative overflow-hidden group">
                <span className="relative z-10 flex items-center gap-1.5"><Code2 size={16} /> Developer</span>
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
              </button>
            </div>

            <button
              onClick={() => navigate("/login")}
              className="hidden md:flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
              Sign In <ArrowRight size={14} />
            </button>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-xl text-white hover:bg-white/10 transition-colors">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-slate-900 border-t border-slate-800 px-4 py-3 space-y-2">
            <button
              onClick={() => { navigate("/developer"); setMenuOpen(false); }}
              className="w-full py-2.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 text-white transition-colors">
              Developer Profile
            </button>
            <button
              onClick={() => { navigate("/login"); setMenuOpen(false); }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors">
              Sign In
            </button>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/20 rounded-full blur-[100px] animate-float-slow" />
          <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-emerald-600/15 rounded-full blur-[80px] animate-float" style={{ animationDelay: "2s" }} />
          <div className="absolute inset-0 bg-grid-dark opacity-30" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[85vh] py-16">

            {/* Left — Content */}
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold mb-6">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                MITS Deemed University — Academic Feedback Platform
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
                Your Feedback,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-emerald-400">
                  Shapes Our Future
                </span>
              </h1>

              <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-lg">
                A premium AI-powered faculty feedback management system for MITS Gwalior.
                Streamline evaluations, gain insights, and build excellence.
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                <button
                  onClick={() => navigate("/login")}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all duration-200 hover:-translate-y-0.5">
                  Get Started <ArrowRight size={16} />
                </button>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center gap-5 flex-wrap">
                {[
                  "Google OAuth Secured",
                  "AI-Powered Analysis",
                  "MITS Official System",
                ].map(label => (
                  <div key={label} className="flex items-center gap-1.5 text-white/50 text-xs">
                    <CheckCircle size={13} className="text-emerald-400" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Campus image */}
            <div className="hidden lg:block animate-fade-up relative" style={{ animationDelay: "200ms" }}>
              <div className="relative">
                <div
                  className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
                  style={{ clipPath: "polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)" }}>
                  <img
                    src={campusImg}
                    alt="MITS Campus"
                    className="w-full h-80 object-cover"
                    onError={e => { e.target.src = "https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d1b3e]/60 via-transparent to-transparent" />
                </div>

                {/* Floating stats card */}
                <div className="absolute -bottom-5 -left-6 glass-dark rounded-2xl p-4 animate-float" style={{ animationDelay: "1s" }}>
                  <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-2">Live Stats</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <TrendingUp size={14} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg leading-none">4.2</p>
                      <p className="text-white/50 text-[10px]">Avg FFI Score</p>
                    </div>
                  </div>
                </div>

                {/* Floating quote card */}
                <div className="absolute -top-4 -right-6 glass-dark rounded-2xl p-4 max-w-[180px] animate-float-slow">
                  <div className="flex gap-0.5 mb-2">
                    {[1,2,3,4,5].map(i => <Star key={i} size={10} className="text-amber-400 fill-amber-400" />)}
                  </div>
                  <p className="text-white/80 text-[10px] leading-relaxed">
                    "Honest feedback leads to real improvement."
                  </p>
                  <p className="text-blue-400 text-[10px] font-semibold mt-1.5">♥ MITS Gwalior</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce opacity-60">
          <div className="w-5 h-8 border-2 border-white/30 rounded-full flex items-start justify-center p-1">
            <div className="w-1 h-2 bg-white/60 rounded-full animate-bounce" />
          </div>
          <p className="text-white/40 text-[10px] font-medium">Scroll</p>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-slate-900 border-y border-slate-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <div key={i} className="flex items-center gap-4 animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  <stat.icon size={18} className={stat.color} />
                </div>
                <div>
                  <p className="text-2xl font-black text-white leading-none">{counted ? stat.value : "—"}</p>
                  <p className="text-slate-500 text-xs font-medium mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-violet-600/10 to-emerald-600/10 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold mb-6">
            <Zap size={12} className="text-violet-400" />
            AI-Powered · Secure · Instant
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
            Ready to streamline<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
              faculty feedback?
            </span>
          </h2>

          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
            Join MITS Gwalior's official digital feedback platform.
            Sign in with your institute Google account and get started instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-xl hover:shadow-blue-500/30 transition-all duration-200 hover:-translate-y-1 text-base">
              Sign In with Google <ArrowRight size={18} />
            </button>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-10">
            {[
              { icon: BarChart3, label: "AI Analytics" },
              { icon: Shield,    label: "Role-Based Access" },
              { icon: Zap,       label: "Instant Processing" },
              { icon: GraduationCap, label: "VC Approval Flow" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs text-slate-400">
                <Icon size={13} className="text-blue-400" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEVELOPER SECTION ── */}
      <section className="py-24 relative overflow-hidden bg-[#0d1326] border-t border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-900/10 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6 shadow-sm">
            <Code2 size={14} className="text-indigo-400" />
            Behind the Code
          </div>
          
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 tracking-tight">
            Meet the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Developer</span>
          </h2>
          
          <p className="text-slate-400 text-lg sm:text-xl mb-10 max-w-3xl mx-auto leading-relaxed">
            Discover the architect behind the MITS Faculty Feedback System. Explore the journey, technical expertise, and the expert guidance that shaped this premium academic platform.
          </p>
          
          <button
            onClick={() => navigate("/developer")}
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 hover:bg-indigo-50 font-bold rounded-xl shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 hover:-translate-y-1 text-base group">
            View Developer Profile <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 border-t border-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">

            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
                  <img src={mitsLogo} alt="MITS" className="w-full h-full object-contain opacity-90" />
                </div>
                <div>
                  <p className="font-bold leading-tight">MITS Gwalior</p>
                  <p className="text-blue-400 text-xs leading-tight">Faculty Feedback System</p>
                </div>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                An AI-powered faculty feedback management platform for Madhav Institute of Technology &amp; Science, Gwalior — Deemed University.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="mt-5 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors">
                Sign In
              </button>
            </div>

            {/* Quick Links */}
            <div>
              <p className="font-semibold text-xs uppercase tracking-widest text-slate-500 mb-4">Quick Links</p>
              <div className="space-y-2">
                {["About MITS", "Privacy Policy", "Contact Us"].map(link => (
                  <a key={link} href="#" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors group">
                    <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    {link}
                  </a>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <p className="font-semibold text-xs uppercase tracking-widest text-slate-500 mb-4">Contact Us</p>
              <div className="space-y-3">
                {[
                  { icon: MapPin, text: "Gwalior, Madhya Pradesh, India" },
                  { icon: Mail,   text: "feedback@mitsgwalior.ac.in" },
                  { icon: Phone,  text: "+91 751 240 0900" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-2.5">
                    <Icon size={14} className="text-blue-400 shrink-0 mt-0.5" />
                    <span className="text-slate-400 text-sm">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 py-5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-slate-600 text-xs">
              © 2025 Madhav Institute of Technology &amp; Science, Gwalior. All rights reserved.
            </p>
            <p className="text-slate-700 text-xs">
              Developed under the guidance of Dr. Abhishek Dixit, HOD of Centre for CST
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
