import { useState } from 'react';
import { Plus, Infinity } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import TaskCard from '../components/tasks/TaskCard';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import * as api from '../services/api';

const columns = ['pending', 'assigned', 'running', 'completed', 'failed', 'cancelled'] as const;
const colLabels: Record<string, string> = { pending: 'Pending', assigned: 'Assigned', running: 'Running', completed: 'Completed', failed: 'Failed', cancelled: 'Cancelled' };

export default function Tasks() {
  const { agents, tasks, refreshTasks } = useAppContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [ralphEnabled, setRalphEnabled] = useState(false);
  const [ralphLoading, setRalphLoading] = useState(false);

  const handleCreate = async (data: Partial<any>) => {
    await api.createTask(data);
    refreshTasks();
  };

  const handleStart = async (id: string) => {
    await api.startTask(id);
    refreshTasks();
  };

  const handleCancel = async (id: string) => {
    await api.cancelTask(id);
    refreshTasks();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    await api.deleteTask(id);
    refreshTasks();
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-100">Tasks</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
            <Infinity size={14} className={ralphEnabled ? 'text-emerald-400' : 'text-zinc-500'} />
            <span>Ralph Loop</span>
            <input type="checkbox" checked={ralphEnabled} disabled={ralphLoading}
              onChange={async (e) => {
                const enabled = e.target.checked;
                setRalphLoading(true);
                try {
                  for (const agent of agents.filter(a => a.status === 'idle')) {
                    if (enabled) await api.startRalphLoop(agent.id);
                    else await api.stopRalphLoop(agent.id);
                  }
                  setRalphEnabled(enabled);
                } catch (err) {
                  console.error('Ralph Loop toggle failed:', err);
                }
                setRalphLoading(false);
              }}
              className="accent-emerald-500 ml-1" />
          </label>
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg">
            <Plus size={16} /> New Task
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto scrollbar-thin">
        <div className="flex gap-4 min-w-max">
          {columns.map(col => (
            <div key={col} className="w-72 flex flex-col">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-semibold text-zinc-400 uppercase">{colLabels[col]}</span>
                <span className="text-xs text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded-full">{tasks.filter(t => t.status === col).length}</span>
              </div>
              <div className="flex-1 bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-2 space-y-2 overflow-y-auto scrollbar-thin max-h-[calc(100vh-220px)]">
                {tasks.filter(t => t.status === col).map(task => (
                  <TaskCard key={task.id} task={task} onStart={handleStart} onCancel={handleCancel} onDelete={handleDelete} />
                ))}
                {tasks.filter(t => t.status === col).length === 0 && (
                  <div className="text-xs text-zinc-600 text-center py-4">No tasks</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <CreateTaskModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreate} />
    </div>
  );
}
