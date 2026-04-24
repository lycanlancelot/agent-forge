import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import StatCard from '../components/dashboard/StatCard';
import AgentCard from '../components/dashboard/AgentCard';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import QuickTaskBar from '../components/dashboard/QuickTaskBar';
import CreateAgentModal from '../components/dashboard/CreateAgentModal';
import { Activity, ListTodo, GitCommit, GitBranch, Plus } from 'lucide-react';
import * as api from '../services/api';

export default function Dashboard() {
  const { agents, tasks, stats, activity, refreshAgents } = useAppContext();
  const [showCreate, setShowCreate] = useState(false);

  const handleStart = async (id: string) => {
    await api.startAgent(id);
    refreshAgents();
  };
  const handleStop = async (id: string) => {
    await api.stopAgent(id);
    refreshAgents();
  };
  const handlePause = async (id: string) => {
    await api.pauseAgent(id);
    refreshAgents();
  };
  const handleDelete = async (id: string) => {
    await api.deleteAgent(id);
    refreshAgents();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Agents" value={agents.filter(a => a.status === 'running').length} icon={Activity} color="text-emerald-400" />
        <StatCard title="Pending Tasks" value={tasks.filter(t => t.status === 'pending').length} icon={ListTodo} color="text-amber-400" />
        <StatCard title="Commits Today" value={stats?.totalCommits ?? 0} icon={GitCommit} color="text-blue-400" />
        <StatCard title="Total Worktrees" value={stats?.totalWorktrees ?? 0} icon={GitBranch} color="text-purple-400" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-zinc-200">Agents</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs rounded-lg transition-colors border border-zinc-800 hover:border-zinc-700">
            <Plus size={14} /> New Agent
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map(agent => (
            <AgentCard key={agent.id} agent={agent} onStart={handleStart} onStop={handleStop} onPause={handlePause} onDelete={handleDelete} />
          ))}
          {agents.length === 0 && (
            <div className="col-span-full text-center py-12 text-zinc-500 text-sm">
              No agents yet. Click "New Agent" to create one.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ActivityFeed items={activity} />
        </div>
        <div>
          <QuickTaskBar />
        </div>
      </div>

      <CreateAgentModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={async (data) => {
          await api.createAgent(data);
          refreshAgents();
        }}
      />
    </div>
  );
}
