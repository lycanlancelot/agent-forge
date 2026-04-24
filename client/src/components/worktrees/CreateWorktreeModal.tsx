import { useState } from 'react';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { repo_path: string; branch: string; base_branch?: string }) => void;
}

export default function CreateWorktreeModal({ open, onClose, onCreate }: Props) {
  const [repoPath, setRepoPath] = useState('');
  const [branch, setBranch] = useState('');
  const [baseBranch, setBaseBranch] = useState('main');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoPath.trim() || !branch.trim()) return;
    setLoading(true);
    onCreate({ repo_path: repoPath.trim(), branch: branch.trim(), base_branch: baseBranch.trim() || undefined });
    setLoading(false);
    setRepoPath('');
    setBranch('');
    setBaseBranch('main');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-zinc-100">New Worktree</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-400">Repository Path</label>
            <input value={repoPath} onChange={e => setRepoPath(e.target.value)}
              placeholder="/home/user/projects/my-repo"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
              required />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-400">New Branch Name</label>
            <input value={branch} onChange={e => setBranch(e.target.value)}
              placeholder="feature/my-branch"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
              required />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-400">Base Branch (optional)</label>
            <input value={baseBranch} onChange={e => setBaseBranch(e.target.value)}
              placeholder="main"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={loading || !repoPath.trim() || !branch.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
              {loading ? 'Creating...' : 'Create Worktree'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
