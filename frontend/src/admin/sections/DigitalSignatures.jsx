import React, { useState, useEffect } from 'react';
import { PenTool, CheckCircle, XCircle, Search, ZoomIn, Plus, Trash2, Edit, Upload } from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';

export default function DigitalSignatures() {
  const [signatures, setSignatures] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewUser, setPreviewUser] = useState(null);
  
  // Add signature modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [signatureInput, setSignatureInput] = useState('');

  useEffect(() => {
    fetchSignatures();
    fetchUsers();
  }, []);

  async function fetchSignatures() {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/signatures');
      setSignatures(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to load digital signatures');
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const res = await api.get('/api/admin/users');
      setAllUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleStatusChange(userId, status) {
    try {
      await api.patch(`/api/admin/signatures/${userId}/status`, { status });
      toast.success(`Signature marked as ${status.toUpperCase()}`);
      fetchSignatures();
      if (previewUser?._id === userId) setPreviewUser(null);
    } catch (err) {
      toast.error('Failed to update signature status');
    }
  }

  async function handleDeleteSignature(userId) {
    if (!window.confirm('Delete this user signature?')) return;
    try {
      await api.delete(`/api/admin/signatures/${userId}`);
      toast.success('Signature deleted');
      fetchSignatures();
    } catch (err) {
      toast.error('Failed to delete signature');
    }
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setSignatureInput(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSaveNewSignature(e) {
    e.preventDefault();
    if (!selectedUserId || !signatureInput) {
      toast.error('Please select a user and upload/paste a signature');
      return;
    }
    try {
      await api.post('/api/admin/signatures', {
        userId: selectedUserId,
        signatureImage: signatureInput,
        status: 'verified'
      });
      toast.success('Digital signature uploaded successfully!');
      setShowAddModal(false);
      setSelectedUserId('');
      setSignatureInput('');
      fetchSignatures();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save signature');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PenTool className="text-indigo-600 dark:text-indigo-400" /> Digital Signatures Hub (VC, HOD, Faculty, Admin)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            All signatures are visible here. Admin has full rights to view, add, edit, or delete signatures.
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md flex items-center gap-2"
        >
          <Plus size={16} /> Add / Upload Signature
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {signatures.map(s => (
          <div key={s._id} className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {s.profilePhoto ? (
                  <img src={s.profilePhoto} alt={s.name} className="w-9 h-9 rounded-full object-cover border" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
                    {s.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{s.name}</h3>
                  <span className="text-[11px] text-slate-400 block">{s.role.toUpperCase()} — {s.department || 'No Dept'}</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                s.signatureStatus === 'verified' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                s.signatureStatus === 'rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {s.signatureStatus?.toUpperCase() || 'VERIFIED'}
              </span>
            </div>

            {/* Signature Image Preview */}
            <div 
              onClick={() => setPreviewUser(s)}
              className="h-28 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center p-3 cursor-pointer group relative overflow-hidden"
            >
              {s.signatureImage ? (
                <img src={s.signatureImage} alt={`${s.name} Signature`} className="max-h-full object-contain filter dark:invert" />
              ) : (
                <span className="text-xs text-slate-400">No signature image uploaded</span>
              )}
              <div className="absolute inset-0 bg-indigo-900/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                <ZoomIn size={16} /> Click to Inspect / Edit
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button 
                onClick={() => handleDeleteSignature(s._id)}
                className="flex-1 py-1.5 bg-rose-50 dark:bg-rose-950 text-rose-600 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 hover:bg-rose-100 transition-all"
                title="Delete Signature"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        ))}

        {signatures.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center text-slate-400">
            No uploaded digital signatures found. Use "Add / Upload Signature" to attach a signature.
          </div>
        )}
      </div>

      {/* Add Signature Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveNewSignature} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add / Edit Digital Signature</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select User (HOD / Faculty / VC / Admin)</label>
                <select 
                  value={selectedUserId} 
                  onChange={e => setSelectedUserId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  required
                >
                  <option value="">-- Choose User --</option>
                  {allUsers.map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.role.toUpperCase()}) - {u.email}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Upload Signature Image (PNG/JPG)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950 dark:file:text-indigo-300"
                />
              </div>

              {signatureInput && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border flex items-center justify-center h-24">
                  <img src={signatureInput} alt="Preview" className="max-h-full object-contain filter dark:invert" />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold">
                Save Signature
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inspect Modal */}
      {previewUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Signature Preview: {previewUser.name}</h3>
              <button onClick={() => setPreviewUser(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center min-h-[160px] border">
              <img src={previewUser.signatureImage} alt="Signature Zoom" className="max-h-48 object-contain filter dark:invert" />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => handleDeleteSignature(previewUser._id)} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold">
                Delete Signature
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
