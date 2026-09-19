import React from 'react';
import { BarChart3, TrendingUp, Sparkles, AlertCircle, Award } from 'lucide-react';

export default function Analytics() {
  const deptPerformance = [
    { name: 'Computer Science', score: 4.8, count: 320 },
    { name: 'Electrical Eng.', score: 4.5, count: 210 },
    { name: 'Mechanical Eng.', score: 4.3, count: 180 },
    { name: 'Civil Eng.', score: 4.1, count: 150 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="text-indigo-600 dark:text-indigo-400" /> Live Analytics & AI Insights Engine
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Departmental rating breakdowns, predictive analytics, performance trends, and risk detection.
        </p>
      </div>

      {/* AI Risk & Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 border border-indigo-700/40 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
            <Sparkles size={18} /> AI Sentiment Prediction
          </div>
          <p className="text-xs text-indigo-200">
            Overall student feedback satisfaction is predicted to increase by <strong>+4.2%</strong> this semester based on positive trends in CSE and EE.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Top Performing Department</span>
            <Award className="text-amber-500" size={16} />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">Computer Science</div>
          <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp size={12}/> 4.8 / 5.0 Average Rating
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Risk Detection</span>
            <AlertCircle className="text-amber-500" size={16} />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">0 High-Risk Modules</div>
          <div className="text-xs text-slate-400">All departments operating within quality parameters.</div>
        </div>
      </div>

      {/* Department Breakdown Bar Visualization */}
      <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Department Satisfaction Index</h2>
        <div className="space-y-4">
          {deptPerformance.map((dept, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-800 dark:text-slate-200">{dept.name}</span>
                <span className="text-indigo-600 dark:text-indigo-400">{dept.score} / 5.0 ({dept.count} responses)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${(dept.score / 5.0) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
