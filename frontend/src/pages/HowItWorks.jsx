import { useNavigate } from "react-router-dom";
import { Building2, Users, GraduationCap, Shield, Upload, Brain, CheckCircle, Download, ArrowLeft } from "lucide-react";
import mitsLogo from "../assets/mits-logo.png";

const STEPS = [
  {
    icon: Upload,
    color: "bg-blue-600",
    title: "HOD Uploads CSV",
    desc: "Head of Department uploads a CSV file containing Google Drive links to faculty feedback PDFs collected from students.",
    step: "01"
  },
  {
    icon: Brain,
    color: "bg-violet-600",
    title: "AI Analyzes Feedback",
    desc: "Our AI engine downloads each PDF, extracts FFI scores, classifies student comments into appreciation and needs-attention categories.",
    step: "02"
  },
  {
    icon: Users,
    color: "bg-emerald-600",
    title: "Faculty Reviews",
    desc: "Faculty members view their individual feedback reports, acknowledge the results and digitally sign off on the analysis.",
    step: "03"
  },
  {
    icon: GraduationCap,
    color: "bg-amber-600",
    title: "Pro Vice-Chancellor Approves",
    desc: "The Pro Vice-Chancellor reviews all HOD submissions, approves or rejects with comments, triggering the final report generation.",
    step: "04"
  },
  {
    icon: Download,
    color: "bg-rose-600",
    title: "Download PDF Report",
    desc: "Once approved, HODs can download the complete Action Taken Report PDF with all signatures and analysis — semester-wise.",
    step: "05"
  },
];

const PORTALS = [
  { icon: Building2, label: "HOD Portal",     color: "border-blue-500   text-blue-600   bg-blue-50",   desc: "Upload CSV, manage feedback pipeline, send to VC."  },
  { icon: Users,     label: "Faculty Portal",  color: "border-emerald-500 text-emerald-600 bg-emerald-50", desc: "View reports, acknowledge and sign off results."  },
  { icon: GraduationCap, label: "VC Portal",  color: "border-violet-500  text-violet-600 bg-violet-50", desc: "Review submissions, approve or reject with comments." },
  { icon: Shield,    label: "Admin Portal",    color: "border-rose-500    text-rose-600   bg-rose-50",   desc: "Manage users, monitor logs, push code to GitHub."   },
];

export default function HowItWorks() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-[#0d1b3e] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/landing")} className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium transition-colors">
            <ArrowLeft size={16}/> Back to Home
          </button>
          <div className="flex items-center gap-2">
            <img src={mitsLogo} alt="MITS" className="h-8 w-auto object-contain rounded opacity-90"/>
            <p className="text-white font-bold text-sm hidden sm:block">Faculty Feedback System</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-4 py-1.5 rounded-full mb-3 uppercase tracking-widest">Process Flow</span>
          <h1 className="text-3xl font-extrabold text-[#0d1b3e] mb-3">How It Works</h1>
          <div className="w-16 h-1 bg-blue-500 mx-auto rounded mb-4"/>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            A streamlined 5-step process from CSV upload to final approved PDF report — powered by AI.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-5 gap-4 mb-14">
          {STEPS.map((s, i) => (
            <div key={i} className="relative">
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[calc(100%-8px)] w-full h-0.5 bg-slate-200 z-0"/>
              )}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 relative z-10 hover:shadow-md transition-shadow h-full">
                <div className={`w-12 h-12 ${s.color} rounded-xl flex items-center justify-center mb-4 shadow-md`}>
                  <s.icon size={22} className="text-white"/>
                </div>
                <span className="text-xs font-black text-slate-300 mb-1 block">{s.step}</span>
                <p className="font-bold text-slate-800 text-sm mb-2">{s.title}</p>
                <p className="text-slate-500 text-xs leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Portals */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-[#0d1b3e] mb-6 text-center">Access Portals</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PORTALS.map((p, i) => (
              <div key={i} className={`rounded-xl border-l-4 p-4 ${p.color}`}>
                <p.icon size={20} className="mb-2"/>
                <p className="font-bold text-slate-800 text-sm mb-1">{p.label}</p>
                <p className="text-slate-500 text-xs leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-[#0d1b3e] rounded-2xl p-8 text-center">
          <h3 className="text-white font-bold text-xl mb-2">Ready to get started?</h3>
          <p className="text-white/60 text-sm mb-5">Login to your respective portal to begin.</p>
          <button onClick={() => navigate("/landing")}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg">
            Go to Login
          </button>
        </div>
      </main>

      <footer className="bg-[#0d1b3e] py-4 text-center">
        <p className="text-white/40 text-xs">© 2025 Madhav Institute of Technology &amp; Science, Gwalior. All rights reserved.</p>
      </footer>
    </div>
  );
}
