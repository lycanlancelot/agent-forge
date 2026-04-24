import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import Terminal from '../components/agent/Terminal';
import AgentInfoPanel from '../components/agent/AgentInfoPanel';
import AgentTaskAssign from '../components/agent/AgentTaskAssign';

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { agents, refreshAgents } = useAppContext();
  const agent = agents.find(a => a.id === id);

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500">
        <Bot size={48} className="mb-4" />
        <p>Agent not found</p>
        <button onClick={() => navigate('/')} className="mt-4 text-emerald-400 hover:underline">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-zinc-100">{agent.name}</h1>
          <p className="text-xs text-zinc-500 capitalize">{agent.type} Agent · {agent.status}</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        <div className="lg:col-span-2 min-h-0">
          <Terminal agentId={agent.id} status={agent.status} />
        </div>
        <div className="space-y-4 overflow-y-auto scrollbar-thin min-h-0">
          <AgentInfoPanel agent={agent} onUpdate={refreshAgents} />
          <AgentTaskAssign agentId={agent.id} onAssign={refreshAgents} />
        </div>
      </div>
    </div>
  );
}
