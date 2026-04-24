import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import type { Task } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (task: Partial<Task>) => void;
}

export default function CreateTaskModal({ open, onClose, onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(5);
  const [planMode, setPlanMode] = useState(false);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate({ title, description, priority, plan_mode: planMode });
    setTitle(''); setDescription(''); setPriority(5); setPlanMode(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg mx-4 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-100">Create Task</h2>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded text-zinc-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50" placeholder="Task title..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Description / Prompt</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50 resize-none" placeholder="Describe what the agent should do..." />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-400 mb-1">Priority: {priority}</label>
              <input type="range" min={1} max={10} value={priority} onChange={e => setPriority(parseInt(e.target.value))} className="w-full accent-emerald-500" />
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
              <input type="checkbox" checked={planMode} onChange={e => setPlanMode(e.target.checked)} className="accent-emerald-500" />
              Plan Mode
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg">Cancel</button>
            <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg"><Plus size={14} /> Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}
