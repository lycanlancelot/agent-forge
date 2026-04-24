import { useState } from 'react';
import { GitBranch, Folder, Settings2, RotateCcw, Trash2, Save } from 'lucide-react';
import type { Agent } from '../../types';
import * as api from '../../services/api';

interface Props {
  agent: Agent;
  onUpdate?: () => void;
}

export default function AgentInfoPanel({ agent, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [config, setConfig] = useState(agent.config);

  const handleSave = async () => {
    await api.updateAgent(agent.id, { config });
    setEditing(false);
    onUpdate?.();
  };

  const toggle = (k: keyof typeof config) => {
    setConfig(prev => ({ ...prev, [k]: !prev[k] }));
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4 overflow-y-auto scrollbar-thin">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300">Agent Info</h3>
        <button onClick={() => setEditing(!editing)} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200">
          <Settings2 size={14} />
        </button>
      </div>

      <div className="space-y-3 text-xs">
        <div className="flex items-center gap-2 text-zinc-400">
          <Folder size={12} />
          <span className="truncate">{agent.worktree_path || agent.repo_path}</span>
        </div>
        {agent.branch && (
          <div className="flex items-center gap-2 text-zinc-400">
            <GitBranch size={12} />
            <span>{agent.branch}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-zinc-400">
          <span>Status</span>
          <span className="capitalize text-zinc-200">{agent.status}</span>
        </div>
        <div className="flex items-center justify-between text-zinc-400">
          <span>Type</span>
          <span className="capitalize text-zinc-200">{agent.type}</span>
        </div>
      </div>

      {editing && (
        <div className="space-y-3 pt-2 border-t border-zinc-800">
          <h4 className="text-xs font-semibold text-zinc-500 uppercase">Configuration</h4>

          <label className="flex items-center justify-between text-xs text-zinc-300">
            <span>Auto Commit</span>
            <input type="checkbox" checked={config.auto_commit} onChange={() => toggle('auto_commit')} className="accent-emerald-500" />
          </label>

          <label className="flex items-center justify-between text-xs text-zinc-300">
            <span>Auto Push</span>
            <input type="checkbox" checked={config.auto_push} onChange={() => toggle('auto_push')} className="accent-emerald-500" />
          </label>

          <label className="flex items-center justify-between text-xs text-zinc-300">
            <span>Plan Mode</span>
            <input type="checkbox" checked={config.use_plan_mode} onChange={() => toggle('use_plan_mode')} className="accent-emerald-500" />
          </label>

          <label className="flex items-center justify-between text-xs text-zinc-300">
            <span>Skip Permissions</span>
            <input type="checkbox" checked={config.dangerously_skip_permissions} onChange={() => toggle('dangerously_skip_permissions')} className="accent-emerald-500" />
          </label>

          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span>Commit Interval</span>
            <input type="number" value={config.commit_interval_minutes} onChange={e => setConfig({...config, commit_interval_minutes: parseInt(e.target.value)||5})} className="w-16 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-right" />
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg">
              <Save size={12} /> Save
            </button>
            <button onClick={() => setEditing(false)} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t border-zinc-800">
        <button onClick={() => api.stopAgent(agent.id).then(() => onUpdate?.())}
          className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg">
          <RotateCcw size={12} /> Restart
        </button>
        <button onClick={() => { if (confirm('Delete this agent?')) api.deleteAgent(agent.id).then(() => onUpdate?.()); }}
          className="flex items-center gap-1 px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-xs rounded-lg">
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </div>
  );
}
