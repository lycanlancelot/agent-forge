import { useState } from 'react';
import { Save, RotateCcw, CheckCircle, XCircle, Bot, GitCommit, Globe, HardDrive } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import CloudflarePanel from '../components/settings/CloudflarePanel';
import GitDefaultsPanel from '../components/settings/GitDefaultsPanel';
import WSLConfigPanel from '../components/settings/WSLConfigPanel';
import * as api from '../services/api';

type Tab = 'general' | 'git' | 'cloudflare' | 'wsl';

const tabs: { id: Tab; label: string; icon: typeof Bot }[] = [
  { id: 'general', label: 'General', icon: Bot },
  { id: 'git', label: 'Git', icon: GitCommit },
  { id: 'cloudflare', label: 'Cloudflare', icon: Globe },
  { id: 'wsl', label: 'WSL', icon: HardDrive },
];

export default function Settings() {
  const { settings, updateSettings, refreshSettings } = useAppContext();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settings) {
        await api.updateSettings(settings);
        showToast('success', 'Settings saved successfully');
      }
    } catch {
      showToast('error', 'Failed to save settings');
    }
    setSaving(false);
  };

  const handleReset = () => {
    refreshSettings();
    showToast('success', 'Settings reset');
  };

  if (!settings) {
    return <div className="text-center py-12 text-zinc-500">Loading settings...</div>;
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-100">Settings</h1>
        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors">
            <RotateCcw size={14} /> Reset
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors">
            <Save size={14} /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-md transition-colors ${activeTab === tab.id ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'}`}>
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'general' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-200">General</h3>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-400">Default WSL Distro</label>
            <input value={settings.default_wsl_distro} onChange={e => updateSettings({ default_wsl_distro: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50" />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-400">Theme</label>
            <select value={settings.theme} onChange={e => updateSettings({ theme: e.target.value as any })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50">
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-400">Language</label>
            <select value={settings.language} onChange={e => updateSettings({ language: e.target.value as any })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50">
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      )}

      {activeTab === 'git' && (
        <GitDefaultsPanel settings={settings} onUpdate={updateSettings} />
      )}

      {activeTab === 'cloudflare' && (
        <CloudflarePanel settings={settings} onUpdate={updateSettings} />
      )}

      {activeTab === 'wsl' && (
        <WSLConfigPanel />
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm ${toast.type === 'success' ? 'bg-emerald-900/90 text-emerald-300' : 'bg-red-900/90 text-red-300'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
