import React, { useState, useEffect } from 'react';
import { Github, Sparkles, CheckCircle, Code } from 'lucide-react';
import { signInWithPopup, GithubAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, githubProvider, db } from '../lib/firebase';
import { Octokit } from '@octokit/rest';

export default function Dashboard() {
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubToken, setGithubToken] = useState<string | null>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [preferredModel, setPreferredModel] = useState('gemini-2.5-flash');
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
        const repoRef = doc(db, 'repositories', selectedRepo);
        const repoSnap = await getDoc(repoRef);
        if (repoSnap.exists()) {
          setPreferredModel(repoSnap.data().model || 'gemini-2.5-flash');
        } else {
          setPreferredModel('gemini-2.5-flash');
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
      await setDoc(doc(db, 'repositories', selectedRepo), {
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
        with:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          GEMINI_API_KEY: \${{ secrets.GEMINI_API_KEY }}
          FIREBASE_API_KEY: \${{ secrets.FIREBASE_API_KEY }}`;

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col h-full">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">GeminiPilot Action</h1>
        <p className="text-sm text-gray-400 mt-2">Configure your autonomous GitHub action settings.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        <div className="space-y-6">
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-widest mb-4">Action Setup</h2>
            <p className="text-sm text-gray-400 mb-4">
              Add the following workflow to your target repository at <code className="bg-black/50 px-1 py-0.5 rounded text-blue-300">.github/workflows/agent.yml</code>
            </p>
            <div className="bg-black/60 rounded-xl p-4 border border-white/5 font-mono text-xs overflow-x-auto text-gray-300">
              <pre>{workflowExample}</pre>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-widest mb-4">Global Connections</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-xl border bg-purple-600/20 border-purple-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-purple-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white">Google Cloud / Gemini</h3>
                    <p className="text-xs text-gray-400">Action API Ready</p>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-purple-400" />
              </div>

              <div className={`p-4 rounded-xl border transition-all duration-300 flex items-center justify-between ${githubConnected && githubToken ? 'bg-blue-600/20 border-blue-500/30' : 'bg-black/40 border-white/5'}`}>
                <div className="flex items-center gap-3">
                  <div className="text-gray-400">
                    <Github className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white">GitHub Integration</h3>
                    <p className="text-xs text-gray-400">{githubConnected && githubToken ? 'Authorized' : 'Requires Authorization'}</p>
                  </div>
                </div>
                {githubConnected && githubToken ? (
                  <CheckCircle className="w-5 h-5 text-blue-400" />
                ) : (
                  <button onClick={handleGithubConnect} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors">
                    Connect GitHub
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black/60 rounded-2xl border border-white/10 flex flex-col p-6">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Code className="w-4 h-4 text-blue-400" />
            Repository Preferences
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            Configure the AI model used by GeminiPilot for your specific repositories. The Action will read these settings at runtime via Firebase.
          </p>
          
          {!githubConnected ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
              Please connect your GitHub account to load repositories.
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="text-xs text-gray-400 block mb-2 font-sans">Select Repository</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-blue-500 font-sans"
                  value={selectedRepo}
                  onChange={(e) => setSelectedRepo(e.target.value)}
                >
                  {repos.map(repo => (
                    <option key={repo.full_name} value={repo.full_name}>{repo.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-2 font-sans">AI Model for this Repo</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-blue-500 font-sans"
                  value={preferredModel}
                  onChange={(e) => setPreferredModel(e.target.value)}
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast, Efficient)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (Powerful, Complex)</option>
                  <option value="gemini-3.1-pro">Gemini 3.1 Pro (Experimental)</option>
                </select>
              </div>

              <button 
                onClick={saveRepoPreferences}
                disabled={saving || !selectedRepo}
                className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-500 text-white font-sans text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
