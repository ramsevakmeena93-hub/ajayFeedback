import React, { useState, useEffect } from 'react';
import { 
  Users, GraduationCap, UserCog, Crown, Shield, Building2, 
  MessageSquare, CheckCircle, TrendingUp, Sparkles, Cpu, Activity, LogIn
} from 'lucide-react';
import api from '../../api';

export default function DashboardOverview({ isDark }) {
  const [stats, setStats] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const [statsRes, metricsRes] = await Promise.all([
        api.get('/api/admin/stats').catch(() => ({ data: {} })),
        api.get('/api/admin/metrics').catch(() => ({ data: {} })),
      ]);
      setStats(statsRes.data || {});
      setMetrics(metricsRes.data || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const roleCounts = {};
  if (stats?.usersByRole) {
    stats.usersByRole.forEach(item => {
      roleCounts[item._id] = item.count;
    });
  }

  const cards = [
    { title: 'Total Users', value: stats?.totalUsers || 0, icon: Users, text: 'text-blue-600 dark:text-blue-400' },
    { title: 'Faculty', value: roleCounts['faculty'] || 0, icon: GraduationCap, text: 'text-emerald-600 dark:text-emerald-400' },
    { title: 'HODs', value: roleCounts['hod'] || 0, icon: UserCog, text: 'text-amber-600 dark:text-amber-400' },
    { title: 'VC / Executive', value: roleCounts['vc'] || 0, icon: Crown, text: 'text-purple-600 dark:text-purple-400' },
    { title: 'Admins', value: roleCounts['admin'] || 0, icon: Shield, text: 'text-red-600 dark:text-red-400' },
    { title: 'Departments', value: stats?.usersByDept?.length || 4, icon: Building2, text: 'text-cyan-600 dark:text-cyan-400' },
    { title: 'Reports Filed', value: stats?.reports || 0, icon: MessageSquare, text: 'text-indigo-600 dark:text-indigo-400' },
    { title: 'Submissions', value: stats?.submissions || 0, icon: CheckCircle, text: 'text-teal-600 dark:text-teal-400' },
  ];

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400 animate-pulse font-medium">
        Loading System Dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-8 shadow-xl border border-indigo-700/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles size={14} className="text-amber-300 animate-pulse" /> AI Feedback Engine Active
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Enterprise Feedback Control Console</h1>
            <p className="text-indigo-200 text-sm mt-1 max-w-2xl">
              Real-time monitoring, dynamic role permissions, automated department workflows, and AI sentiment analysis.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95 flex items-center gap-2">
              <Activity size={16} /> Refresh Metrics
            </button>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{card.title}</span>
                <div className={`p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 ${card.text} group-hover:scale-110 transition-transform`}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{card.value}</span>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <TrendingUp size={12} /> Live
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* System Health & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Cpu className="text-indigo-600 dark:text-indigo-400" size={20} /> System Infrastructure
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600 dark:text-slate-400">Heap Memory Used</span>
                <span className="text-indigo-600 dark:text-indigo-400">{metrics?.memUsed || 0} MB / {metrics?.memTotal || 0} MB</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.round(((metrics?.memUsed || 0) / (metrics?.memTotal || 1)) * 100))}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block">Uptime</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{Math.floor((metrics?.uptime || 0) / 60)} mins</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block">Unresolved Logs</span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">{stats?.unresolvedLogs || 0}</span>
              </div>
            </div>
          </div>
        </div>



      </div>
    </div>
  );
}
