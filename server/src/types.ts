export type AgentType = 'claude' | 'codex' | 'kimi';
export type AgentStatus = 'idle' | 'running' | 'paused' | 'error' | 'completed';
export type TaskStatus = 'pending' | 'assigned' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
export type LogType = 'stdout' | 'stderr' | 'system' | 'user_input';
export type PermissionMode = 'read-only' | 'auto-edit' | 'full-access';
export type Theme = 'dark' | 'light' | 'system';

export interface AgentConfig {
  model?: string;
  permission_mode: PermissionMode;
  auto_commit: boolean;
  commit_interval_minutes: number;
  auto_push: boolean;
  dangerously_skip_permissions: boolean;
  use_plan_mode: boolean;
  wsl_distro: string;
  env_vars: Record<string, string>;
  system_prompt_append?: string;
}

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  worktree_path: string | null;
  repo_path: string;
  branch: string | null;
  created_at: number;
  updated_at: number;
  config: AgentConfig;
}

export interface Task {
  id: string;
  agent_id: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  plan_mode: boolean;
  auto_commit: boolean | null;
  commit_interval_minutes: number | null;
  priority: number;
  created_at: number;
  started_at: number | null;
  completed_at: number | null;
  exit_code: number | null;
  output_summary: string | null;
  error_message: string | null;
}

export interface Commit {
  id: string;
  agent_id: string;
  task_id: string | null;
  commit_hash: string | null;
  message: string;
  branch: string;
  files_changed: number;
  insertions: number;
  deletions: number;
  committed_at: number;
}

export interface WorktreeEntry {
  id: string;
  repo_path: string;
  worktree_path: string;
  branch: string;
  agent_id: string | null;
  task_id: string | null;
  status: 'active' | 'cleaning' | 'removed';
  created_at: number;
}

export interface SessionLog {
  id: string;
  agent_id: string;
  task_id: string | null;
  timestamp: number;
  type: LogType;
  content: string;
}

export interface AppSettings {
  cloudflare_enabled: boolean;
  cloudflare_token: string | null;
  cloudflare_hostname: string | null;
  cloudflare_tunnel_url: string | null;
  default_commit_interval: number;
  default_auto_commit: boolean;
  default_auto_push: boolean;
  default_wsl_distro: string;
  theme: Theme;
  language: 'zh' | 'en';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface OverviewStats {
  totalAgents: number;
  activeAgents: number;
  pendingTasks: number;
  completedTasksToday: number;
  totalCommits: number;
  totalWorktrees: number;
}

export interface ActivityItem {
  id: string;
  timestamp: number;
  type: 'agent_started' | 'agent_stopped' | 'agent_error' | 'task_completed' | 'task_failed' | 'commit_made' | 'worktree_created' | 'system_log' | 'agent_output';
  title: string;
  description: string;
  agent_id?: string;
  task_id?: string;
}

export type TaskRunStatus = 'running' | 'completed' | 'failed' | 'cancelled';

export interface TaskRun {
  id: string;
  task_id: string | null;
  agent_id: string;
  agent_config_snapshot: string;
  repo_head: string | null;
  worktree_path: string | null;
  started_at: number;
  ended_at: number | null;
  status: TaskRunStatus;
  exit_code: number | null;
  summary: string | null;
}

export type EventType = 'run_started' | 'run_ended' | 'agent_output' | 'file_changed' | 'commit_created' | 'test_started' | 'test_failed' | 'approval_requested';

export interface AgentEvent {
  id: string;
  run_id: string;
  agent_id: string;
  task_id: string | null;
  timestamp: number;
  event_type: EventType;
  data: string;
}
