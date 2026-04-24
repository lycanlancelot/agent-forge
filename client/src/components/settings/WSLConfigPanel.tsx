import { useState, useEffect } from 'react';
import { RefreshCw, HardDrive } from 'lucide-react';
import * as api from '../../services/api';

export default function WSLConfigPanel() {
  const [distros, setDistros] = useState<{ name: string; state: string; version: number }[]>([]);
  const [repos, setRepos] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);

  const refreshDistros = async () => {
    const res = await api.getWSLDistros();
    if (res.success && res.data) setDistros(res.data);
  };

  const scanRepos = async () => {
    setScanning(true);
    const res = await api.getSystemRepos();
    if (res.success && res.data) setRepos(res.data);
    setScanning(false);
  };

  useEffect(() => { refreshDistros(); }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <HardDrive size={18} className="text-zinc-400" />
        <h3 className="text-sm font-semibold text-zinc-200">WSL Configuration</h3>
      </div>

      <div>
        <div className="text-xs font-medium text-zinc-400 mb-2">Installed Distros</div>
        <div className="space-y-1">
          {distros.map(d => (
            <div key={d.name} className="flex items-center justify-between text-sm text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2">
              <span>{d.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${d.state === 'Running' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>{d.state}</span>
            </div>
          ))}
          {distros.length === 0 && <div className="text-xs text-zinc-600">No distros found</div>}
        </div>
      </div>

      <div className="pt-2 border-t border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-zinc-400">Git Repositories</span>
          <button onClick={scanRepos} disabled={scanning} className="flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-colors">
            <RefreshCw size={12} className={scanning ? 'animate-spin' : ''} /> {scanning ? 'Scanning...' : 'Scan'}
          </button>
        </div>
        <div className="max-h-48 overflow-y-auto scrollbar-thin space-y-1">
          {repos.map(repo => (
            <div key={repo} className="text-xs text-zinc-400 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 font-mono truncate">{repo}</div>
          ))}
          {repos.length === 0 && !scanning && <div className="text-xs text-zinc-600">Click Scan to find repositories</div>}
        </div>
      </div>
    </div>
  );
}
