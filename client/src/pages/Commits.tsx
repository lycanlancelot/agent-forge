import { useState, useEffect } from 'react';
import { BarChart3, GitCommit } from 'lucide-react';
import CommitTimeline from '../components/commits/CommitTimeline';
import CommitStats from '../components/commits/CommitStats';
import { useAppContext } from '../context/AppContext';
import * as api from '../services/api';
import type { Commit } from '../types';

export default function Commits() {
  const { agents } = useAppContext();
  const [commits, setCommits] = useState<Commit[]>([]);
  const [view, setView] = useState<'timeline' | 'stats'>('timeline');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const res = await api.getCommits();
    if (res.success && res.data) setCommits(res.data);
    const statsRes = await api.getCommitStats();
    if (statsRes.success) setStats(statsRes.data);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-100">Commits</h1>
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          <button onClick={() => setView('timeline')} className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${view === 'timeline' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'}`}>
            <GitCommit size={14} /> Timeline
          </button>
          <button onClick={() => setView('stats')} className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${view === 'stats' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'}`}>
            <BarChart3 size={14} /> Stats
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-500 text-sm">Loading commits...</div>
      ) : view === 'timeline' ? (
        <CommitTimeline commits={commits} />
      ) : (
        <CommitStats data={stats || { byAgent: {}, byDate: {}}} agents={agents} />
      )}
    </div>
  );
}
