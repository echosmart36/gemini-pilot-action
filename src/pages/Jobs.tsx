import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Activity, Terminal, ExternalLink, GitCommit, GitPullRequest, AlertCircle } from 'lucide-react';
import { Octokit } from '@octokit/rest';

export default function Jobs() {
  const [repos, setRepos] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<any>(null);
  const [githubToken, setGithubToken] = useState<string | null>(null);
  const [runs, setRuns] = useState<any[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);

  useEffect(() => {
    const fetchReposAndToken = async () => {
      if (auth.currentUser) {
        // Get GitHub token
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists() && userDoc.data().githubToken) {
          setGithubToken(userDoc.data().githubToken);
        }

        // Get Repos configured for the agent
        const q = query(collection(db, 'repositories'), where('userId', '==', auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        const repoData: any[] = [];
        querySnapshot.forEach((doc) => {
          repoData.push({ id: doc.id, ...doc.data() });
        });
        setRepos(repoData);
      }
    };
    fetchReposAndToken();
  }, []);

  useEffect(() => {
    const fetchWorkflowRuns = async () => {
      if (selectedRepo && githubToken) {
        setLoadingRuns(true);
        try {
          const octokit = new Octokit({ auth: githubToken });
          const [owner, repo] = selectedRepo.fullName.split('/');
          
          // Fetch workflow runs for this repo
          const { data } = await octokit.rest.actions.listWorkflowRunsForRepo({
            owner,
            repo,
            per_page: 20
          });
          
          setRuns(data.workflow_runs);
        } catch (error) {
          console.error("Error fetching workflow runs:", error);
        } finally {
          setLoadingRuns(false);
        }
      }
    };
    fetchWorkflowRuns();
  }, [selectedRepo, githubToken]);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto h-full flex flex-col font-sans">
      <header className="mb-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Execution Jobs</h1>
          <p className="text-sm text-gray-400 mt-1">View real-time workflow runs and agent activities.</p>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0 pb-10">
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-2">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Connected Repositories</h2>
          {repos.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10 px-4 border border-dashed border-white/10 rounded-2xl bg-white/5">
              <AlertCircle className="w-8 h-8 text-gray-500 mb-3" />
              <p className="text-sm text-gray-400">No repositories configured yet.</p>
            </div>
          ) : (
            repos.map(repo => (
              <button 
                key={repo.id}
                onClick={() => setSelectedRepo(repo)}
                className={`text-left p-5 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${selectedRepo?.id === repo.id ? 'bg-blue-900/20 border-blue-500/30' : 'bg-[#0A0A0E] border-white/10 hover:border-white/20 shadow-xl'}`}
              >
                <h3 className="font-semibold text-sm text-white mb-1.5">{repo.fullName}</h3>
                <p className="text-xs text-gray-400 mb-3">Model: {repo.model}</p>
                <div className="flex items-center gap-2 text-xs font-medium text-green-400 bg-green-500/10 w-fit px-2 py-1 rounded-md">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Active
                </div>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-8 flex flex-col bg-[#0A0A0E] rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="bg-black/40 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <Terminal className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block">
                  {selectedRepo ? selectedRepo.fullName : 'Select a repository'}
                </span>
                <span className="text-xs text-gray-400">Workflow Runs</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto z-10">
            {!selectedRepo ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500 text-sm">Select a configured repository to view its workflow runs.</p>
              </div>
            ) : loadingRuns ? (
              <div className="h-full flex items-center justify-center">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-400">Fetching runs from GitHub...</p>
                </div>
              </div>
            ) : runs.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500 text-sm">No workflow runs found for this repository.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {runs.map((run) => (
                  <div key={run.id} className="bg-black/60 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                          {run.name}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            run.conclusion === 'success' ? 'bg-green-500/20 text-green-400' : 
                            run.conclusion === 'failure' ? 'bg-red-500/20 text-red-400' : 
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {run.conclusion || run.status}
                          </span>
                        </h4>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                          <GitCommit className="w-3 h-3" />
                          {run.head_commit?.message || 'No commit message'}
                        </p>
                      </div>
                      <a 
                        href={run.html_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Branch: <span className="text-gray-300 font-mono">{run.head_branch}</span></span>
                      <span>Trigger: <span className="text-gray-300">{run.event}</span></span>
                      <span>{new Date(run.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

