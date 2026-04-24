import { useNavigate } from 'react-router-dom';
import { Bot, Code2, Sparkles, Play, Pause, Square, GitBranch, Folder, Trash2 } from 'lucide-react';
import type { Agent } from '../../types';

const typeMeta: Record<string, { icon: typeof Bot; color: string; label: string }> = {
  claude: { icon: Bot, color: 'text-orange-400', label: 'Claude' },
  codex: { icon: Code2, color: 'text-emerald-400', label: 'Codex' },
  kimi: { icon: Sparkles, color: 'text-blue-400', label: 'Kimi' },
};

const statusColors: Record<string, string> = {
  idle: 'bg-zinc-600',
  running: 'bg-emerald-500',
  paused: 'bg-amber-500',
  error: 'bg-red-500',
  completed: 'bg-blue-500',
};

interface Props {
  agent: Agent;
  onStart?: (id: string) => void;
  onStop?: (id: string) => void;
  onPause?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function AgentCard({ agent, onStart, onStop, onPause, onDelete }: Props) {
  const navigate = useNavigate();
  const meta = typeMeta[agent.type] || typeMeta.claude;
  const Icon = meta.icon;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all cursor-pointer group"
      onClick={() => navigate(`/agent/${agent.id}`)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={18} className={meta.color} />
          <span className="font-semibold text-zinc-100">{agent.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${statusColors[agent.status]} ${agent.status === 'running' ? 'animate-pulse-dot' : ''}`} />
          <span className="text-xs text-zinc-500 capitalize">{agent.status}</span>
        </div>
      </div>

      <div className="space-y-2 text-xs text-zinc-400 mb-4">
        <div className="flex items-center gap-1.5">
          <Folder size={12} />
          <span className="truncate">{agent.worktree_path || agent.repo_path}</span>
        </div>
        {agent.branch && (
          <div className="flex items-center gap-1.5">
            <GitBranch size={12} />
            <span className="text-zinc-300">{agent.branch}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
        {agent.status === 'idle' && (
          <button onClick={() => onStart?.(agent.id)}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg transition-colors">
            <Play size={12} /> Start
          </button>
        )}
        {agent.status === 'running' && (
          <>
            <button onClick={() => onPause?.(agent.id)}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs rounded-lg transition-colors">
              <Pause size={12} /> Pause
            </button>
            <button onClick={() => onStop?.(agent.id)}
              className="flex items-center gap-1 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded-lg transition-colors">
              <Square size={12} /> Stop
            </button>
          </>
        )}
        {agent.status === 'paused' && (
          <button onClick={() => onStart?.(agent.id)}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg transition-colors">
            <Play size={12} /> Resume
          </button>
        )}
        <button onClick={() => { if (confirm(`Delete agent "${agent.name}"?`)) onDelete?.(agent.id); }}
          className="ml-auto p-1.5 hover:bg-red-900/30 text-zinc-500 hover:text-red-400 rounded-lg transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
