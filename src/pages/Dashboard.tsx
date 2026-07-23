import React, { useState, useEffect } from 'react';
import { Github, Sparkles, CheckCircle, Code } from 'lucide-react';
import { signInWithPopup, GithubAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, githubProvider, db } from '../lib/firebase';
import { Octokit } from '@octokit/rest';
import CustomSelect from '../components/CustomSelect';

export default function Dashboard() {
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubToken, setGithubToken] = useState<string | null>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [preferredModel, setPreferredModel] = useState('gemini-3.5-flash');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (auth.currentUser) {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.githubConnected) {
            setGithubConnected(true);
            if (data.githubToken) {
              setGithubToken(data.githubToken);
              await fetchRepos(data.githubToken);
            }
          }
        }
      }
    };
    init();
  }, []);

  useEffect(() => {
    const fetchRepoPrefs = async () => {
      if (selectedRepo && auth.currentUser) {
        const repoId = selectedRepo.replace(/\//g, '_');
        const repoRef = doc(db, 'repositories', repoId);
        const repoSnap = await getDoc(repoRef);
        if (repoSnap.exists()) {
          setPreferredModel(repoSnap.data().model || 'gemini-3.5-flash');
        } else {
          setPreferredModel('gemini-3.5-flash');
        }
      }
    };
    fetchRepoPrefs();
  }, [selectedRepo]);

  const fetchRepos = async (token: string) => {
    try {
      const octokit = new Octokit({ auth: token });
      const { data } = await octokit.rest.repos.listForAuthenticatedUser({ sort: 'updated' });
      setRepos(data);
      if (data.length > 0) setSelectedRepo(data[0].full_name);
    } catch (error) {
      console.error("Error fetching repos:", error);
    }
  };

  const handleGithubConnect = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const credential = GithubAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGithubToken(credential.accessToken);
        setGithubConnected(true);
        if (auth.currentUser) {
           await setDoc(doc(db, "users", auth.currentUser.uid), {
             githubConnected: true,
             githubToken: credential.accessToken,
             githubUsername: result.user.displayName || result.user.email,
           }, { merge: true });
        }
        await fetchRepos(credential.accessToken);
      }
    } catch (error: any) {
      console.error("GitHub sign in failed:", error);
    }
  };

  const saveRepoPreferences = async () => {
    if (!auth.currentUser || !selectedRepo) return;
    setSaving(true);
    try {
      const repoId = selectedRepo.replace(/\//g, '_');
      await setDoc(doc(db, 'repositories', repoId), {
        userId: auth.currentUser.uid,
        fullName: selectedRepo,
        model: preferredModel,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error("Error saving repo preferences:", error);
    } finally {
      setSaving(false);
    }
  };

  const workflowExample = `name: GeminiPilot Agent

on:
  issues:
    types: [opened, edited]
  issue_comment:
    types: [created]
  pull_request:
    types: [opened, synchronize]

jobs:
  gemini-agent:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
    steps:
      - name: Run Gemini Agent
        uses: echosmart36/gemini-pilot-action@main
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          GEMINI_API_KEY: \${{ secrets.GEMINI_API_KEY }}
          FIREBASE_API_KEY: \${{ secrets.FIREBASE_API_KEY }}`;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto flex flex-col h-full font-sans">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Action Dashboard</h1>
          <p className="text-sm text-gray-400 mt-2">Configure your autonomous GitHub action settings across all repositories.</p>
        </div>
        {githubConnected && (
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-gray-300">System Online</span>
          </div>
        )}
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Connected Repos', value: githubConnected ? repos.length : 0 },
          { label: 'Active Actions', value: githubConnected ? Math.floor(repos.length * 0.3) : 0 },
          { label: 'Issues Resolved', value: githubConnected ? '1,204' : 0 },
          { label: 'PRs Reviewed', value: githubConnected ? '342' : 0 }
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</span>
            <span className="text-2xl font-bold text-white mt-2">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 pb-10">
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-[#0A0A0E] rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Action Setup Guide</h2>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              To enable GeminiPilot, add the following workflow to your target repository at <code className="bg-white/10 px-1.5 py-0.5 rounded text-blue-300">.github/workflows/agent.yml</code>
            </p>
            <div className="bg-black/80 rounded-2xl p-5 border border-white/5 font-mono text-[13px] leading-relaxed overflow-x-auto text-gray-300 shadow-inner">
              <pre>{workflowExample}</pre>
            </div>
          </div>

          <div className="bg-[#0A0A0E] rounded-3xl p-8 border border-white/10 shadow-2xl">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Global Connections</h2>
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900/20 to-blue-900/10 border border-purple-500/20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white">Google Cloud / Gemini</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Action API Ready</p>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-purple-400" />
              </div>

              <div className={`p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between ${githubConnected && githubToken ? 'bg-blue-900/20 border-blue-500/30' : 'bg-black/40 border-white/5 hover:border-white/10'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${githubConnected ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-400'}`}>
                    <Github className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white">GitHub Integration</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{githubConnected && githubToken ? 'Authorized' : 'Requires Authorization'}</p>
                  </div>
                </div>
                {githubConnected && githubToken ? (
                  <CheckCircle className="w-5 h-5 text-blue-400" />
                ) : (
                  <button onClick={handleGithubConnect} className="px-5 py-2.5 bg-white text-black hover:bg-gray-200 text-sm font-bold rounded-xl transition-colors">
                    Connect GitHub
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 relative">
          <div className="sticky top-6 bg-gradient-to-b from-[#0A0A0E] to-black/60 rounded-3xl border border-white/10 flex flex-col p-8 shadow-2xl">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Code className="w-4 h-4 text-blue-400" />
              Repository Preferences
            </h2>
            <p className="text-sm text-gray-400 mb-8 leading-relaxed">
              Configure the AI model used by GeminiPilot for your specific repositories. The Action will read these settings at runtime via Firebase.
            </p>
            
            {!githubConnected ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4 border border-dashed border-white/10 rounded-2xl bg-white/5">
                <Github className="w-8 h-8 text-gray-500 mb-3" />
                <p className="text-sm text-gray-400">Please connect your GitHub account to load repositories.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-3">Select Repository</label>
                  <CustomSelect
                    options={repos.map(repo => ({ label: repo.full_name, value: repo.full_name }))}
                    value={selectedRepo}
                    onChange={setSelectedRepo}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-3">AI Model Setup</label>
                  <CustomSelect
                    options={[
                      { label: 'Gemini 3.1 Flash Lite (Ultra Fast)', value: 'gemini-3.1-flash-lite' },
                      { label: 'Gemini 3.5 Flash (General + Search)', value: 'gemini-3.5-flash' },
                      { label: 'Gemini 3.1 Pro Preview (Complex + Thinking)', value: 'gemini-3.1-pro-preview' },
                      { label: 'Gemini 2.5 Flash (Legacy Fast)', value: 'gemini-2.5-flash' },
                      { label: 'Gemini 2.5 Pro (Legacy Pro)', value: 'gemini-2.5-pro' }
                    ]}
                    value={preferredModel}
                    onChange={setPreferredModel}
                  />
                </div>

                <button 
                  onClick={saveRepoPreferences}
                  disabled={saving || !selectedRepo}
                  className="w-full py-3.5 mt-4 bg-white hover:bg-gray-200 text-black font-sans text-sm font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100 disabled:bg-white/20 disabled:text-gray-400"
                >
                  {saving ? 'Saving Preferences...' : 'Save Preferences'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
