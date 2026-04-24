import { useState } from 'react';
import { X, Bot, Code2, Sparkles } from 'lucide-react';
import type { AgentType, PermissionMode } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    type: AgentType;
    repo_path: string;
    config: {
      permission_mode: PermissionMode;
      auto_commit: boolean;
      commit_interval_minutes: number;
      auto_push: boolean;
      dangerously_skip_permissions: boolean;
      use_plan_mode: boolean;
      wsl_distro: string;
      env_vars: Record<string, string>;
    };
  }) => void;
}

const AGENT_TYPES: { value: AgentType; label: string; icon: typeof Bot }[] = [
  { value: 'claude', label: 'Claude Code', icon: Bot },
  { value: 'codex', label: 'OpenAI Codex', icon: Code2 },
  { value: 'kimi', label: 'Kimi Code', icon: Sparkles },
];

const PERMISSION_MODES: { value: PermissionMode; label: string }[] = [
  { value: 'read-only', label: 'Read Only' },
  { value: 'auto-edit', label: 'Auto Edit' },
  { value: 'full-access', label: 'Full Access' },
];

export default function CreateAgentModal({ open, onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [type, setType] = useState<AgentType>('kimi');
  const [repoPath, setRepoPath] = useState('');
  const [permissionMode, setPermissionMode] = useState<PermissionMode>('auto-edit');
  const [autoCommit, setAutoCommit] = useState(true);
  const [usePlanMode, setUsePlanMode] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !repoPath.trim()) return;
    setLoading(true);
    onCreate({
      name: name.trim(),
      type,
      repo_path: repoPath.trim(),
      config: {
        permission_mode: permissionMode,
        auto_commit: autoCommit,
        commit_interval_minutes: 5,
        auto_push: false,
        dangerously_skip_permissions: true,
        use_plan_mode: usePlanMode,
        wsl_distro: 'Native Linux',
        env_vars: {},
      },
    });
    setLoading(false);
    setName('');
    setRepoPath('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-lg shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-zinc-100">Create Agent</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-400">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Auth Feature Agent"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-400">Type</label>
            <div className="flex gap-2">
              {AGENT_TYPES.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`flex items-center gap-1.5 flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                      type === t.value
                        ? 'bg-emerald-900/30 border-emerald-500/40 text-emerald-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}>
                    <Icon size={14} /> {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-400">Repository Path</label>
            <input
              value={repoPath}
              onChange={e => setRepoPath(e.target.value)}
              placeholder="/home/user/projects/my-repo"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-400">Permission Mode</label>
            <select
              value={permissionMode}
              onChange={e => setPermissionMode(e.target.value as PermissionMode)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50">
              {PERMISSION_MODES.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={autoCommit}
                onChange={e => setAutoCommit(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-emerald-600 focus:ring-emerald-500/30"
              />
              Auto Commit
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={usePlanMode}
                onChange={e => setUsePlanMode(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-emerald-600 focus:ring-emerald-500/30"
              />
              Plan Mode
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !repoPath.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
              {loading ? 'Creating...' : 'Create Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
