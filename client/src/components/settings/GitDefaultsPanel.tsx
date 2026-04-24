import type { AppSettings } from '../../types';

interface Props {
  settings: AppSettings;
  onUpdate: (patch: Partial<AppSettings>) => void;
}

export default function GitDefaultsPanel({ settings, onUpdate }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
      <h3 className="text-sm font-semibold text-zinc-200">Git Defaults</h3>
      <p className="text-xs text-zinc-500">Configure default Git behavior for all new agents.</p>

      <label className="flex items-center justify-between text-sm text-zinc-300">
        <span>Auto Commit</span>
        <input type="checkbox" checked={settings.default_auto_commit} onChange={e => onUpdate({ default_auto_commit: e.target.checked })} className="accent-emerald-500 w-4 h-4" />
      </label>

      <label className="flex items-center justify-between text-sm text-zinc-300">
        <span>Auto Push</span>
        <input type="checkbox" checked={settings.default_auto_push} onChange={e => onUpdate({ default_auto_push: e.target.checked })} className="accent-emerald-500 w-4 h-4" />
      </label>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-2">Commit Interval: {settings.default_commit_interval} minutes</label>
        <input type="range" min={1} max={60} value={settings.default_commit_interval} onChange={e => onUpdate({ default_commit_interval: parseInt(e.target.value) })} className="w-full accent-emerald-500" />
      </div>
    </div>
  );
}
