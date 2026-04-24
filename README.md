# AgentForge — Coding Agent Manager

A local web dashboard for managing multiple AI coding agents (**Claude Code**, **OpenAI Codex**, **Kimi Code**) on Windows with WSL integration. Features real-time terminal views, Git worktree parallelization, task queues, auto-commit scheduling, and Cloudflare Tunnel remote access.

## Features

- **Multi-Agent Management** — Manage Claude Code, Codex, and Kimi Code from a unified dashboard
- **Real-Time Terminals** — xterm.js-powered live terminal for each agent via Socket.io
- **Git Worktree Parallelization** — Each agent gets its own isolated workspace, zero-conflict parallel development
- **Task Queue (Ralph Loop)** — Auto-dispatch tasks, agents continuously pick up new work
- **Auto-Commit** — Configurable interval auto-commits with optional auto-push
- **Cloudflare Tunnel** — One-click secure remote access from anywhere
- **Plan Mode Support** — Batch plan tasks for review before execution
- **Activity Tracking** — Full session logs, commit history, development timeline
- **WSL Integration** — All agents run inside your WSL environment

## Quick Start

### Prerequisites

- **Windows 10/11** with **WSL2** (Ubuntu recommended)
- **Node.js 20+** (install on Windows)
- **Claude Code**, **Codex CLI**, and/or **Kimi Code** installed in WSL
- **Git** configured in WSL

### Install in WSL (Recommended)

```bash
# Clone or extract to your WSL home directory
cd ~
git clone <repo-url> agent-forge
cd agent-forge

# Install dependencies
npm run install:all

# Start development (runs both server + client)
npm run dev
```

The dashboard will open at `http://localhost:5173` (Vite dev server proxies API to port 3000).

### Production Mode

```bash
# Build everything
npm run build

# Start with PM2 (keeps running in background)
npm run pm2:start

# Or start directly
npm start
```

Server runs at `http://localhost:3000`.

### Enable Remote Access (Cloudflare Tunnel)

1. Install `cloudflared` on Windows: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
2. Open Settings page in AgentForge
3. Click "Start" under Cloudflare Tunnel section
4. Your tunnel URL will be displayed — access from anywhere!

## Project Structure

```
agent-forge/
├── server/                    # Backend (Node.js + Express + Socket.io)
│   ├── src/
│   │   ├── services/         # Core business logic
│   │   │   ├── Database.ts       # SQLite persistence
│   │   │   ├── AgentManager.ts   # Agent lifecycle (spawn/kill/PTY)
│   │   │   ├── PTYManager.ts     # node-pty wrapper
│   │   │   ├── WorktreeManager.ts # Git worktree operations
│   │   │   ├── TaskQueue.ts      # Task queue + Ralph Loop
│   │   │   ├── CommitScheduler.ts # Auto-commit via cron
│   │   │   └── CloudflareManager.ts # Tunnel management
│   │   ├── routes/           # REST API endpoints
│   │   ├── utils/            # WSL helpers, Git helpers
│   │   ├── server.ts         # Express + Socket.io setup
│   │   └── index.ts          # Entry point
│   └── pm2.config.js         # PM2 process config
├── client/                    # Frontend (React + Vite + Tailwind)
│   ├── src/
│   │   ├── pages/            # Dashboard, AgentDetail, Tasks, etc.
│   │   ├── components/       # Layout, Dashboard, Terminal, etc.
│   │   ├── hooks/            # useSocket, useAgents, useTasks, useTerminal
│   │   ├── services/         # API client
│   │   ├── context/          # Global state (Socket.io + settings)
│   │   └── App.tsx           # Router setup
│   └── index.html
├── docs/
│   ├── SETUP.md              # Detailed setup guide
│   └── CLOUDFLARE.md         # Cloudflare Tunnel guide
└── package.json              # Root scripts
```

## Architecture

```
Browser (React + xterm.js)
    |
Socket.io + HTTP
    |
AgentForge Server (Node.js)
    |-- AgentManager (node-pty)
    |-- TaskQueue (Ralph Loop)
    |-- CommitScheduler (node-cron)
    |-- WorktreeManager (git via WSL)
    |-- CloudflareManager (cloudflared)
    |
wsl.exe -d Ubuntu -e bash -c "cd /repo && claude -p '...'"
    |
  Claude Code / Codex / Kimi
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev mode (server + client) |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run pm2:start` | Start with PM2 daemon |
| `npm run pm2:stop` | Stop PM2 daemon |
| `npm run pm2:logs` | View PM2 logs |
| `npm run tunnel:start` | Start Cloudflare tunnel |
| `npm run tunnel:stop` | Stop Cloudflare tunnel |

## License

MIT
