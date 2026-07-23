import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Activity, Terminal } from 'lucide-react';

export default function Jobs() {
  const [repos, setRepos] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<any>(null);

  useEffect(() => {
    const fetchRepos = async () => {
      if (auth.currentUser) {
        const q = query(collection(db, 'repositories'), where('userId', '==', auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        const repoData: any[] = [];
        querySnapshot.forEach((doc) => {
          repoData.push({ id: doc.id, ...doc.data() });
        });
        setRepos(repoData);
      }
    };
    fetchRepos();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col">
      <header className="mb-8 flex items-center gap-3">
        <Activity className="w-6 h-6 text-blue-400" />
        <h1 className="text-2xl font-bold">Execution Jobs</h1>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Active Injections</h2>
          {repos.length === 0 ? (
            <p className="text-sm text-gray-500">No agent injected yet.</p>
          ) : (
            repos.map(repo => (
              <button 
                key={repo.id}
                onClick={() => setSelectedRepo(repo)}
                className={`text-left p-4 rounded-xl border transition-all ${selectedRepo?.id === repo.id ? 'bg-blue-600/20 border-blue-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
              >
                <h3 className="font-medium text-sm text-white mb-1">{repo.fullName}</h3>
                <p className="text-xs text-gray-400 mb-2">Model: {repo.model}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-green-400">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Active
                </div>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-8 flex flex-col bg-black/60 rounded-2xl border border-white/10 overflow-hidden min-h-[400px]">
          <div className="bg-white/5 border-b border-white/10 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-mono text-gray-300">
                {selectedRepo ? `Logs: ${selectedRepo.fullName}` : 'Select a repository'}
              </span>
            </div>
          </div>
          <div className="flex-1 p-6 font-mono text-[12px] leading-relaxed overflow-y-auto text-gray-300">
            {!selectedRepo ? (
              <p className="text-gray-500 italic">Select a deployed agent to view execution logs.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="text-gray-600">[{new Date(selectedRepo.createdAt).toLocaleTimeString('en-US', { hour12: false })}]</span>
                  <span className="text-blue-400">INFO:</span>
                  <span className="text-white">Agent successfully injected into repository.</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-gray-600">[{new Date(selectedRepo.createdAt).toLocaleTimeString('en-US', { hour12: false })}]</span>
                  <span className="text-blue-400">INFO:</span>
                  <span className="text-white">Waiting for GitHub events (issues, pull requests)...</span>
                </div>
                {/* We would fetch real logs from firestore here in a complete implementation */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
