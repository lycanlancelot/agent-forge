import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ListTodo, GitBranch, GitCommit,
  Settings, ChevronLeft, ChevronRight, Bot, Circle
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: ListTodo, label: 'Tasks' },
  { to: '/worktrees', icon: GitBranch, label: 'Worktrees' },
  { to: '/commits', icon: GitCommit, label: 'Commits' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Navbar() {
  const [collapsed, setCollapsed] = useState(false);
  const { agents } = useAppContext();
  const location = useLocation();

  return (
    <aside className={`flex flex-col bg-zinc-900 border-r border-zinc-800 transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-zinc-800">
        {!collapsed && <span className="font-bold text-lg text-emerald-400">AgentForge</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-zinc-800 rounded">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-1">
        {navItems.map(item => {
          const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
          return (
            <NavLink key={item.to} to={item.to}
              className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors ${active ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}>
              <item.icon size={20} />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="px-4 py-3 border-t border-zinc-800">
          <div className="text-xs font-semibold text-zinc-500 uppercase mb-2">Active Agents</div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin">
            {agents.filter(a => a.status === 'running').map(agent => (
              <NavLink key={agent.id} to={`/agent/${agent.id}`} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-xs text-zinc-300">
                <Circle size={8} className="fill-emerald-500 text-emerald-500 animate-pulse-dot" />
                <span className="truncate">{agent.name}</span>
              </NavLink>
            ))}
            {agents.filter(a => a.status === 'running').length === 0 && (
              <div className="text-xs text-zinc-600 px-2">No active agents</div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
