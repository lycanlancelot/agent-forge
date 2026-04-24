import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Agent, Task, AppSettings, ActivityItem, OverviewStats } from '../types';
import * as api from '../services/api';
import { useSocket } from '../hooks/useSocket';

interface AppContextType {
  settings: AppSettings | null;
  agents: Agent[];
  tasks: Task[];
  stats: OverviewStats | null;
  activity: ActivityItem[];
  socketConnected: boolean;
  refreshAgents: () => void;
  refreshTasks: () => void;
  refreshStats: () => void;
  refreshSettings: () => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  addActivity: (item: ActivityItem) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const { connected: socketConnected, on } = useSocket();

  const refreshAgents = useCallback(async () => {
    const res = await api.getAgents();
    if (res.success && res.data) setAgents(res.data);
  }, []);

  const refreshTasks = useCallback(async () => {
    const res = await api.getTasks();
    if (res.success && res.data) setTasks(res.data);
  }, []);

  const refreshStats = useCallback(async () => {
    const res = await api.getStats();
    if (res.success && res.data) setStats(res.data);
  }, []);

  const refreshSettings = useCallback(async () => {
    const res = await api.getSettings();
    if (res.success && res.data) setSettings(res.data);
  }, []);

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const res = await api.updateSettings(patch);
    if (res.success && res.data) setSettings(res.data);
  }, []);

  const addActivity = useCallback((item: ActivityItem) => {
    setActivity(prev => [item, ...prev].slice(0, 100));
  }, []);

  // Initial load
  useEffect(() => {
    refreshAgents();
    refreshTasks();
    refreshStats();
    refreshSettings();
  }, [refreshAgents, refreshTasks, refreshStats, refreshSettings]);

  // Socket event listeners for real-time updates
  useEffect(() => {
    const unsub1 = on('agent:status', ({ agentId, status }: { agentId: string; status: string }) => {
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: status as any } : a));
      addActivity({ id: Date.now().toString(), timestamp: Date.now(), type: status === 'running' ? 'agent_started' : 'agent_stopped', title: `Agent ${status}`, description: `Agent ${agentId} is now ${status}`, agent_id: agentId });
    });

    const unsub2 = on('task:update', ({ task }: { task: Task }) => {
      setTasks(prev => {
        const exists = prev.find(t => t.id === task.id);
        if (exists) return prev.map(t => t.id === task.id ? task : t);
        return [task, ...prev];
      });
    });

    const unsub3 = on('commit:new', ({ commit }: any) => {
      addActivity({ id: Date.now().toString(), timestamp: Date.now(), type: 'commit_made', title: 'New Commit', description: commit.message, agent_id: commit.agent_id });
    });

    return () => {
      unsub1?.();
      unsub2?.();
      unsub3?.();
    };
  }, [on, addActivity]);

  return (
    <AppContext.Provider value={{
      settings, agents, tasks, stats, activity, socketConnected,
      refreshAgents, refreshTasks, refreshStats, refreshSettings, updateSettings, addActivity
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
