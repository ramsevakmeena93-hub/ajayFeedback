export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-100 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur transition-colors duration-200">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4 flex flex-col items-center justify-center gap-1 text-slate-400 dark:text-slate-500">
        <p className="text-center text-xs">
          © 2026 <span className="font-semibold text-slate-600 dark:text-slate-300">MITS Gwalior</span> · Deemed to be University · Estd. 1957
        </p>
        <p className="text-center text-xs font-medium hidden sm:block">
          A Government Aided Autonomous Institute · Academic Year 2025–26
        </p>
        <p className="text-center text-[10px] opacity-75 mt-1 font-medium tracking-wide">
          Developed under the guidance of Dr. Abhishek Dixit, HOD of Centre for CST
        </p>
      </div>
    </footer>
  );
}
