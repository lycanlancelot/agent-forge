# AgentForge — Complete Setup Guide

## System Requirements

- **Windows 10/11** (64-bit) with WSL2 enabled
- **Node.js 20+** — https://nodejs.org/
- **WSL2** with Ubuntu
- **4GB RAM** minimum (8GB+ recommended for multiple parallel agents)

## Step 1: Install WSL2 + Ubuntu

```powershell
# PowerShell as Administrator
wsl --install -d Ubuntu
```
Restart, then set up your Ubuntu user account.

## Step 2: Install AI Coding Agents in WSL

```bash
# Claude Code
curl -fsSL https://raw.githubusercontent.com/anthropics/claude-code-cli/main/install.sh | bash

# OpenAI Codex
npm install -g @openai/codex

# Kimi Code
curl -LsSf https://code.kimi.com/install.sh | bash
```

## Step 3: Configure Git in WSL

```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

## Step 4: Install AgentForge

```bash
cd ~
cd agent-forge
npm run install:all
```

## Step 5: Start AgentForge

```bash
npm run dev        # Development mode → http://localhost:5173
# or
npm run build && npm start   # Production → http://localhost:3000
```

## Step 6: Create Your First Agent

1. Open AgentForge Dashboard in your browser
2. Click **"New Agent"** button
3. Configure: Name, Type (Claude/Codex/Kimi), Repo Path
4. Adjust auto-commit, permissions in the config panel
5. Click **Create**

## Step 7: Run Tasks

1. Go to **Tasks** page → **New Task**
2. Enter title and description (the prompt)
3. Set priority, toggle Plan Mode if needed
4. Assign to your agent and start
5. Watch live output in the agent's terminal

## Enabling Ralph Loop

Toggle **Ralph Loop** on the Tasks page. When enabled, agents automatically pick up the next pending task after completing the current one.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "WSL not found" | Run `wsl -l -v` in PowerShell |
| "command not found" for agents | Install the CLI in WSL, check `which claude` |
| Port 3000 in use | Set `PORT=3001` env variable |
| Cloudflare fails | Install `cloudflared` on Windows |
