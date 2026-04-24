import { useState, useEffect, useCallback } from 'react';
import type { Task } from '../types';
import * as api from '../services/api';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (filter?: { status?: string; agent_id?: string }) => {
    setLoading(true);
    const res = await api.getTasks(filter);
    if (res.success && res.data) setTasks(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (data: Partial<Task>) => {
    const res = await api.createTask(data);
    if (res.success) refresh();
    return res;
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    const res = await api.deleteTask(id);
    if (res.success) refresh();
    return res;
  }, [refresh]);

  return { tasks, loading, refresh, create, remove, pendingTasks: tasks.filter(t => t.status === 'pending') };
}
