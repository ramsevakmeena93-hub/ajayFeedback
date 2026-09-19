import React, { useState, useEffect } from 'react';
import { Building2, Plus, Users, UserCheck, Trash2, Edit, CheckCircle } from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newDeptName, setNewDeptName] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchDepts();
  }, []);

  async function fetchDepts() {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/departments');
      setDepartments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateDept(e) {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    try {
      await api.post('/api/admin/departments', { name: newDeptName });
      toast.success(`Department '${newDeptName}' created successfully`);
      setNewDeptName('');
      setShowModal(false);
      fetchDepts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create department');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="text-indigo-600 dark:text-indigo-400" /> Department Directory & Structure
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create departments, allocate HOD leadership, and monitor faculty distribution across branches.
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md flex items-center gap-2"
        >
          <Plus size={16} /> Add Department
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {departments.map((d, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold">
                <Building2 size={24} />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {d.totalUsers} Total Users
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{d.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Head of Dept: <strong className="text-slate-700 dark:text-slate-200">{d.hod ? d.hod.name : 'Unassigned'}</strong>
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Users size={14} /> {d.facultyCount} Faculty Members
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle size={12} /> Active
              </span>
            </div>
          </div>
        ))}

        {departments.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center text-slate-400">
            No departments defined yet. Click "Add Department" to get started.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateDept} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Department</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Department Name</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Information Technology" 
                value={newDeptName} 
                onChange={e => setNewDeptName(e.target.value)} 
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" 
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold">
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
