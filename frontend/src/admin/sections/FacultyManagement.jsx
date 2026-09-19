import React, { useState, useEffect } from 'react';
import {
  GraduationCap, Search, Mail, BookOpen, PenTool,
  Edit, Trash2, Plus, X, RefreshCw, Building2,
  Phone, Award, CheckCircle, Ban, Eye, EyeOff,
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
  role: 'faculty', status: 'active',
};

export default function FacultyManagement() {
  const [faculty,  setFaculty]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Modals
  const [showAdd,    setShowAdd]    = useState(false);
  const [editTarget, setEditTarget] = useState(null); // user obj for edit
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [showPwd,    setShowPwd]    = useState(false);

  useEffect(() => { fetchFaculty(); }, []);

  // ── Fetch: faculty + HODs (HODs can also be faculty) ──────────────────────
  async function fetchFaculty() {
    setLoading(true);
    try {
      const [facRes, hodRes] = await Promise.all([
        api.get('/api/admin/users?role=faculty'),
        api.get('/api/admin/users?role=hod'),
      ]);
      const facList = Array.isArray(facRes.data) ? facRes.data : [];
      const hodList = Array.isArray(hodRes.data) ? hodRes.data : [];

      // Merge: HODs who also have faculty role, mark them
      const hodIds = new Set(hodList.map(h => h._id));
      const combined = [
        ...facList.map(f => ({ ...f, _isHOD: hodIds.has(f._id) })),
        // HODs not already in faculty list
        ...hodList
          .filter(h => !facList.find(f => f._id === h._id))
          .map(h => ({ ...h, _isHOD: true })),
      ];
      setFaculty(combined);
    } catch {
      toast.error('Failed to load faculty list');
    } finally {
      setLoading(false);
    }
  }

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = faculty.filter(f => {
    const q = search.toLowerCase();
    const matchSearch =
      f.name?.toLowerCase().includes(q) ||
      f.email?.toLowerCase().includes(q) ||
      f.department?.toLowerCase().includes(q);
    const matchDept = deptFilter ? f.department === deptFilter : true;
    return matchSearch && matchDept;
  });

  // ── Open Add modal ────────────────────────────────────────────────────────
  function openAdd() {
    setForm(EMPTY_FORM);
    setShowPwd(false);
    setEditTarget(null);
    setShowAdd(true);
  }

  // ── Open Edit modal ───────────────────────────────────────────────────────
  function openEdit(f) {
    setForm({
      name:          f.name         || '',
      email:         f.email        || '',
      password:      '',                    // blank = don't change
      department:    f.department   || '',
      designation:   f.designation  || '',
      phone:         f.phone        || '',
      qualification: f.qualification|| '',
      experience:    f.experience   || '',
      role:          f.role         || 'faculty',
      status:        f.status       || 'active',
    });
    setEditTarget(f);
    setShowPwd(false);
    setShowAdd(true);
  }

  // ── Save (create or update) ───────────────────────────────────────────────
  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editTarget) {
        // Update — only send changed fields
        const payload = { ...form };
        if (!payload.password) delete payload.password; // don't reset if blank
        await api.patch(`/api/admin/users/${editTarget._id}`, payload);
        toast.success('Faculty updated successfully');
      } else {
        // Create
        if (!form.password) { toast.error('Password is required'); setSaving(false); return; }
        await api.post('/api/admin/users', form);
        toast.success('Faculty member added successfully');
      }
      setShowAdd(false);
      fetchFaculty();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete(f) {
    if (!window.confirm(`Remove ${f.name} from the system? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/admin/users/${f._id}`);
      toast.success(`${f.name} removed`);
      fetchFaculty();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  }

  // ── Toggle suspend ────────────────────────────────────────────────────────
  async function handleToggleStatus(f) {
    const next = f.status === 'active' ? 'suspended' : 'active';
    try {
      await api.patch(`/api/admin/users/${f._id}/status`, { status: next });
      toast.success(`${f.name} ${next === 'active' ? 'activated' : 'suspended'}`);
      fetchFaculty();
    } catch {
      toast.error('Failed to update status');
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="text-indigo-500" size={24} />
            Faculty Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            All faculty members including HODs who teach. Add, edit or remove faculty accounts.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-sm transition-all">
            <Plus size={15} /> Add Faculty
          </button>
          <button
            onClick={fetchFaculty}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all" title="Refresh">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row gap-3">
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
        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none">
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Count */}
      <p className="text-xs text-slate-400 px-1">
        Showing <strong className="text-slate-700 dark:text-slate-300">{filtered.length}</strong> of {faculty.length} faculty members
      </p>

      {/* Cards grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(f => (
            <div key={f._id}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border shadow-sm space-y-4 transition-all hover:shadow-md
                ${f.status === 'suspended'
                  ? 'border-rose-200 dark:border-rose-900 opacity-75'
                  : 'border-slate-200 dark:border-slate-800'}`}>

              {/* Top row — avatar + name + badges */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Avatar with online dot */}
                  <div className="relative shrink-0">
                    {f.profilePhoto ? (
                      <img src={f.profilePhoto} alt={f.name}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-base">
                        {f.name?.charAt(0) || 'F'}
                      </div>
                    )}
                    {/* Online dot */}
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900
                      ${f.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  </div>

                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-[130px]">{f.name}</p>
                    <p className="text-[11px] text-slate-400 truncate max-w-[130px]">{f.department || 'No department'}</p>
                  </div>
                </div>

                {/* Role badges */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    FACULTY
                  </span>
                  {f._isHOD && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                      HOD
                    </span>
                  )}
                  {f.status === 'suspended' && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                      SUSPENDED
                    </span>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Mail size={12} className="shrink-0" />
                  <span className="truncate">{f.email}</span>
                </div>
                {(f.designation || f.experience) && (
                  <div className="flex items-center gap-2">
                    <BookOpen size={12} className="shrink-0" />
                    <span className="truncate">{f.designation || '—'}{f.experience ? ` · ${f.experience}` : ''}</span>
                  </div>
                )}
                {f.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="shrink-0" />
                    <span>{f.phone}</span>
                  </div>
                )}
                {f.qualification && (
                  <div className="flex items-center gap-2">
                    <Award size={12} className="shrink-0" />
                    <span className="truncate">{f.qualification}</span>
                  </div>
                )}
              </div>

              {/* Signature status */}
              <div className="flex items-center gap-1.5 text-xs">
                <PenTool size={12} className="text-indigo-400" />
                <span className="text-slate-400">Signature:</span>
                {f.signatureStatus === 'verified'
                  ? <span className="font-semibold text-emerald-600 dark:text-emerald-400">✓ Verified</span>
                  : f.signatureImage
                    ? <span className="font-semibold text-amber-600">Uploaded</span>
                    : <span className="text-slate-400">Not uploaded</span>}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => openEdit(f)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all">
                  <Edit size={12} /> Edit
                </button>
                <button
                  onClick={() => handleToggleStatus(f)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-all
                    ${f.status === 'active'
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'}`}>
                  {f.status === 'active'
                    ? <><Ban size={12} /> Suspend</>
                    : <><CheckCircle size={12} /> Activate</>}
                </button>
                <button
                  onClick={() => handleDelete(f)}
                  className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 transition-all" title="Remove">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && !loading && (
            <div className="col-span-full py-16 text-center text-slate-400">
              <GraduationCap size={36} className="mx-auto mb-2 opacity-30" />
              No faculty members found.
            </div>
          )}
        </div>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editTarget ? `Edit — ${editTarget.name}` : 'Add New Faculty'}
              </h3>
              <button type="button" onClick={() => setShowAdd(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X size={16} />
              </button>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-2 gap-3">

              {/* Name */}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Full Name *</label>
                <input required type="text" placeholder="Dr. Ravi Kumar"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
              </div>

              {/* Email */}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Email *</label>
                <input required type="email" placeholder="ravi@mitsgwalior.in"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
              </div>

              {/* Password */}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Password {editTarget ? '(leave blank to keep current)' : '*'}
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder={editTarget ? 'Leave blank to keep current' : 'Min 6 characters'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required={!editTarget}
                    className="w-full p-2.5 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Role</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm">
                  <option value="faculty">Faculty</option>
                  <option value="hod">HOD</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm">
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              {/* Department */}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Department</label>
                <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm">
                  <option value="">— Select department —</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Designation */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Designation</label>
                <input type="text" placeholder="Asst. Professor"
                  value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Phone</label>
                <input type="tel" placeholder="+91 XXXXX XXXXX"
                  value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
              </div>

              {/* Qualification */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Qualification</label>
                <input type="text" placeholder="PhD, M.Tech"
                  value={form.qualification} onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
              </div>

              {/* Experience */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Experience</label>
                <input type="text" placeholder="5 years"
                  value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setShowAdd(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50">
                {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Faculty'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
