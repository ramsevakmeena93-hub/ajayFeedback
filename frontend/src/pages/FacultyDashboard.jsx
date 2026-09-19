import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line } from 'recharts';
import { CheckCircle, Clock, ExternalLink, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Award, BookOpen, AlertTriangle, Target, Lightbulb, Users, Archive } from 'lucide-react';

// ── GRADE BADGE ──────────────────────────────────────────────────
function GradeBadge({ grade }) {
  const colors = { 'A+': 'bg-emerald-100 text-emerald-800 border-emerald-300', 'A': 'bg-green-100 text-green-800 border-green-300', 'B+': 'bg-blue-100 text-blue-800 border-blue-300', 'B': 'bg-indigo-100 text-indigo-800 border-indigo-300', 'C+': 'bg-amber-100 text-amber-800 border-amber-300', 'C': 'bg-red-100 text-red-800 border-red-300' };
  return <span className={`text-2xl font-black px-4 py-1 rounded-xl border-2 ${colors[grade] || colors['C']}`}>{grade}</span>;
}

// ── REPORT CARD ──────────────────────────────────────────────────
function ReportCard({ report, onAcknowledge, acknowledging }) {
  const [expanded, setExpanded] = useState(false);
  const approved = report.status === 'faculty_approved';

  return (
    <div className={`card overflow-hidden border-l-4 ${approved ? 'border-l-green-600' : 'border-l-amber-500'}`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={approved ? 'badge-green' : 'badge-gray'}>
                {approved ? '✓ Acknowledged' : '⏳ Pending Review'}
              </span>
              {report.semester && <span className="badge-blue">Sem {report.semester}</span>}
              {report.academicYear && <span className="badge-gray">{report.academicYear}</span>}
              {report.ffiScore != null && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${report.ffiScore >= 4 ? 'bg-green-100 text-green-700' : report.ffiScore >= 3 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                  FFI: {report.ffiScore.toFixed(2)}
                </span>
              )}
              {(report.responseCount ?? report.totalResponses) != null && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  Resp: {report.responseCount ?? report.totalResponses}
                </span>
              )}
            </div>
            <h3 className="font-bold text-slate-800 text-base">{report.facultyName || 'Your Report'}</h3>
            <p className="text-slate-500 text-sm mt-0.5">
              {[report.subjectCode, report.programme].filter(Boolean).join(' · ') || 'No details'}
            </p>
            {report.driveLink && (
              <a href={report.driveLink} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-900 hover:underline mt-2 font-medium">
                <ExternalLink size={12} /> View Original PDF
              </a>
            )}
          </div>
          <div className="flex flex-col gap-2 items-end shrink-0">
            {!approved && (
              <button onClick={() => onAcknowledge(report._id)} disabled={acknowledging === report._id}
                className="btn btn-success btn-sm">
                <CheckCircle size={14} />
                {acknowledging === report._id ? 'Confirming...' : 'I have seen this'}
              </button>
            )}
            {approved && <p className="text-xs text-slate-400">Acknowledged {report.facultyAcknowledgedAt ? new Date(report.facultyAcknowledgedAt).toLocaleDateString('en-IN') : ''}</p>}
            <button onClick={() => setExpanded(e => !e)} className="btn btn-secondary btn-sm">
              {expanded ? <><ChevronUp size={12} />Hide</> : <><ChevronDown size={12} />View Details</>}
            </button>
          </div>
        </div>

        {/* Expanded details — same format as HOD */}
        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-4">
            {/* Comment percentages */}
            {report.commentPercentages && Object.keys(report.commentPercentages).length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-3">Appreciation Breakdown</p>
                <div className="space-y-2">
                  {Object.entries(report.commentPercentages).sort((a, b) => b[1] - a[1]).map(([label, pct]) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-red-700 w-20 shrink-0">{label}</span>
                      <div className="flex-1 bg-red-100 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                      <span className="text-xs font-bold text-red-700 w-10 text-right">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Needs Attention */}
              <div className="rounded-xl border border-amber-200 overflow-hidden">
                <div className="bg-amber-50 px-3 py-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-700">🟡 Comments Needing Attention</span>
                  <span className="badge-yellow">{report.commentsNeedingAttention?.length || 0}</span>
                </div>
                <div className="p-3 space-y-1.5 max-h-48 overflow-y-auto">
                  {!report.commentsNeedingAttention?.length ? (
                    <p className="text-xs text-slate-400 italic">None found</p>
                  ) : report.commentsNeedingAttention.map((t, i) => (
                    <div key={i} className="flex gap-2 text-xs text-slate-700 bg-amber-50 border border-amber-100 rounded px-2 py-1.5">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>{t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Appreciation */}
              <div className="rounded-xl border border-red-200 overflow-hidden">
                <div className="bg-red-50 px-3 py-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-red-700">🔴 Appreciation</span>
                  <span className="badge-red">{report.appreciation?.length || 0}</span>
                </div>
                <div className="p-3 space-y-1.5 max-h-48 overflow-y-auto">
                  {!report.appreciation?.length ? (
                    <p className="text-xs text-slate-400 italic">None found</p>
                  ) : report.appreciation.map((t, i) => (
                    <div key={i} className="flex gap-2 text-xs text-slate-700 bg-red-50 border border-red-100 rounded px-2 py-1.5">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>{t}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* HOD Remarks & Action Taken */}
            {(report.hodRemarks || report.actionTaken) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {report.hodRemarks && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                    <p className="text-xs font-semibold text-blue-700 mb-1">HOD Remarks</p>
                    <p className="text-xs text-slate-700">{report.hodRemarks}</p>
                  </div>
                )}
                {report.actionTaken && (
                  <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                    <p className="text-xs font-semibold text-green-700 mb-1">Action Taken</p>
                    <p className="text-xs text-slate-700">{report.actionTaken}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── ANALYSIS SECTION (COMBINED BASIC & ADVANCED) ─────────────────────────────────────────────
function AnalysisSection({ summary, advancedData }) {
  if (!summary) return null;
  const { avgFFI, grade, totalReports, totalAppreciation, totalAttention, ffiBySubject, commentPercentages } = summary;

  const ffiChartData = ffiBySubject.map(s => ({
    name: s.subject.length > 10 ? s.subject.substring(0, 10) + '...' : s.subject,
    FFI: s.ffi,
    fullName: s.subject
  }));

  const pieData = [
    { name: 'Appreciation', value: totalAppreciation, fill: '#6366f1' }, // Indigo
    { name: 'Needs Attention', value: totalAttention, fill: '#f59e0b' },   // Amber
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* ── 1. Improvement Banner ── */}
      {advancedData?.improvement && (
        <div className={`p-4 rounded-2xl border-l-4 backdrop-blur-md shadow-sm flex items-center justify-between gap-4 flex-wrap transition-all duration-300 ${
          advancedData.improvement.direction === 'up' 
            ? 'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-350 border border-emerald-100 dark:border-emerald-900/40' 
            : advancedData.improvement.direction === 'down' 
            ? 'border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-350 border border-rose-100 dark:border-rose-900/40' 
            : 'border-l-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-350 border border-indigo-100 dark:border-indigo-900/40'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              advancedData.improvement.direction === 'up' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-rose-100 dark:bg-rose-900/30'
            }`}>
              {advancedData.improvement.direction === 'up' ? <TrendingUp size={20} className="text-emerald-600 dark:text-emerald-400"/> : <TrendingDown size={20} className="text-rose-600 dark:text-rose-400"/>}
            </div>
            <div>
              <h4 className="font-bold text-sm tracking-tight text-slate-800 dark:text-slate-100">FFI Improvement Tracker</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {advancedData.improvement.direction === 'up'
                  ? `Your teaching score improved by ${advancedData.improvement.diff} points from ${advancedData.improvement.from} to ${advancedData.improvement.to}!`
                  : advancedData.improvement.direction === 'down'
                  ? `Your teaching score decreased by ${Math.abs(advancedData.improvement.diff)} points from ${advancedData.improvement.from} to ${advancedData.improvement.to}.`
                  : `Your teaching score remained consistent between ${advancedData.improvement.from} and ${advancedData.improvement.to}.`}
              </p>
            </div>
          </div>
          <span className={`text-xl font-black px-3.5 py-1 rounded-xl bg-white dark:bg-slate-900 border shadow-sm ${
            advancedData.improvement.diff > 0 ? 'text-emerald-600 border-emerald-100 dark:border-emerald-900' : advancedData.improvement.diff < 0 ? 'text-rose-600 border-rose-100 dark:border-rose-900' : 'text-slate-400 border-slate-200'
          }`}>
            {advancedData.improvement.diff > 0 ? '+' : ''}{advancedData.improvement.diff}
          </span>
        </div>
      )}

      {/* ── 2. Performance Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Average FFI Score', value: avgFFI, icon: TrendingUp, color: avgFFI >= 4.0 ? 'text-emerald-650 dark:text-emerald-400' : avgFFI >= 3.0 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400', bg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20', border: 'border-emerald-100 dark:border-emerald-900/30' },
          { label: 'Performance Grade', value: <span className="flex items-center justify-center bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl px-3.5 py-0.5 text-lg font-black shadow-sm ring-4 ring-indigo-100 dark:ring-indigo-900/20">{grade}</span>, icon: Award, color: 'text-indigo-600 dark:text-indigo-400', bg: 'from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20', border: 'border-indigo-100 dark:border-indigo-900/30' },
          { label: 'Appreciation Comments', value: totalAppreciation, icon: BookOpen, color: 'text-indigo-600 dark:text-indigo-400', bg: 'from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20', border: 'border-indigo-100 dark:border-indigo-900/30' },
          { label: 'Needs Attention', value: totalAttention, icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-450', bg: 'from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20', border: 'border-amber-100 dark:border-amber-900/30' },
        ].map((card, idx) => (
          <div key={idx} className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group`}>
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{card.label}</span>
              <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center justify-center">
                <card.icon size={15} className={card.color}/>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <div className={`text-2xl font-black tracking-tight ${card.color}`}>{card.value}</div>
            </div>
            {/* Soft background glow */}
            <div className={`absolute -right-6 -bottom-6 w-16 h-16 bg-gradient-to-br ${card.bg} rounded-full blur-xl opacity-80 group-hover:scale-125 transition-transform`}></div>
          </div>
        ))}
      </div>

      {/* ── 3. Visual Analytics Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* FFI Timeline Trend */}
        {advancedData?.trend?.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 hover:shadow-md transition-shadow">
            <h3 className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <span>📈 FFI Timeline & Growth</span>
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={advancedData.trend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="period" tick={{ fontSize: 10 }} stroke="#94a3b8"/>
                <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} stroke="#94a3b8"/>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', border: 'none', borderRadius: '12px', color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '4px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="avgFFI" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 4, strokeWidth: 1 }} activeDot={{ r: 6 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* FFI Score by Subject */}
        {ffiChartData.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 hover:shadow-md transition-shadow">
            <h3 className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <span>🎯 FFI Score by Subject</span>
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ffiChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8"/>
                <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} stroke="#94a3b8"/>
                <Tooltip 
                  formatter={(v, n, p) => [v.toFixed(2), p.payload.fullName]}
                  contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', border: 'none', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="FFI" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {ffiChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.FFI >= 4 ? '#10b981' : entry.FFI >= 3 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── 4. Deeper Benchmarking & Sentiment Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Peer Benchmarking */}
        {advancedData && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest mb-4">
                👥 Anonymous Peer Comparison
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-4 text-center group hover:bg-indigo-50 transition-colors">
                  <p className="text-[10px] text-indigo-650 dark:text-indigo-400 font-bold uppercase mb-1">Your Avg FFI</p>
                  <p className={`text-3xl font-black ${advancedData.myAvgFFI >= advancedData.deptAvgFFI ? 'text-emerald-600' : 'text-amber-500'}`}>{advancedData.myAvgFFI}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/55 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center hover:bg-slate-100/50 transition-colors">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Dept Avg FFI</p>
                  <p className="text-3xl font-black text-slate-600 dark:text-slate-300">{advancedData.deptAvgFFI}</p>
                </div>
              </div>
            </div>
            <div className="mt-5 p-3.5 bg-slate-50 dark:bg-slate-900/35 border border-slate-150 dark:border-slate-800 rounded-xl text-center">
              {advancedData.myAvgFFI >= advancedData.deptAvgFFI ? (
                <p className="text-xs text-emerald-700 dark:text-emerald-450 font-semibold flex items-center justify-center gap-1.5">
                  <CheckCircle size={14}/> Outstanding! You are performing above the department average by {(advancedData.myAvgFFI - advancedData.deptAvgFFI).toFixed(2)} points.
                </p>
              ) : (
                <p className="text-xs text-amber-600 dark:text-amber-450 font-semibold flex items-center justify-center gap-1.5">
                  <AlertTriangle size={14}/> Note: You are currently {(advancedData.deptAvgFFI - advancedData.myAvgFFI).toFixed(2)} points below department average.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Sentiment Pie Distribution */}
        {pieData.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 hover:shadow-md transition-shadow">
            <h3 className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest mb-4">
              📊 Comment Distribution Sentiment
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-around gap-4">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={65} dataKey="value" stroke="none">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [v, 'CommentsCount']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5 w-full sm:w-1/2">
                {pieData.map(item => (
                  <div key={item.name} className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}/>
                      <span className="text-xs font-semibold text-slate-650 dark:text-slate-350">{item.name}</span>
                    </div>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                      {item.value} comments ({Math.round((item.value / (totalAppreciation + totalAttention)) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 5. Teaching Dimensions & Appreciation Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Teaching Weakness Areas */}
        {advancedData?.dimensions && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 hover:shadow-md transition-shadow">
            <h3 className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
              <span>🎯 Teaching Dimension Complaints Tracker</span>
              <span className="text-[10px] text-slate-400 font-medium normal-case tracking-normal">Lower is better</span>
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-4">Tracking complaints matching core student complaint themes</p>
            <div className="space-y-3">
              {Object.entries(advancedData.dimensions).map(([dim, count]) => (
                <div key={dim} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 w-24 shrink-0">{dim}</span>
                  <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-full h-2.5 overflow-hidden">
                    <div className={`h-2.5 rounded-full transition-all ${
                      count === 0 ? 'bg-emerald-500' : count <= 2 ? 'bg-amber-500' : 'bg-rose-500'
                    }`} style={{ width: count === 0 ? '5%' : `${Math.min(count * 20, 100)}%` }}></div>
                  </div>
                  <span className={`text-xs font-black w-8 text-right flex items-center justify-end ${
                    count === 0 ? 'text-emerald-600 dark:text-emerald-400' : count <= 2 ? 'text-amber-500 dark:text-amber-400' : 'text-rose-550 dark:text-rose-400'
                  }`}>
                    {count === 0 ? <CheckCircle size={12}/> : count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Appreciation Breakdown */}
        {Object.keys(commentPercentages).length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest mb-4">
                ⭐ Student Appreciation Quality Breakdown
              </h3>
              <div className="space-y-3.5">
                {Object.entries(commentPercentages).sort((a, b) => b[1] - a[1]).map(([label, pct]) => (
                  <div key={label} className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-650 dark:text-slate-400 w-20 shrink-0">{label}</span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-full h-3 overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-650 to-indigo-500 h-3 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 w-12 text-right">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-550 italic mt-4 text-center">
              Student feedback is categorized using semantic keywords to measure appreciation levels.
            </p>
          </div>
        )}
      </div>

      {/* ── 6. Smart Recommendations ── */}
      {advancedData?.recommendations?.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 hover:shadow-md transition-shadow">
          <h3 className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
            <span>💡 AI-Powered Insights & Recommendations</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {advancedData.recommendations.map((rec, i) => (
              <div key={i} className="flex gap-3.5 items-start bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-855/80 rounded-2xl p-4 hover:shadow-sm transition-all group">
                <span className="text-2xl shrink-0 p-2 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-xl group-hover:scale-105 transition-transform">{rec.icon}</span>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-tight">{rec.title}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-relaxed">{rec.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 7. Career Life Banner ── */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[140px] group">
        <div className="relative z-10">
          <p className="font-extrabold text-lg tracking-tight">Lifetime Career Analytics Summary</p>
          <p className="text-indigo-200 text-xs mt-1 max-w-xl leading-relaxed">
            {avgFFI >= 4.0
              ? `Outstanding teaching track record! Your FFI average of ${avgFFI} reflects exceptional pedagogical delivery and classroom management. Students highly value your methods.`
              : avgFFI >= 3.5
              ? `Solid teaching profile! Your FFI average is ${avgFFI}. Keep refining your classroom examples and pacing to scale new heights of academic excellence.`
              : `A consistent FFI average of ${avgFFI}. Review student suggestions carefully to further strengthen engagement and learning outcomes.`}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center mt-6 pt-4 border-t border-white/10 relative z-10">
          <div>
            <p className="text-2xl font-black text-indigo-300">{advancedData?.totalReports || totalReports}</p>
            <p className="text-white/60 text-[9px] uppercase font-bold tracking-wider mt-0.5">Total Reports</p>
          </div>
          <div>
            <p className="text-2xl font-black text-indigo-300">{advancedData?.trend?.length || 1}</p>
            <p className="text-white/60 text-[9px] uppercase font-bold tracking-wider mt-0.5">Semesters Tracked</p>
          </div>
          <div>
            <p className="text-2xl font-black text-indigo-300">{avgFFI}</p>
            <p className="text-white/60 text-[9px] uppercase font-bold tracking-wider mt-0.5">Lifetime FFI Avg</p>
          </div>
        </div>
        {/* Backdrop visual detail */}
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform"></div>
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-600/10 rounded-full blur-2xl group-hover:scale-125 transition-transform"></div>
      </div>

      <div className="mt-4 flex items-center justify-between text-slate-400 dark:text-slate-500 text-xs">
        <span className="text-xs text-indigo-500 dark:text-indigo-400">Based on {totalReports} report{totalReports > 1 ? 's' : ''}</span>
        <span className="text-slate-300 dark:text-slate-700">·</span>
        <span className="text-xs text-indigo-500 dark:text-indigo-400">{totalAppreciation + totalAttention} total comments analyzed</span>
      </div>
    </div>
  );
}

// ── MAIN DASHBOARD ───────────────────────────────────────────────
export default function FacultyDashboard() {
  const { token, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('reports'); // reports | analysis | records
  const [advancedData, setAdvancedData] = useState(null);
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState(null);
  const [filterYear, setFilterYear] = useState('');
  const [filterSem, setFilterSem] = useState('');
  const [availableYears, setAvailableYears] = useState([]);
  const [availableSems, setAvailableSems] = useState([]);
  const [forceApproveNotif, setForceApproveNotif] = useState(null);

  const api = axios.create({ headers: { Authorization: `Bearer ${token}` } });

  useEffect(() => {
    fetchData();
    fetchNotifications();
  }, [filterYear, filterSem, activeTab]);

  async function fetchNotifications() {
    try {
      const { data } = await api.get('/api/notifications');
      const unreadForceApprove = (data.notifications || []).find(n => n.type === 'hod_force_approved' && !n.read);
      if (unreadForceApprove) {
        setForceApproveNotif(unreadForceApprove);
      }
    } catch {}
  }

  async function handleDismissPopup() {
    if (!forceApproveNotif) return;
    try {
      await api.patch(`/api/notifications/${forceApproveNotif._id}/read`);
      setForceApproveNotif(null);
    } catch {
      setForceApproveNotif(null);
    }
  }

  async function handleViewReport() {
    if (!forceApproveNotif || !forceApproveNotif.reportId) return;
    try {
      const { data } = await api.get(`/api/reports/${forceApproveNotif.reportId}`);
      if (data.driveLink) {
        window.open(data.driveLink, '_blank');
      } else {
        toast.error("Feedback PDF not found for this report.");
      }
    } catch {
      toast.error("Failed to load report details.");
    }
  }

  async function fetchData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterYear) params.append('year', filterYear);
      if (filterSem) params.append('semester', filterSem);

      const { data } = await api.get(`/api/reports/faculty/analysis?${params}`);
      setReports(data.reports || []);
      setSummary(data.summary);
      if (data.summary?.years) setAvailableYears(data.summary.years);
      if (data.summary?.semesters) setAvailableSems(data.summary.semesters);

      // Concurrently load advanced analytics if analysis tab is active
      if (activeTab === 'analysis') {
        const advRes = await api.get('/api/reports/faculty/advanced-analytics');
        setAdvancedData(advRes.data);
      }
    } catch (err) {
      if (err.response?.status === 401) { logout(); return; }
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleAcknowledge(reportId) {
    if (!window.confirm('Confirm that you have read and acknowledged this feedback report?')) return;
    setAcknowledging(reportId);
    try {
      await api.post(`/api/reports/${reportId}/acknowledge`);
      toast.success('Report acknowledged');
      fetchData();
    } catch { toast.error('Failed to acknowledge'); }
    finally { setAcknowledging(null); }
  }

  const pending = reports.filter(r => r.status === 'sent_to_faculty');
  const acknowledged = reports.filter(r => r.status === 'faculty_approved');
  const sortedReports = [...reports].sort((a, b) => {
    if (a.status === 'sent_to_faculty' && b.status !== 'sent_to_faculty') return -1;
    if (a.status !== 'sent_to_faculty' && b.status === 'sent_to_faculty') return 1;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col w-full text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <Navbar title="Faculty Portal" subtitle={user?.department} />

      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="page-title">Welcome, {user?.name}</h1>
            <p className="text-slate-500 text-sm mt-0.5">{user?.department || 'Faculty Member'} · MITS Gwalior</p>
          </div>
          {summary && <GradeBadge grade={summary.grade} />}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Reports', value: reports.length, color: 'text-blue-900 bg-blue-50 border-blue-200' },
            { label: 'Pending', value: pending.length, color: 'text-amber-700 bg-amber-50 border-amber-200' },
            { label: 'Acknowledged', value: acknowledged.length, color: 'text-green-700 bg-green-50 border-green-200' },
            { label: 'Avg FFI', value: summary?.avgFFI || '—', color: 'text-purple-700 bg-purple-50 border-purple-200' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`card p-4 border ${color}`}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="card px-4 py-3 flex flex-wrap gap-3 items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Filter:</span>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="input text-xs py-2 w-36">
            <option value="">All Years</option>
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filterSem} onChange={e => setFilterSem(e.target.value)} className="input text-xs py-2 w-36">
            <option value="">All Semesters</option>
            {availableSems.map(s => <option key={s} value={s}>Semester {s}</option>)}
          </select>
          {(filterYear || filterSem) && (
            <button onClick={() => { setFilterYear(''); setFilterSem(''); }} className="text-xs text-red-500 hover:text-red-700 font-medium">Clear</button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 rounded-xl p-1 w-fit flex-wrap border border-slate-200 dark:border-slate-800">
          {[
            { id: 'reports',  label: pending.length > 0 ? `Reports (${pending.length} Pending)` : `Reports (${reports.length})` },
            { id: 'analysis', label: '📈 Analytics & Insights' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === tab.id ? "bg-white dark:bg-slate-800 shadow text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {loading ? (
          <div className="card p-16 text-center">
            <div className="w-8 h-8 border-4 border-green-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-500 text-sm">Loading...</p>
          </div>
        ) : (
          <>
            {/* REPORTS TAB */}
            {activeTab === 'reports' && (
              <div className="w-full">
                {reports.length === 0 ? (
                  <div className="card p-16 text-center">
                    <div className="text-5xl mb-4">📋</div>
                    <p className="text-slate-500 font-medium">No reports found</p>
                    <p className="text-slate-400 text-sm mt-1">Your HOD will send feedback reports for your review</p>
                  </div>
                ) : (
                  <div className="card overflow-hidden">
                    <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200">
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">⏳ Pending Review — {pending.length} report{pending.length>1?"s":""} need your acknowledgment</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="table-header">
                          <tr>
                            <th className="px-4 py-3 text-left">Faculty Name</th>
                            <th className="px-4 py-3 text-left">Subject Code</th>
                            <th className="px-4 py-3 text-left">Programme</th>
                            <th className="px-4 py-3 text-center">Sem</th>
                            <th className="px-4 py-3 text-center">Year</th>
                            <th className="px-4 py-3 text-center">FFI</th>
                            <th className="px-4 py-3 text-center">Resp.</th>
                            <th className="px-4 py-3 text-left">Appreciation</th>
                            <th className="px-4 py-3 text-left">Needs Attention</th>
                            <th className="px-4 py-3 text-left">HOD Remarks</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sortedReports.map((report, idx) => {
                            const approved = report.status === 'faculty_approved';
                            const pcts = report.commentPercentages || {};
                            const pctEntries = Object.entries(pcts).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
                            const longApp = (report.appreciation||[]).filter(c=>c.trim().split(/\s+/).length>4);
                            return (
                              <tr key={report._id} className={`hover:bg-slate-50 align-top transition-colors ${!approved ? 'bg-amber-50/30' : ''}`}>
                                <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                                  {report.facultyName || '—'}
                                  {report.driveLink && (
                                    <a href={report.driveLink} target="_blank" rel="noopener noreferrer"
                                      className="block text-xs text-indigo-600 hover:underline mt-0.5 flex items-center gap-1">
                                      <ExternalLink size={10}/> View PDF
                                    </a>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-xs font-mono text-slate-600 whitespace-nowrap">{report.subjectCode||'—'}</td>
                                <td className="px-4 py-3 text-xs text-slate-600">{report.programme||'—'}</td>
                                <td className="px-4 py-3 text-center text-xs">{report.semester||'—'}</td>
                                <td className="px-4 py-3 text-center text-xs">{report.academicYear||'—'}</td>
                                <td className="px-4 py-3 text-center">
                                  {report.ffiScore!=null
                                    ? <span className={`text-sm font-bold ${report.ffiScore>=4?'text-emerald-600':report.ffiScore>=3?'text-amber-600':'text-red-600'}`}>{report.ffiScore.toFixed(2)}</span>
                                    : <span className="text-slate-300">—</span>}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="text-xs font-semibold text-slate-600">{report.responseCount ?? report.totalResponses ?? '—'}</span>
                                </td>
                                <td className="px-4 py-3 max-w-[160px]">
                                  <div className="space-y-0.5">
                                    {pctEntries.map(([label,pct])=>(
                                      <span key={label} className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded px-1.5 py-0.5 inline-block mr-1">{label} {pct}%</span>
                                    ))}
                                    {longApp.slice(0,1).map((c,i)=>(
                                      <div key={i} className="text-xs text-emerald-800 leading-snug mt-0.5">{c}</div>
                                    ))}
                                    {pctEntries.length===0&&longApp.length===0&&<span className="text-slate-300 text-xs">None</span>}
                                  </div>
                                </td>
                                <td className="px-4 py-3 max-w-[180px]">
                                  {(report.commentsNeedingAttention||[]).length>0
                                    ? <div className="space-y-1">{(report.commentsNeedingAttention||[]).slice(0,2).map((c,i)=>(
                                        <div key={i} className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded px-2 py-0.5 leading-snug">{c}</div>
                                      ))}</div>
                                    : <span className="text-slate-300 text-xs">None</span>}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-600 max-w-[140px]">
                                  {report.hodRemarks||<span className="text-slate-300">—</span>}
                                </td>
                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                  {approved
                                    ? <span className="badge-emerald flex items-center gap-1 justify-center"><CheckCircle size={10}/>Approved</span>
                                    : <span className="badge-amber flex items-center gap-1 justify-center"><Clock size={10}/>Pending</span>}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {approved ? (
                                    <p className="text-xs text-slate-400">
                                      {report.facultyAcknowledgedAt ? new Date(report.facultyAcknowledgedAt).toLocaleDateString('en-IN') : 'Done'}
                                    </p>
                                  ) : (
                                    <button onClick={() => handleAcknowledge(report._id)} disabled={acknowledging === report._id}
                                      className="btn btn-success btn-sm whitespace-nowrap px-3 text-xs flex items-center justify-center gap-1 mx-auto">
                                      <CheckCircle size={12} /> {acknowledging === report._id ? '...' : 'Approve'}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ANALYSIS TAB */}
            {activeTab === 'analysis' && (
              reports.length === 0 ? (
                <div className="card p-16 text-center">
                  <div className="text-5xl mb-4">📊</div>
                  <p className="text-slate-500 font-medium">No data to analyze</p>
                  <p className="text-slate-400 text-sm mt-1">Analysis will appear once reports are available</p>
                </div>
              ) : !advancedData ? (
                <div className="card p-16 text-center">
                  <div className="w-8 h-8 border-4 border-indigo-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-slate-500 text-sm">Loading Analytics & Insights...</p>
                </div>
              ) : (
                <AnalysisSection summary={summary} advancedData={advancedData} />
              )
            )}

          </>
        )}
      </div>
      {/* Alert popup for HOD force-approving a report */}
      {forceApproveNotif && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6 relative border border-slate-100 dark:border-slate-800 animate-scale-in text-slate-800 dark:text-slate-100">
            {/* Close/Skip cross sign button */}
            <button onClick={handleDismissPopup} className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/30 rounded-xl flex items-center justify-center border border-amber-250 dark:border-amber-800">
                <svg className="w-5 h-5 text-amber-650 dark:text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">HOD Approved Report Alert</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Attention required</p>
              </div>
            </div>

            <p className="text-sm text-slate-650 dark:text-slate-350 leading-relaxed mb-5">
              {forceApproveNotif.message}
            </p>

            <div className="flex gap-2 justify-end">
              <button onClick={handleDismissPopup} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors">
                Skip
              </button>
              {forceApproveNotif.reportId && (
                <button onClick={handleViewReport} className="px-4 py-2 bg-indigo-650 hover:bg-indigo-755 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                  View Report
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
