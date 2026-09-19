import React, { useState, useEffect } from 'react';
import {
  UserCog, Search, Mail, Phone, Award,
  Edit, Trash2, Plus, X, RefreshCw, CheckCircle,
  Ban, PenTool, Eye, EyeOff, BookOpen,
} from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';

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

const EMPTY_FORM = {
  name: '', email: '', password: '', department: '',
  designation: '', phone: '', qualification: '', experience: '',
  status: 'active',
};

export default function HODManagement() {
  const [hods,       setHods]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const [showModal,  setShowModal]  = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [showPwd,    setShowPwd]    = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/users?role=hod');
      setHods(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load HODs');
    } finally {
      setLoading(false);
    }
  }

  const filtered = hods.filter(h => {
    const q = search.toLowerCase();
    const matchSearch =
      h.name?.toLowerCase().includes(q) ||
      h.email?.toLowerCase().includes(q) ||
      h.department?.toLowerCase().includes(q);
    return matchSearch && (deptFilter ? h.department === deptFilter : true);
  });

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditTarget(null);
    setShowPwd(false);
    setShowModal(true);
  }

  function openEdit(h) {
    setForm({
      name: h.name || '', email: h.email || '', password: '',
      department: h.department || '', designation: h.designation || '',
      phone: h.phone || '', qualification: h.qualification || '',
      experience: h.experience || '', status: h.status || 'active',
    });
    setEditTarget(h);
    setShowPwd(false);
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editTarget) {
        const payload = { ...form, role: 'hod' };
        if (!payload.password) delete payload.password;
        await api.patch(`/api/admin/users/${editTarget._id}`, payload);
        toast.success('HOD updated');
      } else {
        if (!form.password) { toast.error('Password is required'); setSaving(false); return; }
        await api.post('/api/admin/users', { ...form, role: 'hod' });
        toast.success('HOD added');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  }

  async function handleDelete(h) {
    if (!window.confirm(`Remove ${h.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/admin/users/${h._id}`);
      toast.success(`${h.name} removed`);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || 'Delete failed'); }
  }

  async function handleToggleStatus(h) {
    const next = h.status === 'active' ? 'suspended' : 'active';
    try {
      await api.patch(`/api/admin/users/${h._id}/status`, { status: next });
      toast.success(`${h.name} ${next === 'active' ? 'activated' : 'suspended'}`);
      fetchData();
    } catch { toast.error('Failed to update status'); }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCog className="text-amber-500" size={24} /> HOD Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Add, edit or remove Heads of Department.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold rounded-xl shadow-sm transition-all">
            <Plus size={15} /> Add HOD
          </button>
          <button onClick={fetchData}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:bg-slate-50 transition-all" title="Refresh">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="text" placeholder="Search by name, email or department…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
          className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none">
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <p className="text-xs text-slate-400 px-1">
        Showing <strong className="text-slate-700 dark:text-slate-300">{filtered.length}</strong> of {hods.length} HODs
      </p>

      {/* Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(h => (
            <div key={h._id}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border shadow-sm space-y-4 hover:shadow-md transition-all
                ${h.status === 'suspended' ? 'border-rose-200 dark:border-rose-900 opacity-75' : 'border-slate-200 dark:border-slate-800'}`}>

              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    {h.profilePhoto ? (
                      <img src={h.profilePhoto} alt={h.name}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-base">
                        {h.name?.charAt(0) || 'H'}
                      </div>
                    )}
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${h.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-[130px]">{h.name}</p>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold truncate max-w-[130px]">{h.department || 'No department'}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">HOD</span>
                  {h.status === 'suspended' && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">SUSPENDED</span>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2"><Mail size={12} className="shrink-0" /><span className="truncate">{h.email}</span></div>
                {(h.designation || h.experience) && (
                  <div className="flex items-center gap-2"><BookOpen size={12} className="shrink-0" /><span className="truncate">{h.designation || '—'}{h.experience ? ` · ${h.experience}` : ''}</span></div>
                )}
                {h.phone && <div className="flex items-center gap-2"><Phone size={12} className="shrink-0" /><span>{h.phone}</span></div>}
                {h.qualification && <div className="flex items-center gap-2"><Award size={12} className="shrink-0" /><span className="truncate">{h.qualification}</span></div>}
              </div>

              {/* Signature */}
              <div className="flex items-center gap-1.5 text-xs">
                <PenTool size={12} className="text-indigo-400" />
                <span className="text-slate-400">Signature:</span>
                {h.signatureStatus === 'verified'
                  ? <span className="font-semibold text-emerald-600 dark:text-emerald-400">✓ Verified</span>
                  : h.signatureImage ? <span className="font-semibold text-amber-600">Uploaded</span>
                  : <span className="text-slate-400">Not uploaded</span>}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <button onClick={() => openEdit(h)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-all">
                  <Edit size={12} /> Edit
                </button>
                <button onClick={() => handleToggleStatus(h)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-all
                    ${h.status === 'active'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 hover:bg-emerald-100'}`}>
                  {h.status === 'active' ? <><Ban size={12} /> Suspend</> : <><CheckCircle size={12} /> Activate</>}
                </button>
                <button onClick={() => handleDelete(h)}
                  className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 transition-all" title="Remove">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && !loading && (
            <div className="col-span-full py-16 text-center text-slate-400">
              <UserCog size={36} className="mx-auto mb-2 opacity-30" />
              No HODs found. Click "Add HOD" to create one.
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSave}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editTarget ? `Edit — ${editTarget.name}` : 'Add New HOD'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={16} /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Full Name *</label>
                <input required type="text" placeholder="Dr. Anita Verma" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Email *</label>
                <input required type="email" placeholder="anita@mitsgwalior.in" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Password {editTarget ? '(blank = keep current)' : '*'}
                </label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} value={form.password}
                    placeholder={editTarget ? 'Leave blank to keep current' : 'Min 6 characters'}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required={!editTarget}
                    className="w-full p-2.5 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Department</label>
                <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm">
                  <option value="">— Select department —</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm">
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Designation</label>
                <input type="text" placeholder="Associate Professor" value={form.designation}
                  onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Phone</label>
                <input type="tel" placeholder="+91 XXXXX XXXXX" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Qualification</label>
                <input type="text" placeholder="PhD, M.Tech" value={form.qualification}
                  onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Experience</label>
                <input type="text" placeholder="10 years" value={form.experience}
                  onChange={e => setForm(f => ({ ...f, experience: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold">Cancel</button>
              <button type="submit" disabled={saving}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-xs font-semibold disabled:opacity-50">
                {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add HOD'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
