import React from 'react';
import { FileText, Download, Sparkles, FileSpreadsheet, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Reports() {
  const reportTypes = [
    { title: 'College-Wide Feedback Summary', desc: 'Comprehensive PDF with ratings, department rankings, and faculty stats.', format: 'PDF / Excel' },
    { title: 'NAAC / NBA Accreditation Audit', desc: 'Formatted report for institutional accreditation & compliance checks.', format: 'PDF / CSV' },
    { title: 'Department Wise Evaluation', desc: 'Granular report breaking down feedback per branch & semester.', format: 'Excel / CSV' },
    { title: 'AI Executive Briefing', desc: 'Auto-generated executive summary with key recommendations for VC & Deans.', format: 'PDF' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="text-indigo-600 dark:text-indigo-400" /> Automated Accreditation & Analytical Reports
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Generate NAAC, NBA, Departmental, and Executive AI summary reports instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reportTypes.map((rep, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold">
                <FileSpreadsheet size={24} />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {rep.format}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{rep.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{rep.desc}</p>
            </div>

            <button 
              onClick={() => toast.success(`Generating ${rep.title}... Download will start shortly.`)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Download size={14} /> Generate & Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
