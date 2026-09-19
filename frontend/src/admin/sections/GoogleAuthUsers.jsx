import React, { useState, useEffect } from 'react';
import { LogIn, Search, CheckCircle, Mail, Clock, RefreshCw, Sparkles, UserCheck } from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';

export default function GoogleAuthUsers() {
  const [googleUsers, setGoogleUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchGoogleUsers();
  }, []);

  async function fetchGoogleUsers() {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/google-users');
      setGoogleUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to load Google Auth users');
    } finally {
      setLoading(false);
    }
  }

  const filtered = googleUsers.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <LogIn className="text-blue-600 dark:text-blue-400" /> Google OAuth User Directory & Session Tracker
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Dedicated view for users logged in via Google Identity Services, showing profile photos, session duration, and login counts.
          </p>
        </div>
        <button 
          onClick={fetchGoogleUsers}
          className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw size={15} /> Refresh List
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search Google Users by name, email, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 animate-pulse">Loading Google OAuth users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Assigned Role</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Login Frequency</th>
                  <th className="px-6 py-4">Session Time Spent</th>
                  <th className="px-6 py-4">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {filtered.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {u.profilePhoto ? (
                          <img src={u.profilePhoto} alt={u.name} className="w-10 h-10 rounded-full object-cover border-2 border-blue-500/40" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                            {u.name?.charAt(0) || 'G'}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                            {u.name}
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                              <CheckCircle size={10} /> Google
                            </span>
                          </div>
                          <div className="text-slate-400 text-xs flex items-center gap-1"><Mail size={12}/> {u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        u.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' :
                        u.role === 'vc' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                        u.role === 'hod' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {u.role || 'faculty'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                      {u.department || 'General Faculty'}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {u.loginCount || 1} logins
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                        <Clock size={12} /> {u.sessionTimeMinutes || 25} mins spent
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Recent'}
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                      No Google OAuth users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
