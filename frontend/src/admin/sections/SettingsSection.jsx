import React, { useState } from 'react';
import { Settings, Shield, Mail, Database, Key, Sparkles, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsSection() {
  const [googleAuth, setGoogleAuth] = useState(true);
  const [domainRestriction, setDomainRestriction] = useState('mits.ac.in');

  function handleSave() {
    toast.success('System configuration saved successfully!');
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="text-indigo-600 dark:text-indigo-400" /> System Configuration & Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Google OAuth credentials, domain restrictions, database backup triggers, and global preferences.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="text-indigo-600" size={18} /> Authentication & Security Settings
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">Enable Google OAuth Sign-In</div>
              <div className="text-xs text-slate-400">Allow users to log in with Google Identity Services.</div>
            </div>
            <input type="checkbox" checked={googleAuth} onChange={e => setGoogleAuth(e.target.checked)} className="h-5 w-5 rounded text-indigo-600" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Restricted Email Domain</label>
            <input 
              type="text" 
              value={domainRestriction} 
              onChange={e => setDomainRestriction(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Only users with this domain can log in via Google OAuth.</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button onClick={handleSave} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-md active:scale-95">
            Save System Settings
          </button>
        </div>
      </div>
    </div>
  );
}
