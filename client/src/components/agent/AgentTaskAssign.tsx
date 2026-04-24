import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import * as api from '../../services/api';

interface Props {
  agentId: string;
  onAssign?: () => void;
}

export default function AgentTaskAssign({ agentId, onAssign }: Props) {
  const { agents, tasks } = useAppContext();
  const [selectedTask, setSelectedTask] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agent = agents.find(a => a.id === agentId);
  const pending = tasks.filter(t => t.status === 'pending');

  const handleAssign = async () => {
    if (!selectedTask) return;
    setBusy(true);
    setError(null);
    try {
      const task = tasks.find(t => t.id === selectedTask);
      if (!task) throw new Error('Task not found');

      // Always assign the task first
      await api.assignTask(selectedTask, agentId);
      await api.startTask(selectedTask);

      if (agent?.status === 'idle') {
        // Start agent if idle
        await api.startAgent(agentId, selectedTask);
      } else if (agent?.status === 'running') {
        // If already running, send task description via terminal input
        await api.sendAgentInput(agentId, task.description + '\n');
      } else {
        throw new Error(`Agent is ${agent?.status}, cannot assign task`);
      }

      setSelectedTask('');
      onAssign?.();
    } catch (err: any) {
      setError(err.message || 'Failed to assign task');
    }
    setBusy(false);
  };

  const isRunning = agent?.status === 'running';

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-zinc-300">Assign Task</h3>
      <select
        value={selectedTask}
        onChange={e => setSelectedTask(e.target.value)}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50"
      >
        <option value="">Select pending task...</option>
        {pending.map(task => (
          <option key={task.id} value={task.id}>{task.title} (P{task.priority})</option>
        ))}
      </select>
      {pending.length === 0 && (
        <p className="text-xs text-zinc-500">No pending tasks. Create one in Tasks page.</p>
      )}
      <button
        onClick={handleAssign}
        disabled={!selectedTask || busy}
        className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
      >
        {busy ? 'Processing...' : (isRunning ? 'Assign & Send' : 'Assign & Start')}
      </button>
      {error && (
        <p className="text-xs text-red-400 bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
      )}
      {isRunning && (
        <p className="text-xs text-amber-400">Agent is running. Task will be sent via terminal input.</p>
      )}
    </div>
  );
}
