# AgentForge — Coding Agent Manager Specification

## Overview

AgentForge is a local web dashboard for managing multiple AI coding agents (Claude Code, OpenAI Codex, Kimi Code) on Windows with WSL integration. It provides real-time terminal views, Git worktree parallelization, task queues, auto-commit scheduling, and Cloudflare Tunnel remote access.

## Target Environment

- **Host OS**: Windows 10/11
- **Agent Runtime**: WSL2 (Ubuntu recommended)
- **Access**: Local browser (`localhost:3000`) + Remote via Cloudflare Tunnel
- **Node.js**: v20+

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (Chrome/Edge/Safari)                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐     │
│  │  Dashboard  │  │  Terminal   │  │  Settings           │     │
│  │  (React)    │  │  (xterm.js) │  │  (Cloudflare, etc)│     │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘     │
│         └─────────────────┴────────────────────┘                │
│                    Socket.io + HTTP                              │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│  AgentForge Server (Node.js + Express + Socket.io)               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐    │
│  │ AgentManager │ │ WorktreeMgr  │ │  CommitScheduler     │    │
│  │ PTYManager   │ │ TaskQueue    │ │  CloudflareManager   │    │
│  └──────┬───────┘ └──────┬───────┘ └──────────┬───────────┘    │
│         └─────────────────┴────────────────────┘                │
│                    node-pty + child_process                       │
│                         │                                       │
│              ┌──────────┴──────────┐                            │
│              │  WSL (Ubuntu)       │                            │
│              │  ┌─────┐┌─────┐┌───┐│                            │
│              │  │claude││codex││kimi││                            │
│              │  └─────┘└─────┘└───┘│                            │
│              └───────────────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

### Backend
- **Runtime**: Node.js 20 + TypeScript
- **Server**: Express 4.x
- **Real-time**: Socket.io 4.x
- **PTY**: node-pty 1.x (for interactive terminal sessions)
- **Database**: SQLite3 (better-sqlite3 11.x)
- **Scheduling**: node-cron 3.x
- **Process Management**: PM2 (user-managed externally)
- **WSL Bridge**: `wsl.exe -d <distro> -e <command>` via child_process

### Frontend
- **Framework**: React 19 + TypeScript
- **Build**: Vite 7.x
- **Styling**: Tailwind CSS 3.4
- **Components**: shadcn/ui + Radix UI primitives
- **Terminal**: xterm.js 5.x + xterm-addon-fit
- **Routing**: React Router 7 (HashRouter)
- **Charts**: Recharts 2.x
- **Icons**: Lucide React
- **State**: React hooks + Context (no global state library needed)
- **API Client**: Socket.io-client + fetch

## Data Models

### Agent
```typescript
interface Agent {
  id: string;                    // UUID
  name: string;                  // e.g., "Auth Feature Agent"
  type: 'claude' | 'codex' | 'kimi';
  status: 'idle' | 'running' | 'paused' | 'error' | 'completed';
  worktree_path: string | null;  // Absolute path in WSL
  repo_path: string;             // Absolute path to git repo in WSL
  branch: string | null;
  created_at: number;            // Unix timestamp
  updated_at: number;
  config: AgentConfig;
}

interface AgentConfig {
  model?: string;                // e.g., "claude-sonnet-4", "gpt-5.4"
  permission_mode: 'read-only' | 'auto-edit' | 'full-access';
  auto_commit: boolean;
  commit_interval_minutes: number; // default: 5
  auto_push: boolean;
  dangerously_skip_permissions: boolean; // maps to --dangerously-skip-permissions
  use_plan_mode: boolean;        // Always start with /plan or --permission-mode plan
  wsl_distro: string;            // e.g., "Ubuntu"
  env_vars: Record<string, string>;
  system_prompt_append?: string;
}
```

### Task
```typescript
interface Task {
  id: string;
  agent_id: string | null;       // null = unassigned
  title: string;
  description: string;           // Full prompt text
  status: 'pending' | 'assigned' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  plan_mode: boolean;
  auto_commit: boolean | null;   // null = use agent default
  commit_interval_minutes: number | null;
  priority: number;              // 1-10, higher = more urgent
  created_at: number;
  started_at: number | null;
  completed_at: number | null;
  exit_code: number | null;
  output_summary: string | null;
  error_message: string | null;
}
```

### Commit
```typescript
interface Commit {
  id: string;
  agent_id: string;
  task_id: string | null;
  commit_hash: string;
  message: string;
  branch: string;
  files_changed: number;
  insertions: number;
  deletions: number;
  committed_at: number;
}
```

### Worktree
```typescript
interface WorktreeEntry {
  id: string;
  repo_path: string;
  worktree_path: string;
  branch: string;
  agent_id: string | null;
  task_id: string | null;
  status: 'active' | 'cleaning' | 'removed';
  created_at: number;
}
```

### SessionLog
```typescript
interface SessionLog {
  id: string;
  agent_id: string;
  task_id: string | null;
  timestamp: number;
  type: 'stdout' | 'stderr' | 'system' | 'user_input';
  content: string;
}
```

### Settings
```typescript
interface AppSettings {
  // Cloudflare Tunnel
  cloudflare_enabled: boolean;
  cloudflare_token: string | null;   // Tunnel token
  cloudflare_hostname: string | null; // Custom domain (optional)
  cloudflare_tunnel_url: string | null; // Current tunnel URL

  // Git defaults
  default_commit_interval: number;   // minutes
  default_auto_commit: boolean;
  default_auto_push: boolean;

  // WSL defaults
  default_wsl_distro: string;

  // UI
  theme: 'dark' | 'light' | 'system';
  language: 'zh' | 'en';
}
```

## API Specification

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List all agents |
| POST | `/api/agents` | Create agent |
| GET | `/api/agents/:id` | Get agent details |
| PATCH | `/api/agents/:id` | Update agent |
| DELETE | `/api/agents/:id` | Delete agent (stops if running) |
| POST | `/api/agents/:id/start` | Start agent with a task |
| POST | `/api/agents/:id/stop` | Stop agent |
| POST | `/api/agents/:id/pause` | Pause agent |
| POST | `/api/agents/:id/resume` | Resume agent |
| POST | `/api/agents/:id/input` | Send input to agent PTY |
| GET | `/api/agents/:id/logs` | Get recent session logs |
| GET | `/api/tasks` | List tasks (query: status, agent_id) |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Get task |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/api/tasks/:id/assign/:agentId` | Assign to agent |
| POST | `/api/tasks/:id/start` | Start task on assigned agent |
| POST | `/api/tasks/:id/cancel` | Cancel task |
| GET | `/api/worktrees` | List worktrees |
| POST | `/api/worktrees` | Create worktree |
| DELETE | `/api/worktrees/:id` | Remove worktree |
| POST | `/api/worktrees/:id/prune` | Prune worktree (git worktree prune) |
| GET | `/api/commits` | List commits |
| GET | `/api/commits/stats` | Commit statistics |
| GET | `/api/stats/overview` | Dashboard overview stats |
| GET | `/api/stats/activity` | Activity timeline |
| GET | `/api/settings` | Get settings |
| PATCH | `/api/settings` | Update settings |
| POST | `/api/settings/tunnel/start` | Start Cloudflare tunnel |
| POST | `/api/settings/tunnel/stop` | Stop Cloudflare tunnel |
| GET | `/api/settings/tunnel/status` | Get tunnel status |
| GET | `/api/system/repos` | Scan for git repos in WSL |
| GET | `/api/system/wsl-distro` | List WSL distros |

### WebSocket Events (Socket.io)

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `agent:connect` | Client → Server | `{ agentId: string }` | Subscribe to agent updates |
| `agent:disconnect` | Client → Server | `{ agentId: string }` | Unsubscribe |
| `agent:terminal` | Client → Server | `{ agentId: string, input: string }` | Send terminal input |
| `agent:terminal:resize` | Client → Server | `{ agentId: string, cols: number, rows: number }` | Resize PTY |
| `agent:output` | Server → Client | `{ agentId: string, data: string }` | PTY output chunk |
| `agent:status` | Server → Client | `{ agentId: string, status: AgentStatus }` | Status change |
| `agent:exit` | Server → Client | `{ agentId: string, code: number }` | Agent process exited |
| `task:update` | Server → Client | `{ task: Task }` | Task status update |
| `commit:new` | Server → Client | `{ commit: Commit }` | New commit made |
| `system:stats` | Server → Client | `{ stats: OverviewStats }` | Periodic stats broadcast |

## Module Specification

### 1. Database (server/src/services/Database.ts)

Singleton class wrapping better-sqlite3.

**Constructor**: `new Database(dbPath: string)`

**Methods**:
- `initSchema(): void` — Create all tables on first run
- `getAgents(): Agent[]`
- `getAgent(id: string): Agent | null`
- `createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'updated_at'>): Agent`
- `updateAgent(id: string, patch: Partial<Agent>): Agent`
- `deleteAgent(id: string): void`
- `getTasks(filter?: { status?: string; agent_id?: string }): Task[]`
- `getTask(id: string): Task | null`
- `createTask(task: Omit<Task, 'id' | 'created_at'>): Task`
- `updateTask(id: string, patch: Partial<Task>): Task`
- `deleteTask(id: string): void`
- `getCommits(agentId?: string, limit?: number): Commit[]`
- `createCommit(commit: Omit<Commit, 'id'>): Commit`
- `getWorktrees(): WorktreeEntry[]`
- `createWorktree(wt: Omit<WorktreeEntry, 'id' | 'created_at'>): WorktreeEntry`
- `updateWorktree(id: string, patch: Partial<WorktreeEntry>): WorktreeEntry`
- `deleteWorktree(id: string): void`
- `getSessionLogs(agentId: string, limit?: number): SessionLog[]`
- `addSessionLog(log: Omit<SessionLog, 'id'>): SessionLog`
- `getSettings(): AppSettings`
- `updateSettings(patch: Partial<AppSettings>): AppSettings`

**Schema**:
```sql
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('claude','codex','kimi')),
  status TEXT NOT NULL DEFAULT 'idle' CHECK(status IN ('idle','running','paused','error','completed')),
  worktree_path TEXT,
  repo_path TEXT NOT NULL,
  branch TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  config TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  agent_id TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','assigned','running','paused','completed','failed','cancelled')),
  plan_mode INTEGER NOT NULL DEFAULT 0,
  auto_commit INTEGER,
  commit_interval_minutes INTEGER,
  priority INTEGER NOT NULL DEFAULT 5,
  created_at INTEGER NOT NULL,
  started_at INTEGER,
  completed_at INTEGER,
  exit_code INTEGER,
  output_summary TEXT,
  error_message TEXT,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL
);

CREATE TABLE commits (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  task_id TEXT,
  commit_hash TEXT,
  message TEXT NOT NULL,
  branch TEXT NOT NULL,
  files_changed INTEGER NOT NULL DEFAULT 0,
  insertions INTEGER NOT NULL DEFAULT 0,
  deletions INTEGER NOT NULL DEFAULT 0,
  committed_at INTEGER NOT NULL,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

CREATE TABLE worktrees (
  id TEXT PRIMARY KEY,
  repo_path TEXT NOT NULL,
  worktree_path TEXT NOT NULL UNIQUE,
  branch TEXT NOT NULL,
  agent_id TEXT,
  task_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL
);

CREATE TABLE session_logs (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  task_id TEXT,
  timestamp INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('stdout','stderr','system','user_input')),
  content TEXT NOT NULL,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

### 2. AgentManager (server/src/services/AgentManager.ts)

Manages running agent processes via node-pty.

**Interface**:
```typescript
class AgentManager {
  constructor(db: Database, ptyManager: PTYManager);

  // Core lifecycle
  async startAgent(agentId: string, taskId?: string): Promise<void>;
  async stopAgent(agentId: string): Promise<void>;
  async pauseAgent(agentId: string): Promise<void>;
  async resumeAgent(agentId: string): Promise<void>;
  async sendInput(agentId: string, input: string): Promise<void>;
  async resizeTerminal(agentId: string, cols: number, rows: number): Promise<void>;

  // Queries
  getRunningAgents(): { agentId: string; pid: number }[];
  getAgentStatus(agentId: string): AgentStatus | null;

  // Events (EventEmitter)
  // 'output' → { agentId, data }
  // 'status' → { agentId, status }
  // 'exit' → { agentId, code, signal }
}
```

**Agent Start Logic**:
1. Look up agent + config from DB
2. Resolve worktree_path (create if needed via WorktreeManager)
3. Build command based on agent type:
   - **Claude**: `claude -p "<task_description>" --dangerously-skip-permissions --output-format stream-json` (or without -p for interactive)
   - **Codex**: `codex exec "<task_description>"` (or `codex` for interactive)
   - **Kimi**: `kimi -c "<task_description>"` (or `kimi` for interactive)
4. If WSL: prepend `wsl.exe -d <distro> -e bash -c "cd <path> && <command>"`
5. Spawn PTY via PTYManager
6. Update DB status → 'running'
7. Emit events

**Agent Stop Logic**:
1. Send SIGINT to PTY process
2. Wait 5s, then SIGKILL if still running
3. Update DB status → 'idle' or 'error'

### 3. PTYManager (server/src/services/PTYManager.ts)

Wraps node-pty for cross-platform PTY support.

**Interface**:
```typescript
class PTYManager {
  spawn(command: string, args: string[], options: {
    cwd?: string;
    env?: Record<string, string>;
    cols?: number;
    rows?: number;
  }): { pid: number; write: (data: string) => void; resize: (cols: number, rows: number) => void; kill: (signal?: string) => void; onData: (cb: (data: string) => void) => void; onExit: (cb: (code: number, signal?: number) => void) => void };
}
```

**Implementation Notes**:
- On Windows, use `winpty` or `conpty` (node-pty handles this automatically)
- For WSL commands, spawn `wsl.exe` directly
- Buffer output and emit in chunks
- Handle resize events from frontend xterm.js

### 4. WorktreeManager (server/src/services/WorktreeManager.ts)

Manages Git worktrees for parallel agent execution.

**Interface**:
```typescript
class WorktreeManager {
  constructor(db: Database);

  async createWorktree(repoPath: string, branch: string, baseBranch?: string): Promise<WorktreeEntry>;
  async removeWorktree(worktreeId: string): Promise<void>;
  async listWorktrees(repoPath: string): Promise<WorktreeEntry[]>;
  async pruneWorktrees(repoPath: string): Promise<void>;
  async commitChanges(worktreePath: string, message: string, author?: string): Promise<string>; // returns commit hash
  async hasChanges(worktreePath: string): Promise<boolean>;
  async getStatus(worktreePath: string): Promise<{ branch: string; ahead: number; behind: number; modified: string[] }>;
}
```

**Implementation**:
- Execute git commands via `child_process.exec` through WSL
- Branch naming: `agentforge/<agent_name>_<timestamp>`
- Cleanup on worktree remove: `git worktree remove <path>` then `git worktree prune`

### 5. TaskQueue (server/src/services/TaskQueue.ts)

Manages pending tasks and auto-assigns to idle agents.

**Interface**:
```typescript
class TaskQueue {
  constructor(db: Database, agentManager: AgentManager);

  async enqueue(task: Omit<Task, 'id' | 'created_at' | 'status'>): Promise<Task>;
  async dequeue(agentId: string): Promise<Task | null>; // Claim next pending task
  async processNext(agentId: string): Promise<boolean>; // Auto-start if task available

  // Ralph Loop mode
  startRalphLoop(agentId: string): void; // Auto pick next task when idle
  stopRalphLoop(agentId: string): void;

  // Events
  // 'task:assigned' → { task, agentId }
  // 'task:started' → { task }
  // 'task:completed' → { task }
}
```

### 6. CommitScheduler (server/src/services/CommitScheduler.ts)

Auto-commits changes at configured intervals.

**Interface**:
```typescript
class CommitScheduler {
  constructor(db: Database, worktreeManager: WorktreeManager);

  start(agentId: string, intervalMinutes: number): void;
  stop(agentId: string): void;

  // Internal: cron job per agent
  private async autoCommit(agentId: string): Promise<void>;
}
```

**Auto-commit flow**:
1. Check agent has changes via `WorktreeManager.hasChanges()`
2. If yes, commit with message: `[AgentForge] <agent_name> auto-commit @ <timestamp>`
3. If `auto_push` enabled, run `git push origin <branch>`
4. Record commit in DB, emit `commit:new` event

### 7. CloudflareManager (server/src/services/CloudflareManager.ts)

Manages Cloudflare Tunnel lifecycle.

**Interface**:
```typescript
class CloudflareManager {
  constructor(settings: AppSettings);

  async start(localPort: number): Promise<string>; // Returns tunnel URL
  async stop(): Promise<void>;
  getStatus(): { running: boolean; url: string | null; pid: number | null };
}
```

**Implementation**:
- Spawns `cloudflared tunnel --url http://localhost:<port>` for quick tunnels
- Or uses `cloudflared tunnel run` for named tunnels with token
- Parses stdout to extract tunnel URL
- Stores URL in settings

## Frontend Page Structure

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Main overview: agent cards, stats, activity feed |
| Agent Detail | `/agent/:id` | Full terminal + task history + settings for one agent |
| Tasks | `/tasks` | Task queue management: create, assign, prioritize |
| Worktrees | `/worktrees` | Git worktree browser: create, view, cleanup |
| Commits | `/commits` | Commit history across all agents |
| Settings | `/settings` | App settings, Cloudflare Tunnel, WSL config |

## Frontend Component Spec

### Layout
- **Navbar**: Left sidebar (collapsible), dark theme. Links: Dashboard, Tasks, Worktrees, Commits, Settings. Shows agent count badges.
- **Top bar**: App title "AgentForge", connection status indicator, theme toggle.

### DashboardPage
- **Stats cards** (top row): Active Agents, Pending Tasks, Commits Today, Total Worktrees
- **Agent grid**: Cards for each agent. Shows: name, type (icon), status (colored badge), current task, live terminal preview (last 3 lines), action buttons (start/stop/pause).
- **Activity feed**: Real-time log of system events (agent started, task completed, commit made).
- **Quick task input**: Bottom bar to quickly create and dispatch a task.

### AgentDetailPage
- **Split view**: Left = terminal (70%), Right = info panel (30%)
- **Terminal**: Full xterm.js instance, connected via Socket.io. Supports typing input.
- **Info panel**: Agent config, current task details, git status, commit history (last 5), action buttons.
- **Task assignment**: Dropdown to assign a pending task to this agent.

### TasksPage
- **Task board**: Kanban-style columns (Pending, Assigned, Running, Completed, Failed)
- **Create task**: Modal form with title, description, priority, plan_mode toggle, agent assignment.
- **Ralph Loop toggle**: Switch to enable automatic task consumption.

### WorktreesPage
- **Worktree list**: Table with repo, branch, agent, status, created date.
- **Actions**: Create new, remove, view in file explorer (via `explorer.exe \\wsl$\...`)
- **Branch graph**: Simple visualization of branches/worktrees.

### CommitsPage
- **Commit timeline**: Chronological list with hash, message, branch, stats.
- **Charts**: Commits per agent (bar chart), commits over time (line chart).
- **Filter**: By agent, by date range.

### SettingsPage
- **General**: Theme, language, default paths.
- **Git defaults**: Auto-commit toggle, interval, auto-push.
- **Cloudflare Tunnel**: Start/stop, status display, URL display.
- **WSL**: Default distro selector, repo scan paths.
- **Agent defaults**: Default permission mode, model selection.

## Backend Routes Implementation

All routes return JSON with consistent wrapper:
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

Error handling: Express error middleware returns `{ success: false, error: message }` with appropriate HTTP status.

## File Structure

```
agent-forge/
├── package.json                     # Root workspace config
├── README.md
├── docs/
│   ├── SETUP.md
│   ├── CLOUDFLARE.md
│   └── ARCHITECTURE.md
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── data/                        # SQLite DB (gitignored)
│   ├── src/
│   │   ├── index.ts                  # Entry: init DB, start server
│   │   ├── server.ts                 # Express + Socket.io setup
│   │   ├── constants.ts              # Default values, agent CLI templates
│   │   ├── types.ts                  # All TypeScript interfaces
│   │   ├── routes/
│   │   │   ├── agents.ts
│   │   │   ├── tasks.ts
│   │   │   ├── worktrees.ts
│   │   │   ├── commits.ts
│   │   │   ├── stats.ts
│   │   │   ├── settings.ts
│   │   │   └── system.ts
│   │   ├── services/
│   │   │   ├── Database.ts
│   │   │   ├── AgentManager.ts
│   │   │   ├── PTYManager.ts
│   │   │   ├── WorktreeManager.ts
│   │   │   ├── TaskQueue.ts
│   │   │   ├── CommitScheduler.ts
│   │   │   └── CloudflareManager.ts
│   │   └── utils/
│   │       ├── wsl.ts                # WSL command helpers
│   │       ├── git.ts                # Git command helpers
│   │       └── id.ts                 # UUID generation
│   └── pm2.config.js                 # PM2 process config
├── client/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx                   # HashRouter + routes
│       ├── index.css                 # Tailwind + global styles
│       ├── types.ts                  # Shared types (mirror server)
│       ├── hooks/
│       │   ├── useSocket.ts          # Socket.io connection
│       │   ├── useAgents.ts          # Agent data + CRUD
│       │   ├── useTasks.ts           # Task data + CRUD
│       │   └── useTerminal.ts        # xterm.js lifecycle
│       ├── services/
│       │   └── api.ts                # Fetch API wrapper
│       ├── context/
│       │   └── AppContext.tsx        # Global settings context
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Navbar.tsx
│       │   │   ├── TopBar.tsx
│       │   │   └── Layout.tsx
│       │   ├── dashboard/
│       │   │   ├── StatCard.tsx
│       │   │   ├── AgentCard.tsx
│       │   │   ├── ActivityFeed.tsx
│       │   │   └── QuickTaskBar.tsx
│       │   ├── agent/
│       │   │   ├── Terminal.tsx        # xterm.js component
│       │   │   ├── AgentInfoPanel.tsx
│       │   │   └── AgentTaskAssign.tsx
│       │   ├── tasks/
│       │   │   ├── TaskBoard.tsx
│       │   │   ├── TaskCard.tsx
│       │   │   └── CreateTaskModal.tsx
│       │   ├── worktrees/
│       │   │   ├── WorktreeTable.tsx
│       │   │   └── CreateWorktreeModal.tsx
│       │   ├── commits/
│       │   │   ├── CommitTimeline.tsx
│       │   │   └── CommitStats.tsx
│       │   └── settings/
│       │       ├── CloudflarePanel.tsx
│       │       ├── GitDefaultsPanel.tsx
│       │       └── WSLConfigPanel.tsx
│       └── pages/
│           ├── Dashboard.tsx
│           ├── AgentDetail.tsx
│           ├── Tasks.tsx
│           ├── Worktrees.tsx
│           ├── Commits.tsx
│           └── Settings.tsx
```

## Default Configuration

```typescript
const DEFAULT_AGENT_CONFIG: AgentConfig = {
  permission_mode: 'auto-edit',
  auto_commit: true,
  commit_interval_minutes: 5,
  auto_push: false,
  dangerously_skip_permissions: true,
  use_plan_mode: false,
  wsl_distro: 'Ubuntu',
  env_vars: {},
};

const DEFAULT_SETTINGS: AppSettings = {
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
```

## Agent CLI Command Templates

```typescript
function buildAgentCommand(agent: Agent, task?: Task): { command: string; args: string[] } {
  const cwd = agent.worktree_path || agent.repo_path;

  switch (agent.type) {
    case 'claude': {
      const args: string[] = [];
      if (task) {
        args.push('-p', task.description);
      }
      if (agent.config.dangerously_skip_permissions) {
        args.push('--dangerously-skip-permissions');
      }
      if (agent.config.use_plan_mode || task?.plan_mode) {
        args.push('--permission-mode', 'plan');
      }
      if (agent.config.model) {
        args.push('--model', agent.config.model);
      }
      args.push('--output-format', 'stream-json');
      return { command: 'claude', args };
    }

    case 'codex': {
      const args: string[] = [];
      if (task) {
        args.push('exec', task.description);
      }
      // Codex uses approval modes: auto, suggest, ask
      // Map permission_mode to approval mode
      return { command: 'codex', args };
    }

    case 'kimi': {
      const args: string[] = [];
      if (task) {
        args.push('-c', task.description);
      }
      return { command: 'kimi', args };
    }
  }
}

function wrapWSL(command: string, args: string[], distro: string, cwd: string): { command: string; args: string[] } {
  const inner = `${command} ${args.map(a => `"${a.replace(/"/g, '\\"')}"`).join(' ')}`;
  const wslCmd = `cd "${cwd}" && ${inner}`;
  return {
    command: 'wsl.exe',
    args: ['-d', distro, '-e', 'bash', '-c', wslCmd],
  };
}
```

## Error Handling Strategy

1. **Agent spawn errors**: Catch and store in `error_message`, set status to 'error', emit event.
2. **Git command errors**: Log but don't crash. Return empty results with error field.
3. **WSL not available**: Detect on startup, show warning in settings.
4. **Cloudflare errors**: Non-fatal. Show status in UI.
5. **Database errors**: Fatal on startup, logged on runtime.

## Security Considerations

1. **Localhost only by default**: Server binds to `127.0.0.1:3000`.
2. **Cloudflare Tunnel**: Provides HTTPS termination without opening ports.
3. **No auth by default**: This is a local dev tool. Users can add Cloudflare Access if needed.
4. **Agent permissions**: Clearly labeled in UI. Default to `dangerously-skip-permissions = true` for autonomy.
