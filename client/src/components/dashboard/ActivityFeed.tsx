import { useRef, useEffect } from 'react';
import { Bot, GitCommit, GitBranch, CheckCircle, XCircle, Play, Pause } from 'lucide-react';
import type { ActivityItem } from '../../types';

const typeIcons: Record<string, typeof Play> = {
  agent_started: Play,
  agent_stopped: Pause,
  agent_error: XCircle,
  task_completed: CheckCircle,
  task_failed: XCircle,
  commit_made: GitCommit,
  worktree_created: GitBranch,
};

const typeColors: Record<string, string> = {
  agent_started: 'text-emerald-400',
  agent_stopped: 'text-zinc-400',
  agent_error: 'text-red-400',
  task_completed: 'text-blue-400',
  task_failed: 'text-red-400',
  commit_made: 'text-purple-400',
  worktree_created: 'text-amber-400',
};

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Props {
  items: ActivityItem[];
}

export default function ActivityFeed({ items }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [items]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 h-80 overflow-hidden flex flex-col">
      <h3 className="text-sm font-semibold text-zinc-300 mb-3">Activity Feed</h3>
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2 pr-1">
        {items.length === 0 && (
          <div className="text-xs text-zinc-600 text-center py-8">No activity yet</div>
        )}
        {items.map(item => {
          const Icon = typeIcons[item.type] || Bot;
          return (
            <div key={item.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors">
              <Icon size={14} className={`mt-0.5 shrink-0 ${typeColors[item.type] || 'text-zinc-400'}`} />
              <div className="min-w-0">
                <div className="text-xs font-medium text-zinc-300">{item.title}</div>
                <div className="text-xs text-zinc-500 truncate">{item.description}</div>
                <div className="text-[10px] text-zinc-600 mt-0.5">{relativeTime(item.timestamp)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
