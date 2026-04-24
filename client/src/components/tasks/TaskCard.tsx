import { Play, X, Trash2 } from 'lucide-react';
import type { Task } from '../../types';

interface Props {
  task: Task;
  onStart?: (id: string) => void;
  onCancel?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const statusBorder: Record<string, string> = {
  pending: 'border-l-zinc-500',
  assigned: 'border-l-blue-500',
  running: 'border-l-emerald-500',
  completed: 'border-l-blue-500',
  failed: 'border-l-red-500',
  cancelled: 'border-l-zinc-600',
};

export default function TaskCard({ task, onStart, onCancel, onDelete }: Props) {
  return (
    <div className={`bg-zinc-900 border border-zinc-800 ${statusBorder[task.status]} border-l-4 rounded-lg p-3 hover:border-zinc-700 transition-colors`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-sm font-medium text-zinc-200 truncate">{task.title}</h4>
          <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{task.description}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {task.status === 'pending' && (
            <button onClick={() => onStart?.(task.id)} className="p-1.5 hover:bg-emerald-900/30 rounded text-emerald-400">
              <Play size={14} />
            </button>
          )}
          {task.status === 'running' && (
            <button onClick={() => onCancel?.(task.id)} className="p-1.5 hover:bg-amber-900/30 rounded text-amber-400">
              <X size={14} />
            </button>
          )}
          <button onClick={() => onDelete?.(task.id)} className="p-1.5 hover:bg-red-900/30 rounded text-red-400">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-500">
        <span className={`px-1.5 py-0.5 rounded bg-zinc-800 ${task.priority >= 7 ? 'text-red-400' : task.priority >= 4 ? 'text-amber-400' : 'text-zinc-400'}`}>P{task.priority}</span>
        {task.plan_mode && <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-blue-400">Plan</span>}
        <span className="capitalize">{task.status}</span>
      </div>
    </div>
  );
}
