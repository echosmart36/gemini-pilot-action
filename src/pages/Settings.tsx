import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Settings as SettingsIcon, CheckCircle, Save } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

export default function Settings() {
  const [model, setModel] = useState('gemini-3.1-pro');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadPrefs = async () => {
      if (auth.currentUser) {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().preferences?.model) {
          setModel(docSnap.data().preferences.model);
        }
      }
    };
    loadPrefs();
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        'preferences.model': model
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error(error);
    }
    setSaving(false);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto h-full flex flex-col font-sans">
      <header className="mb-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
          <SettingsIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Preferences</h1>
          <p className="text-sm text-gray-400 mt-1">Manage global agent defaults and account settings.</p>
        </div>
      </header>

      <div className="bg-[#0A0A0E] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />
        
        <h2 className="text-xs font-bold text-gray-400 mb-8 uppercase tracking-widest">Global AI Configuration</h2>
        
        <div className="space-y-6 max-w-md">
          <div>
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-3">Default Gemini Model</label>
            <CustomSelect 
              options={[
                { label: 'Gemini 3.1 Flash Lite (Ultra Fast)', value: 'gemini-3.1-flash-lite' },
                { label: 'Gemini 3.5 Flash (General + Search)', value: 'gemini-3.5-flash' },
                { label: 'Gemini 3.1 Pro Preview (Complex + Thinking)', value: 'gemini-3.1-pro-preview' }
              ]}
              value={model}
              onChange={setModel}
            />
            <p className="text-xs text-gray-500 mt-3 leading-relaxed">This model will be used by default when injecting new agents into your repositories.</p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-black hover:bg-gray-200 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] font-bold text-sm disabled:opacity-50 disabled:hover:scale-100 disabled:bg-white/20 disabled:text-gray-400"
          >
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Preferences Saved' : 'Save Global Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
