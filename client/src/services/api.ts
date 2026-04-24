import type { ApiResponse, Agent, Task, WorktreeEntry, Commit, AppSettings, OverviewStats } from '../types';

async function apiRequest<T>(method: string, path: string, body?: any): Promise<ApiResponse<T>> {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`/api${path}`, options);
  return res.json();
}

// Agents
export const getAgents = () => apiRequest<Agent[]>('GET', '/agents');
export const createAgent = (data: Partial<Agent>) => apiRequest<Agent>('POST', '/agents', data);
export const updateAgent = (id: string, data: Partial<Agent>) => apiRequest<Agent>('PATCH', `/agents/${id}`, data);
export const deleteAgent = (id: string) => apiRequest<void>('DELETE', `/agents/${id}`);
export const startAgent = (id: string, taskId?: string) => apiRequest<void>('POST', `/agents/${id}/start`, { taskId });
export const stopAgent = (id: string) => apiRequest<void>('POST', `/agents/${id}/stop`);
export const pauseAgent = (id: string) => apiRequest<void>('POST', `/agents/${id}/pause`);
export const resumeAgent = (id: string) => apiRequest<void>('POST', `/agents/${id}/resume`);
export const sendAgentInput = (id: string, input: string) => apiRequest<void>('POST', `/agents/${id}/input`, { input });
export const startRalphLoop = (id: string) => apiRequest<void>('POST', `/agents/${id}/ralph/start`);
export const stopRalphLoop = (id: string) => apiRequest<void>('POST', `/agents/${id}/ralph/stop`);

// Tasks
export const getTasks = (filter?: { status?: string; agent_id?: string }) => {
  const params = new URLSearchParams();
  if (filter?.status) params.set('status', filter.status);
  if (filter?.agent_id) params.set('agent_id', filter.agent_id);
  return apiRequest<Task[]>('GET', `/tasks?${params.toString()}`);
};
export const createTask = (data: Partial<Task>) => apiRequest<Task>('POST', '/tasks', data);
export const updateTask = (id: string, data: Partial<Task>) => apiRequest<Task>('PATCH', `/tasks/${id}`, data);
export const deleteTask = (id: string) => apiRequest<void>('DELETE', `/tasks/${id}`);
export const assignTask = (taskId: string, agentId: string) => apiRequest<Task>('POST', `/tasks/${taskId}/assign/${agentId}`);
export const startTask = (id: string) => apiRequest<Task>('POST', `/tasks/${id}/start`);
export const cancelTask = (id: string) => apiRequest<Task>('POST', `/tasks/${id}/cancel`);

// Worktrees
export const getWorktrees = () => apiRequest<WorktreeEntry[]>('GET', '/worktrees');
export const createWorktree = (data: Partial<WorktreeEntry>) => apiRequest<WorktreeEntry>('POST', '/worktrees', data);
export const deleteWorktree = (id: string) => apiRequest<void>('DELETE', `/worktrees/${id}`);

// Commits
export const getCommits = (agentId?: string) => apiRequest<Commit[]>('GET', `/commits${agentId ? `?agent_id=${agentId}` : ''}`);
export const getCommitStats = () => apiRequest<any>('GET', '/commits/stats');

// Stats
export const getStats = () => apiRequest<OverviewStats>('GET', '/stats/overview');

// Settings
export const getSettings = () => apiRequest<AppSettings>('GET', '/settings');
export const updateSettings = (data: Partial<AppSettings>) => apiRequest<AppSettings>('PATCH', '/settings', data);
export const startTunnel = () => apiRequest<{ url: string }>('POST', '/settings/tunnel/start');
export const stopTunnel = () => apiRequest<void>('POST', '/settings/tunnel/stop');
export const getTunnelStatus = () => apiRequest<any>('GET', '/settings/tunnel/status');

// System
export const getSystemRepos = () => apiRequest<string[]>('GET', '/system/repos');
export const getWSLDistros = () => apiRequest<{ name: string; state: string; version: number }[]>('GET', '/system/wsl-distro');
