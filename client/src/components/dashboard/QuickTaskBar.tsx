import { useState } from 'react';
import { Send } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import * as api from '../../services/api';

export default function QuickTaskBar() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const { agents, refreshTasks } = useAppContext();

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const idleAgent = agents.find(a => a.status === 'idle');
    await api.createTask({
      title: text.slice(0, 60),
      description: text,
      agent_id: idleAgent?.id || null,
      priority: 5,
      plan_mode: false,
    });
    setText('');
    refreshTasks();
    setLoading(false);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        placeholder="Describe a task and dispatch to an agent..."
        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
      />
      <button
        onClick={handleSubmit}
        disabled={loading || !text.trim()}
        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors">
        <Send size={14} /> {loading ? 'Dispatching...' : 'Dispatch'}
      </button>
    </div>
  );
}
