import type { AgentConfig, AppSettings } from './types';

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  permission_mode: 'auto-edit',
  auto_commit: true,
  commit_interval_minutes: 5,
  auto_push: false,
  dangerously_skip_permissions: true,
  use_plan_mode: false,
  wsl_distro: 'Ubuntu',
  env_vars: {},
};

export const DEFAULT_SETTINGS: AppSettings = {
  cloudflare_enabled: false,
  cloudflare_token: null,
  cloudflare_hostname: null,
  cloudflare_tunnel_url: null,
  default_commit_interval: 5,
  default_auto_commit: true,
  default_auto_push: false,
  default_wsl_distro: 'Ubuntu',
  theme: 'dark',
  language: 'zh',
};

export const AGENT_TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  claude: { label: 'Claude Code', icon: 'Bot', color: '#D97757' },
  codex: { label: 'OpenAI Codex', icon: 'Code2', color: '#10A37F' },
  kimi: { label: 'Kimi Code', icon: 'Sparkles', color: '#4F6EF7' },
};

export const STATUS_META: Record<string, { label: string; color: string }> = {
  idle: { label: 'Idle', color: '#6B7280' },
  running: { label: 'Running', color: '#22C55E' },
  paused: { label: 'Paused', color: '#F59E0B' },
  error: { label: 'Error', color: '#EF4444' },
  completed: { label: 'Completed', color: '#3B82F6' },
};

export const PERMISSION_MODES = [
  { value: 'read-only', label: 'Read Only' },
  { value: 'auto-edit', label: 'Auto Edit' },
  { value: 'full-access', label: 'Full Access' },
] as const;
