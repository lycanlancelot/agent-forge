import { GitBranch, Trash2, Folder } from 'lucide-react';
import type { WorktreeEntry } from '../../types';

interface Props {
  worktrees: WorktreeEntry[];
  onRemove?: (id: string) => void;
}

export default function WorktreeTable({ worktrees, onRemove }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-950 border-b border-zinc-800">
          <tr>
            <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Branch</th>
            <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Path</th>
            <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Status</th>
            <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Created</th>
            <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {worktrees.map(wt => (
            <tr key={wt.id} className="hover:bg-zinc-800/30 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 text-zinc-200">
                  <GitBranch size={14} className="text-amber-400" />
                  <span className="font-mono text-xs">{wt.branch}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 text-zinc-400 text-xs">
                  <Folder size={12} />
                  <span className="truncate max-w-xs">{wt.worktree_path}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${wt.status === 'active' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>{wt.status}</span>
              </td>
              <td className="px-4 py-3 text-xs text-zinc-500">{new Date(wt.created_at).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                <button onClick={() => onRemove?.(wt.id)} className="p-1.5 hover:bg-red-900/30 rounded text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
          {worktrees.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-600 text-xs">No worktrees yet</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
