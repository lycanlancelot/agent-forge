import { useState, useEffect, useCallback } from 'react';
import type { Agent } from '../types';
import * as api from '../services/api';

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await api.getAgents();
    if (res.success && res.data) setAgents(res.data);
    else setError(res.error || 'Failed to load agents');
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (data: Partial<Agent>) => {
    const res = await api.createAgent(data);
    if (res.success) refresh();
    return res;
  }, [refresh]);

  const update = useCallback(async (id: string, data: Partial<Agent>) => {
    const res = await api.updateAgent(id, data);
    if (res.success) refresh();
    return res;
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    const res = await api.deleteAgent(id);
    if (res.success) refresh();
    return res;
  }, [refresh]);

  return { agents, loading, error, refresh, create, update, remove };
}
