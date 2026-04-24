import { useState } from 'react';
import { Globe, Play, Square, ExternalLink, Copy, Check } from 'lucide-react';
import type { AppSettings } from '../../types';
import * as api from '../../services/api';

interface Props {
  settings: AppSettings;
  onUpdate: (patch: Partial<AppSettings>) => void;
}

export default function CloudflarePanel({ settings, onUpdate }: Props) {
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleStart = async () => {
    setStarting(true);
    const res = await api.startTunnel();
    if (res.success && res.data) {
      onUpdate({ cloudflare_enabled: true, cloudflare_tunnel_url: res.data.url });
    }
    setStarting(false);
  };

  const handleStop = async () => {
    setStopping(true);
    await api.stopTunnel();
    onUpdate({ cloudflare_enabled: false, cloudflare_tunnel_url: null });
    setStopping(false);
  };

  const copyUrl = () => {
    if (settings.cloudflare_tunnel_url) {
      navigator.clipboard.writeText(settings.cloudflare_tunnel_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Globe size={18} className="text-blue-400" />
        <h3 className="text-sm font-semibold text-zinc-200">Cloudflare Tunnel</h3>
      </div>
      <p className="text-xs text-zinc-500">Expose your local dashboard to the internet securely via Cloudflare Tunnel.</p>

      <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg p-3">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${settings.cloudflare_enabled ? 'bg-emerald-500 animate-pulse-dot' : 'bg-zinc-600'}`} />
          <span className="text-sm text-zinc-300">{settings.cloudflare_enabled ? 'Running' : 'Stopped'}</span>
        </div>
        {settings.cloudflare_enabled ? (
          <button onClick={handleStop} disabled={stopping} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs rounded-lg transition-colors">
            <Square size={12} /> {stopping ? 'Stopping...' : 'Stop'}
          </button>
        ) : (
          <button onClick={handleStart} disabled={starting} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs rounded-lg transition-colors">
            <Play size={12} /> {starting ? 'Starting...' : 'Start'}
          </button>
        )}
      </div>

      {settings.cloudflare_tunnel_url && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
          <div className="text-xs text-zinc-500 mb-1">Tunnel URL</div>
          <div className="flex items-center gap-2">
            <a href={settings.cloudflare_tunnel_url} target="_blank" rel="noopener noreferrer"
              className="text-sm text-emerald-400 hover:underline flex items-center gap-1 truncate">
              {settings.cloudflare_tunnel_url} <ExternalLink size={12} />
            </a>
            <button onClick={copyUrl} className="p-1 hover:bg-zinc-800 rounded text-zinc-400">
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-xs font-medium text-zinc-400">Tunnel Token (optional)</label>
        <input
          type="password"
          value={settings.cloudflare_token || ''}
          onChange={e => onUpdate({ cloudflare_token: e.target.value })}
          placeholder="Leave empty for quick tunnel"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50"
        />
        <p className="text-[10px] text-zinc-600">If provided, uses a named tunnel. Otherwise creates a temporary trycloudflare.com URL.</p>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-zinc-400">Custom Hostname (optional)</label>
        <input
          type="text"
          value={settings.cloudflare_hostname || ''}
          onChange={e => onUpdate({ cloudflare_hostname: e.target.value })}
          placeholder="your.domain.com"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50"
        />
      </div>
    </div>
  );
}
