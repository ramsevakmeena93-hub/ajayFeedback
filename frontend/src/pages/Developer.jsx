import { Mail, Linkedin, Github, GraduationCap, Briefcase, Award, Code2, Sparkles, MapPin } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

const Developer = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#03050a] flex flex-col text-slate-100 relative overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* ── 3D / Animated Background ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[150px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[150px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
      {user && <Navbar title="Developer" />}

      {/* Header bar for non-logged-in users */}
      {!user && (
        <header className="w-full bg-white/5 backdrop-blur-md border-b border-white/10 shadow-sm transition-colors duration-200">
          <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
            <a href="/landing" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-lg">M</div>
              <p className="font-bold text-slate-100 text-sm tracking-wide">MITS Feedback System</p>
            </a>
            <a href="/landing" className="text-xs text-slate-400 hover:text-white font-medium transition-colors flex items-center gap-1">
              <span>←</span> Back to Home
            </a>
          </div>
        </header>
      )}

      <div className="flex-1 py-8 px-4">
        <div className="max-w-4xl mx-auto">

          {/* Animated Header */}
          <div className="text-center mb-10 relative perspective-1000">
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <Code2 className="w-64 h-64 text-indigo-400 animate-[spin_60s_linear_infinite]" />
            </div>
            <div className="relative transform-gpu hover:scale-105 transition-transform duration-700 ease-out">
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full mb-4 backdrop-blur-sm shadow-xl">
                <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                <span className="text-indigo-300 font-semibold text-xs tracking-wider uppercase">Mastermind Architect</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3 drop-shadow-2xl">
                Ajay Meena
              </h1>
              <p className="text-lg text-slate-400 font-medium tracking-wide">Elite Full Stack Developer & AI Innovator</p>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Left — Profile Card */}
            <div className="lg:col-span-1 perspective-1000">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-[0_4px_16px_0_rgba(0,0,0,0.36)] p-5 border border-white/10 sticky top-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_20px_-10px_rgba(79,70,229,0.5)] hover:border-indigo-500/50 group">
                {/* Profile Image */}
                <div className="relative mb-6">
                  <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-[4px] border-indigo-500/30 shadow-[0_0_20px_rgba(79,70,229,0.4)] group-hover:border-indigo-400/60 transition-all duration-700 group-hover:scale-105 group-hover:rotate-3 relative z-10">
                    <img src="/ajay-meena.png" alt="Ajay Meena"
                      className="w-full h-full object-cover"
                      style={{ objectPosition: '50% 20%' }}
                      onError={e => { e.target.style.display='none'; e.target.parentElement.innerHTML='<div class="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-black">A</div>'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                  
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(139,92,246,0.5)] border border-white/20 whitespace-nowrap group-hover:scale-110 transition-transform duration-500">
                      MITS Gwalior
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="text-center mt-6 mb-5">
                  <div className="inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] absolute"/>
                    <div className="w-2 h-2 bg-green-500 rounded-full relative"/>
                    <span className="text-green-400 text-xs font-semibold tracking-wide">Available for Projects</span>
                  </div>
                </div>

                {/* Social Links */}
                <div className="space-y-2">
                  <a href="mailto:25tc1aj7@mitsgwl.ac.in"
                    className="flex items-center gap-3 p-2 bg-white/5 rounded-xl hover:bg-indigo-500/20 transition-all duration-300 border border-transparent hover:border-indigo-500/30 hover:pl-4 group/link hover:shadow-[0_0_15px_rgba(79,70,229,0.2)]">
                    <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center group-hover/link:scale-110 transition-transform duration-300 group-hover/link:bg-indigo-500/40 text-indigo-300 group-hover/link:text-white">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Email</p>
                      <p className="text-xs font-medium text-slate-200 group-hover/link:text-white">25tc1aj7@mitsgwl.ac.in</p>
                    </div>
                  </a>
                  <a href="https://www.linkedin.com/in/ajay-meena-607a7b376" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 bg-white/5 rounded-xl hover:bg-blue-500/20 transition-all duration-300 border border-transparent hover:border-blue-500/30 hover:pl-4 group/link hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover/link:scale-110 transition-transform duration-300 group-hover/link:bg-blue-500/40 text-blue-300 group-hover/link:text-white">
                      <Linkedin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">LinkedIn</p>
                      <p className="text-xs font-medium text-slate-200 group-hover/link:text-white">Connect with me</p>
                    </div>
                  </a>
                  <a href="https://github.com/ramsevakmeena93-hub" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 bg-white/5 rounded-xl hover:bg-slate-500/20 transition-all duration-300 border border-transparent hover:border-slate-500/30 hover:pl-4 group/link hover:shadow-[0_0_15px_rgba(148,163,184,0.2)]">
                    <div className="w-8 h-8 bg-slate-500/20 rounded-lg flex items-center justify-center group-hover/link:scale-110 transition-transform duration-300 group-hover/link:bg-slate-500/40 text-slate-300 group-hover/link:text-white">
                      <Github className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">GitHub</p>
                      <p className="text-xs font-medium text-slate-200 group-hover/link:text-white">View Projects</p>
                    </div>
                  </a>
                </div>

                {/* Stats */}
                <div className="mt-5 pt-5 border-t border-white/10">
                  <div className="text-center p-3 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-colors duration-300">
                    <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 drop-shadow-md">3</p>
                    <p className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider mt-0.5">Hackathons Won</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Details */}
            <div className="lg:col-span-2 space-y-8 perspective-1000">

              {/* Education */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-[0_4px_16px_0_rgba(0,0,0,0.36)] p-5 border border-white/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_20px_-10px_rgba(99,102,241,0.4)] hover:border-indigo-500/50 group">
                <div className="flex items-center gap-3 mb-5 relative">
                  <div className="absolute -left-6 w-1 h-8 bg-indigo-500 rounded-r-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md group-hover:rotate-12 transition-transform duration-500">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Education</h2>
                </div>
                <div className="p-4 bg-white/[0.03] rounded-xl border border-white/5 border-l-4 border-l-indigo-500 hover:bg-white/[0.06] transition-colors duration-300">
                  <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                    <h3 className="text-lg font-bold text-white tracking-wide">Madhav Institute of Technology & Science</h3>
                    <span className="text-xs font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.2)]">2025 – 2029</span>
                  </div>
                  <p className="text-indigo-400 font-semibold text-sm mb-3">B.Tech in Computer Science & Technology</p>
                  <div className="flex items-center gap-2 text-xs bg-black/20 p-2 rounded-md border border-white/5 w-fit">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full shadow-[0_0_5px_rgba(168,85,247,0.8)]"/>
                    <span className="text-slate-300">Enrollment: <span className="font-bold text-white tracking-widest">BTTC25O1007</span></span>
                  </div>
                  <p className="text-xs text-slate-400 mt-3 font-medium flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-indigo-500"/> Centre for Computer Science & Technology</p>
                </div>
              </div>

              {/* Experience */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-[0_4px_16px_0_rgba(0,0,0,0.36)] p-5 border border-white/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_20px_-10px_rgba(59,130,246,0.4)] hover:border-blue-500/50 group">
                <div className="flex items-center gap-3 mb-5 relative">
                  <div className="absolute -left-6 w-1 h-8 bg-blue-500 rounded-r-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md group-hover:rotate-12 transition-transform duration-500">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Experience</h2>
                </div>
                <div className="p-4 bg-white/[0.03] rounded-xl border border-white/5 border-l-4 border-l-blue-500 hover:bg-white/[0.06] transition-colors duration-300">
                  <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                    <h3 className="text-lg font-bold text-white tracking-wide">Software Intern</h3>
                    <span className="text-xs font-bold text-blue-300 bg-blue-500/20 border border-blue-500/30 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.2)]">Nov 2025 – Jan 2026</span>
                  </div>
                  <p className="text-blue-400 font-semibold text-sm mb-1.5">Yuga Yatra Retails</p>
                  <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5"><MapPin className="w-3 h-3 text-blue-500" /> Bangalore, India</p>
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-[0_4px_16px_0_rgba(0,0,0,0.36)] p-5 border border-white/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_20px_-10px_rgba(245,158,11,0.4)] hover:border-amber-500/50 group">
                <div className="flex items-center gap-3 mb-5 relative">
                  <div className="absolute -left-6 w-1 h-8 bg-amber-500 rounded-r-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md group-hover:rotate-12 transition-transform duration-500">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Key Achievements</h2>
                </div>
                <div className="grid gap-3">
                  {[
                    'Securing First Position in Quick Quest conducted by ISBM Bangalore',
                    'Winner of 3 Hackathons in various cutting-edge technologies',
                    'Worked on 7+ projects in different fields including Web Development, AI/ML, Blockchain, and Hardware',
                  ].map((achievement, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/5 hover:bg-white/[0.06] hover:border-amber-500/30 transition-all duration-300 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:pl-4">
                      <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                        <span className="text-white text-xs font-black">{index + 1}</span>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed font-medium">{achievement}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Under the Guidance of */}
          <div className="mt-12 mb-8 perspective-1000 relative">
            <div className="absolute inset-0 flex items-center justify-center -z-10 opacity-30 blur-[80px]">
               <div className="w-[300px] h-[100px] bg-purple-600/30 rounded-full" />
            </div>
            
            <h2 className="text-2xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-6 drop-shadow-lg">
              Under the Expert Guidance of
            </h2>
            
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-[0_4px_16px_0_rgba(0,0,0,0.36)] p-6 border border-white/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(168,85,247,0.4)] hover:border-purple-500/50">
              <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-5 p-5 bg-white/[0.03] rounded-xl border border-white/5 hover:bg-white/[0.06] transition-all duration-300 hover:border-purple-500/30 w-full max-w-2xl">
                  <div className="w-28 h-28 rounded-full overflow-hidden border-[4px] border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:scale-105 hover:border-purple-400/60 hover:rotate-3 transition-all duration-500 shrink-0 relative group">
                    <img src="/sir.png" alt="Dr. Abhishek Dixit"
                      className="w-full h-full object-cover"
                      style={{ objectPosition: '50% 15%' }}
                      onError={e => { e.target.style.display='none'; e.target.parentElement.innerHTML='<div class="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black">D</div>'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-xl font-black text-white mb-1.5 tracking-wide drop-shadow-md">Dr. Abhishek Dixit</h3>
                    <p className="text-purple-400 font-bold text-sm mb-2 tracking-wide">Head of Department (HOD) & Assistant Professor</p>
                    <div className="flex items-center justify-center sm:justify-start gap-2 bg-black/20 p-2 rounded-lg border border-white/5 w-fit mx-auto sm:mx-0">
                      <GraduationCap className="w-4 h-4 text-purple-400" />
                      <p className="text-xs text-slate-300 font-medium">Centre for Computer Science & Technology (CST)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      </div>

      <div className="relative z-10 bg-[#03050a] border-t border-white/10">
        <Footer />
      </div>
    </div>
  );
};

export default Developer;
