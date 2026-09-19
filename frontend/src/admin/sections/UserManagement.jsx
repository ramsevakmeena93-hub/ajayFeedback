import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, Mail, Shield, Building2,
  Edit, Trash2, Ban, CheckCircle, Plus, RefreshCw,
  Clock, LogIn, LogOut, Wifi, WifiOff, UserCheck,
  Globe, GraduationCap, UserCog, LayoutDashboard,
  X, Eye, EyeOff,
} from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(date) {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function timeAgo(date) {
  if (!date) return '—';
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const ROLE_STYLE = {
  admin:   { bg: 'bg-rose-100 dark:bg-rose-950',    text: 'text-rose-700 dark:text-rose-300',     icon: LayoutDashboard },
  vc:      { bg: 'bg-violet-100 dark:bg-violet-950', text: 'text-violet-700 dark:text-violet-300', icon: Shield },
  hod:     { bg: 'bg-amber-100 dark:bg-amber-950',  text: 'text-amber-700 dark:text-amber-300',   icon: UserCog },
  faculty: { bg: 'bg-emerald-100 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-300', icon: GraduationCap },
};

const DEPARTMENTS = [
  'Centre for Computer Science and Technology',
  'School of Information Technology',
  'Centre for Artificial Intelligence',
  'Centre for Internet of Things',
  'Computer Science and Design',
  'School of Electronics and Communication Engineering',
  'School of Electrical Engineering',
  'School of Mechanical Engineering',
  'School of Civil Engineering',
  'School of Chemical Engineering',
  'School of Engineering Mathematics & Computing',
  'School of Humanities and Management',
  'School of Architecture',
  'MBA', 'MCA', 'Other',
];

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color, bg, sub }) {
  return (
    <div className={`${bg} rounded-2xl p-5 border border-white/10 dark:border-slate-800 flex items-center gap-4 shadow-sm`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} bg-white/20 dark:bg-slate-800/60 shrink-0`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{value}</p>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function UserManagement() {
  const [users,   setUsers]   = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [roleFilter,   setRoleFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [onlineFilter, setOnlineFilter] = useState(false);

  // Modals
  const [editUser,        setEditUser]        = useState(null);
  const [showEditModal,   setShowEditModal]    = useState(false);
  const [showCreateModal, setShowCreateModal]  = useState(false);
  const [showDetailModal, setShowDetailModal]  = useState(null);
  const [showPwd,         setShowPwd]          = useState(false);

  const [editForm, setEditForm] = useState({ role: '', department: '', status: '' });
  const [createForm, setCreateForm] = useState({
    name: '', email: '', password: '', role: 'faculty', department: '', phone: '', designation: '',
  });

  // ── fetch ───────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.get(`/api/admin/users?${roleFilter ? `role=${roleFilter}&` : ''}${statusFilter ? `status=${statusFilter}&` : ''}withRoles=true`),
        api.get('/api/admin/users/stats'),
      ]);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setStats(statsRes.data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-refresh online status every 30s
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const { data } = await api.get('/api/admin/users/stats');
        setStats(data);
        // Refresh online flags on user rows without full reload
        const { data: freshUsers } = await api.get(
          `/api/admin/users?${roleFilter ? `role=${roleFilter}&` : ''}${statusFilter ? `status=${statusFilter}&` : ''}withRoles=true`
        );
        setUsers(Array.isArray(freshUsers) ? freshUsers : []);
      } catch {}
    }, 30000);
    return () => clearInterval(id);
  }, [roleFilter, statusFilter]);

  // ── filtered rows ────────────────────────────────────────────────────────────

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch =
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.department?.toLowerCase().includes(q);
    const matchOnline = onlineFilter ? u.isOnline : true;
    return matchSearch && matchOnline;
  });

  // ── actions ──────────────────────────────────────────────────────────────────

  async function toggleStatus(u) {
    const next = u.status === 'active' ? 'suspended' : 'active';
    try {
      await api.patch(`/api/admin/users/${u._id}/status`, { status: next });
      toast.success(`User ${next === 'active' ? 'activated' : 'suspended'}`);
      fetchAll();
    } catch { toast.error('Failed to update status'); }
  }

  async function deleteUser(u) {
    if (!window.confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/admin/users/${u._id}`);
      toast.success('User deleted');
      fetchAll();
    } catch { toast.error('Failed to delete'); }
  }

  async function saveEdit() {
    try {
      await api.patch(`/api/admin/users/${editUser._id}`, {
        role:       editForm.role       || editUser.role,
        department: editForm.department !== undefined ? editForm.department : editUser.department,
        status:     editForm.status     || editUser.status,
      });
      toast.success('User updated');
      setShowEditModal(false);
      fetchAll();
    } catch { toast.error('Failed to update'); }
  }

  async function createUser(e) {
    e.preventDefault();
    try {
      await api.post('/api/admin/users', createForm);
      toast.success('User created!');
      setShowCreateModal(false);
      setCreateForm({ name: '', email: '', password: '', role: 'faculty', department: '', phone: '', designation: '' });
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create'); }
  }

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="text-indigo-500" size={24} />
            User Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time user directory with online status, session times, roles and departments.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAll}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all" title="Refresh">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* ── Stats cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Users}     label="Total Users"       value={stats?.total           ?? '—'} color="text-indigo-600 dark:text-indigo-400"  bg="bg-indigo-50 dark:bg-indigo-950/40"  sub="all registered accounts" />
        <StatCard icon={UserCheck} label="Active Accounts"   value={stats?.active          ?? '—'} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-950/40" sub="not suspended" />
        <StatCard icon={Clock}     label="Time Spent Today"  value={stats?.totalTimeToday  ?? '—'} color="text-violet-600 dark:text-violet-400"   bg="bg-violet-50 dark:bg-violet-950/40"  sub={`across ${stats?.activeSessionsToday ?? 0} sessions today`} />
        <StatCard icon={Wifi}      label="Online Right Now"  value={stats?.online          ?? '—'} color="text-sky-600 dark:text-sky-400"         bg="bg-sky-50 dark:bg-sky-950/40"        sub={`${stats?.offline ?? 0} currently offline`} />
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, email or department…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none">
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="vc">VC</option>
            <option value="hod">HOD</option>
            <option value="faculty">Faculty</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 select-none">
            <input type="checkbox" checked={onlineFilter} onChange={e => setOnlineFilter(e.target.checked)}
              className="rounded text-indigo-600" />
            Online only
          </label>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Loading users…</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Login / Leave</th>
                  <th className="px-5 py-3.5">Logins</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filtered.map(u => {
                  const rs = ROLE_STYLE[u.role] || ROLE_STYLE.faculty;
                  const RIcon = rs.icon;
                  const isOnline = !!u.isOnline;

                  return (
                    <tr key={u._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => setShowDetailModal(u)}>
                      {/* User cell */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {/* Avatar with online dot */}
                          <div className="relative shrink-0">
                            {u.profilePhoto ? (
                              <img src={u.profilePhoto} alt={u.name}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700" />
                            ) : (
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                                ${u.googleId ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                             : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'}`}>
                                {u.name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                            )}
                            {/* Online / offline dot */}
                            <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} title={isOnline ? 'Online' : 'Offline'} />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-900 dark:text-white text-sm truncate max-w-[140px]">
                                {u.name}
                              </span>
                              {(u.googleVerified || u.googleId) && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                                  <Globe size={8} /> Google
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-slate-400 text-[11px] mt-0.5">
                              <Mail size={10} /> {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${rs.bg} ${rs.text}`}>
                          <RIcon size={10} /> {u.role}
                        </span>
                        {/* Multi-role badges */}
                        {u.roleDetails?.length > 1 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {u.roleDetails.filter(r => r.role !== u.role).map(r => (
                              <span key={r._id || r.role} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                +{r.role}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Department */}
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <Building2 size={11} className="shrink-0" />
                          <span className="truncate max-w-[160px]">{u.department || <span className="italic text-slate-400">Not set</span>}</span>
                        </span>
                      </td>

      {/* Status */}
                      <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                        {u.status === 'suspended' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400">
                            <Ban size={9} /> Suspended
                          </span>
                        ) : isOnline ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Offline
                          </span>
                        )}
                      </td>

                      {/* Login / Leave time */}
                      <td className="px-5 py-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <LogIn size={10} className="shrink-0" />
                            <span className="text-[11px] font-medium">
                              {u.currentLoginAt ? timeAgo(u.currentLoginAt) : (u.lastLogin ? fmt(u.lastLogin).split(',')[0] : '—')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-rose-500 dark:text-rose-400">
                            <LogOut size={10} className="shrink-0" />
                            <span className="text-[11px]">
                              {isOnline ? <span className="text-emerald-500 font-semibold">Active now</span> : (u.lastLeaveAt ? timeAgo(u.lastLeaveAt) : '—')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Login count */}
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-slate-900 dark:text-white">{u.loginCount || 1}</span>
                        <span className="text-slate-400 ml-1">visits</span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => toggleStatus(u)}
                            className={`p-1.5 rounded-lg transition-colors ${u.status === 'active' ? 'hover:bg-amber-50 dark:hover:bg-amber-950 text-amber-600' : 'hover:bg-emerald-50 dark:hover:bg-emerald-950 text-emerald-600'}`}
                            title={u.status === 'active' ? 'Suspend' : 'Activate'}>
                            <Ban size={14} />
                          </button>
                          <button
                            onClick={() => deleteUser(u)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 transition-colors" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-slate-400">
                      <Users size={32} className="mx-auto mb-2 opacity-30" />
                      No users match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── User Detail Modal (click row) ─────────────────────────────────── */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDetailModal(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">User Details</h3>
              <button onClick={() => setShowDetailModal(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={16} /></button>
            </div>

            {/* Avatar + name */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div className="relative shrink-0">
                {showDetailModal.profilePhoto ? (
                  <img src={showDetailModal.profilePhoto} alt={showDetailModal.name} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-400/30" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-black text-2xl">
                    {showDetailModal.name?.charAt(0) || 'U'}
                  </div>
                )}
                <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${showDetailModal.isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-base">{showDetailModal.name}</p>
                <p className="text-slate-500 text-xs mt-0.5">{showDetailModal.email}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {(() => { const rs = ROLE_STYLE[showDetailModal.role] || ROLE_STYLE.faculty; const RI = rs.icon; return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${rs.bg} ${rs.text}`}><RI size={9}/>{showDetailModal.role}</span>
                  ); })()}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${showDetailModal.isOnline ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                    {showDetailModal.isOnline ? <><Wifi size={9}/>Online</> : <><WifiOff size={9}/>Offline</>}
                  </span>
                  {(showDetailModal.googleVerified || showDetailModal.googleId) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      <Globe size={9}/> Google Auth
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Detail rows */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { label: 'Department',   value: showDetailModal.department || 'Not set',         icon: Building2 },
                { label: 'Designation',  value: showDetailModal.designation || '—',              icon: UserCog },
                { label: 'Phone',        value: showDetailModal.phone || '—',                    icon: Mail },
                { label: 'Total Logins', value: `${showDetailModal.loginCount || 1} times`,      icon: LogIn },
                { label: 'Logged In At', value: fmt(showDetailModal.currentLoginAt || showDetailModal.lastLogin), icon: LogIn },
                { label: 'Last Seen',    value: showDetailModal.isOnline ? 'Active now' : fmt(showDetailModal.lastLeaveAt || showDetailModal.lastSeen), icon: Clock },
                { label: 'Joined',       value: fmt(showDetailModal.createdAt),                  icon: CheckCircle },
                { label: 'Status',       value: showDetailModal.status || 'active',              icon: Shield },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Icon size={10} /><span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white text-xs truncate">{value}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => { setEditUser(showDetailModal); setEditForm({ role: showDetailModal.role, department: showDetailModal.department || '', status: showDetailModal.status || 'active' }); setShowDetailModal(null); setShowEditModal(true); }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5">
                <Edit size={13}/> Edit User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ────────────────────────────────────────────────────── */}
      {showEditModal && editUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit User</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={16}/></button>
            </div>
            <p className="text-xs text-slate-500">Editing <strong className="text-slate-800 dark:text-slate-200">{editUser.name}</strong> ({editUser.email})</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Role</label>
                <select value={editForm.role} onChange={e => setEditForm(f => ({...f, role: e.target.value}))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm">
                  <option value="faculty">Faculty</option>
                  <option value="hod">HOD</option>
                  <option value="vc">VC</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Department</label>
                <select value={editForm.department} onChange={e => setEditForm(f => ({...f, department: e.target.value}))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm">
                  <option value="">— None —</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Account Status</label>
                <select value={editForm.status} onChange={e => setEditForm(f => ({...f, status: e.target.value}))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm">
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold">Cancel</button>
              <button onClick={saveEdit} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Modal ──────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={createUser} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New User</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={16}/></button>
            </div>

            <div className="space-y-3">
              {[
                { key: 'name',        label: 'Full Name',      type: 'text',  placeholder: 'Dr. Ravi Kumar' },
                { key: 'email',       label: 'Email',          type: 'email', placeholder: 'ravi@mitsgwalior.in' },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{label}</label>
                  <input required type={type} placeholder={placeholder} value={createForm[key]}
                    onChange={e => setCreateForm(f => ({...f, [key]: e.target.value}))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                </div>
              ))}

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Password</label>
                <div className="relative">
                  <input required type={showPwd ? 'text' : 'password'} placeholder="Min 6 characters"
                    value={createForm.password} onChange={e => setCreateForm(f => ({...f, password: e.target.value}))}
                    className="w-full p-2.5 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPwd ? <EyeOff size={14}/> : <Eye size={14}/>}</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Role</label>
                  <select value={createForm.role} onChange={e => setCreateForm(f => ({...f, role: e.target.value}))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm">
                    <option value="faculty">Faculty</option>
                    <option value="hod">HOD</option>
                    <option value="vc">VC</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Designation</label>
                  <input type="text" placeholder="Asst. Professor" value={createForm.designation}
                    onChange={e => setCreateForm(f => ({...f, designation: e.target.value}))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Department</label>
                <select value={createForm.department} onChange={e => setCreateForm(f => ({...f, department: e.target.value}))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm">
                  <option value="">— Select department —</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold">Create User</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
