import { useNavigate } from 'react-router-dom';
import { Bot, Plus, Wifi, WifiOff, Moon, Sun, Globe } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function TopBar() {
  const { socketConnected, agents, tasks } = useAppContext();
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-zinc-900/80 backdrop-blur border-b border-zinc-800 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <Bot size={24} className="text-emerald-400" />
        <h1 className="text-lg font-bold text-zinc-100">AgentForge</h1>
        <span className="text-xs text-zinc-500 hidden sm:inline">v1.0</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-4 text-xs text-zinc-400 mr-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {agents.filter(a => a.status === 'running').length} Active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {tasks.filter(t => t.status === 'pending').length} Pending
          </span>
        </div>

        <div className="flex items-center gap-2">
          {socketConnected ? (
            <Wifi size={16} className="text-emerald-400" />
          ) : (
            <WifiOff size={16} className="text-red-400" />
          )}
        </div>

        <button onClick={() => navigate('/settings')}
          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors">
          <Plus size={16} />
          <span className="hidden sm:inline">New Agent</span>
        </button>
      </div>
    </header>
  );
}
