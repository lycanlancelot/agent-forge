import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import WorktreeTable from '../components/worktrees/WorktreeTable';
import CreateWorktreeModal from '../components/worktrees/CreateWorktreeModal';
import * as api from '../services/api';
import type { WorktreeEntry } from '../types';

export default function Worktrees() {
  const [worktrees, setWorktrees] = useState<WorktreeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const res = await api.getWorktrees();
    if (res.success && res.data) setWorktrees(res.data);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this worktree?')) return;
    await api.deleteWorktree(id);
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-100">Worktrees</h1>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg">
          <Plus size={16} /> New Worktree
        </button>
      </div>
      {loading ? (
        <div className="text-center py-12 text-zinc-500 text-sm">Loading...</div>
      ) : (
        <WorktreeTable worktrees={worktrees} onRemove={handleRemove} />
      )}

      <CreateWorktreeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={async (data) => {
          await api.createWorktree(data);
          refresh();
        }}
      />
    </div>
  );
}
