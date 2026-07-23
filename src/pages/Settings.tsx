import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Settings as SettingsIcon, CheckCircle, Save } from 'lucide-react';

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
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-8 flex items-center gap-3">
        <SettingsIcon className="w-6 h-6 text-gray-400" />
        <h1 className="text-2xl font-bold">Preferences</h1>
      </header>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-6 uppercase tracking-wider">AI Model Configuration</h2>
        
        <div className="space-y-4 max-w-md">
          <label className="block text-sm text-gray-400">Select Gemini Model</label>
          <select 
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-purple-500"
          >
            <option value="gemini-3.1-pro">Gemini 3.1 Pro</option>
            <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
            <option value="gemini-3.6-flash-thinking">Gemini 3.6 Flash (Thinking)</option>
          </select>
          <p className="text-xs text-gray-500">This model will be used by the autonomous agent to resolve issues and review PRs.</p>
        </div>

        <div className="mt-8">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium text-sm"
          >
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
