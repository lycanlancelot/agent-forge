import { GitCommit, GitBranch, FileText, Plus, Minus } from 'lucide-react';
import type { Commit } from '../../types';

interface Props {
  commits: Commit[];
}

export default function CommitTimeline({ commits }: Props) {
  const grouped: Record<string, Commit[]> = {};
  for (const c of commits) {
    const d = new Date(c.committed_at).toISOString().slice(0, 10);
    grouped[d] = grouped[d] || [];
    grouped[d].push(c);
  }
  const dates = Object.keys(grouped).sort().reverse();

  return (
    <div className="space-y-6">
      {dates.map(date => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-3">
            <div className="text-xs font-semibold text-zinc-400 uppercase bg-zinc-900 px-3 py-1 rounded-lg">{date}</div>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>
          <div className="space-y-2">
            {grouped[date].map(commit => (
              <div key={commit.id} className="flex items-start gap-3 bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:border-zinc-700 transition-colors">
                <GitCommit size={16} className="text-purple-400 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-xs font-mono text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded">{commit.commit_hash?.slice(0, 7) || 'N/A'}</code>
                    <span className="text-xs text-zinc-400 flex items-center gap-1"><GitBranch size={10} /> {commit.branch}</span>
                  </div>
                  <p className="text-sm text-zinc-200">{commit.message}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><FileText size={10} /> {commit.files_changed} files</span>
                    <span className="flex items-center gap-1 text-emerald-400"><Plus size={10} /> {commit.insertions}</span>
                    <span className="flex items-center gap-1 text-red-400"><Minus size={10} /> {commit.deletions}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {commits.length === 0 && (
        <div className="text-center py-12 text-zinc-500 text-sm">No commits yet</div>
      )}
    </div>
  );
}
