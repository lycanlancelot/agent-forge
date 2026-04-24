import { EventEmitter } from 'events';
import type { AppDatabase } from './Database';
import type { PTYManager } from './PTYManager';
import type { WorktreeManager } from './WorktreeManager';
import type { CommitScheduler } from './CommitScheduler';
import type { Agent, Task, AgentType, AgentConfig } from '../types';
import { execWSL } from '../utils/wsl';

interface ActiveSession {
  pty: ReturnType<PTYManager['spawn']>;
  agentId: string;
  taskId?: string;
  startTime: number;
}

const OUTPUT_BUFFER_SIZE = 500;

export class AgentManager extends EventEmitter {
  private sessions = new Map<string, ActiveSession>();
  private outputBuffers = new Map<string, string[]>();

  getOutputBuffer(agentId: string): string[] {
    return this.outputBuffers.get(agentId) ?? [];
  }

  constructor(
    private db: AppDatabase,
    private ptyManager: PTYManager,
    private worktreeManager: WorktreeManager,
    private commitScheduler?: CommitScheduler
  ) {
    super();
  }

  private buildAgentCommand(agent: Agent, task?: Task): { command: string; args: string[] } {
    const cfg = agent.config;
    const taskDesc = task?.description || '';

    switch (agent.type) {
      case 'claude': {
        const args: string[] = [];
        if (taskDesc) {
          args.push('--print', taskDesc);
          args.push('--output-format', 'text');
        }
        if (cfg.dangerously_skip_permissions) args.push('--dangerously-skip-permissions');
        if (cfg.use_plan_mode || task?.plan_mode) args.push('--permission-mode', 'plan');
        if (cfg.model) args.push('--model', cfg.model);
        return { command: 'claude', args };
      }
      case 'codex': {
        const args: string[] = [];
        if (taskDesc) args.push('exec', taskDesc);
        return { command: 'codex', args };
      }
      case 'kimi': {
        const args: string[] = [];
        if (taskDesc) args.push('-c', taskDesc);
        return { command: 'kimi', args };
      }
      default:
        throw new Error(`Unknown agent type: ${agent.type}`);
    }
  }

  private wrapWSL(command: string, args: string[], distro: string, cwd: string): { command: string; args: string[] } {
    const escaped = args.map(a => `"${a.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(' ');
    const inner = `${command} ${escaped}`;
    const wslCmd = `cd "${cwd}" && ${inner}`;
    if (process.platform !== 'win32') {
      // Native Linux/macOS: run directly via bash
      return { command: 'bash', args: ['-c', wslCmd] };
    }
    // Windows: route through WSL
    return { command: 'wsl.exe', args: ['-d', distro, '-e', 'bash', '-c', wslCmd] };
  }

  async startAgent(agentId: string, taskId?: string): Promise<void> {
    const agent = this.db.getAgent(agentId);
    if (!agent) throw new Error('Agent not found');
    if (agent.status === 'running') throw new Error('Agent already running');

    try {
      // Ensure worktree exists
      let worktreePath = agent.worktree_path;
      if (!worktreePath) {
        const branch = `agentforge/${agent.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
        const wt = await this.worktreeManager.createWorktree(agent.repo_path, branch, 'main', agent.config.wsl_distro);
        worktreePath = wt.worktree_path;
        this.db.updateAgent(agentId, { worktree_path: worktreePath, branch: wt.branch });
      }

      const task = taskId ? this.db.getTask(taskId) : undefined;
      if (taskId && !task) throw new Error('Task not found');

      const { command, args } = this.buildAgentCommand(agent, task || undefined);
      const distro = agent.config.wsl_distro;

      const finalCmd = this.wrapWSL(command, args, distro, worktreePath);

      // Strip Claude Code parent-session markers so nested `claude` CLI can start
      const CLAUDE_NESTED_VARS = new Set([
        'CLAUDECODE', 'CLAUDE_CODE_ENTRYPOINT', 'CLAUDE_CODE_ENABLE_SDK_FILE_CHECKPOINTING',
        'CLAUDE_CODE_EXECPATH', 'CLAUDE_PLUGIN_DATA',
      ]);
      const pty = this.ptyManager.spawn(finalCmd.command, finalCmd.args, {
        cols: 120,
        rows: 40,
        cwd: process.cwd(),
        env: Object.fromEntries(
          Object.entries({ ...process.env, ...agent.config.env_vars })
            .filter((entry): entry is [string, string] =>
              entry[1] !== undefined && !CLAUDE_NESTED_VARS.has(entry[0])
            )
        ),
      });

      const session: ActiveSession = { pty, agentId, taskId: taskId || undefined, startTime: Date.now() };
      this.sessions.set(agentId, session);

      // Wire PTY events
      this.outputBuffers.set(agentId, []);
      pty.onData((data) => {
        const buf = this.outputBuffers.get(agentId) ?? [];
        buf.push(data);
        if (buf.length > OUTPUT_BUFFER_SIZE) buf.shift();
        this.outputBuffers.set(agentId, buf);
        this.emit('output', { agentId, data });
        this.db.addSessionLog({ agent_id: agentId, task_id: taskId || null, timestamp: Date.now(), type: 'stdout', content: data });
      });

      pty.onExit((code, signal) => {
        const session = this.sessions.get(agentId);
        const wasManualStop = (session as any)?._manualStop;
        this.sessions.delete(agentId);
        this.outputBuffers.delete(agentId);
        this.commitScheduler?.stop(agentId);
        // Agent always returns to idle after exit so Ralph Loop can pick up next task
        this.db.updateAgent(agentId, { status: 'idle', updated_at: Date.now() });
        if (taskId) {
          const taskStatus = wasManualStop ? 'cancelled' : (code === 0 ? 'completed' : 'failed');
          this.db.updateTask(taskId, { status: taskStatus as any, completed_at: Date.now(), exit_code: code });
        }
        this.emit('exit', { agentId, code, signal });
        this.emit('status', { agentId, status: 'idle' });
      });

      // Update DB status
      this.db.updateAgent(agentId, { status: 'running', updated_at: Date.now() });
      if (taskId) {
        this.db.updateTask(taskId, { status: 'running', started_at: Date.now() });
      }

      // Start auto-commit scheduler if enabled
      if (this.commitScheduler && agent.config.auto_commit) {
        this.commitScheduler.start(agentId, agent.config.commit_interval_minutes);
      }

      this.emit('status', { agentId, status: 'running' });
    } catch (err: any) {
      // Reset agent state on failure
      this.db.updateAgent(agentId, { status: 'error', updated_at: Date.now() });
      this.emit('status', { agentId, status: 'error' });
      throw err;
    }
  }

  async stopAgent(agentId: string): Promise<void> {
    const session = this.sessions.get(agentId);
    if (!session) {
      // Not running, just update status
      this.db.updateAgent(agentId, { status: 'idle', updated_at: Date.now() });
      this.emit('status', { agentId, status: 'idle' });
      return;
    }

    this.commitScheduler?.stop(agentId);
    // Mark as manually stopped so onExit sets idle instead of error
    (session as any)._manualStop = true;
    session.pty.kill('SIGINT');
    // Give 5s grace period, then force kill
    setTimeout(() => {
      if (this.sessions.has(agentId)) {
        try { session.pty.kill('SIGKILL'); } catch {}
        this.sessions.delete(agentId);
        this.db.updateAgent(agentId, { status: 'idle', updated_at: Date.now() });
        this.emit('status', { agentId, status: 'idle' });
      }
    }, 5000);
  }

  async pauseAgent(agentId: string): Promise<void> {
    const session = this.sessions.get(agentId);
    if (!session) throw new Error('Agent not running');
    session.pty.kill('SIGSTOP');
    this.db.updateAgent(agentId, { status: 'paused', updated_at: Date.now() });
    this.emit('status', { agentId, status: 'paused' });
  }

  async resumeAgent(agentId: string): Promise<void> {
    const session = this.sessions.get(agentId);
    if (!session) throw new Error('Agent not running');
    session.pty.kill('SIGCONT');
    this.db.updateAgent(agentId, { status: 'running', updated_at: Date.now() });
    this.emit('status', { agentId, status: 'running' });
  }

  async sendInput(agentId: string, input: string): Promise<void> {
    const session = this.sessions.get(agentId);
    if (!session) throw new Error('Agent not running');
    session.pty.write(input);
    this.db.addSessionLog({ agent_id: agentId, task_id: session.taskId || null, timestamp: Date.now(), type: 'user_input', content: input });
  }

  async resizeTerminal(agentId: string, cols: number, rows: number): Promise<void> {
    const session = this.sessions.get(agentId);
    if (!session) return;
    session.pty.resize(cols, rows);
  }

  getRunningAgents(): { agentId: string; pid: number }[] {
    return Array.from(this.sessions.entries()).map(([agentId, s]) => ({ agentId, pid: s.pty.pid }));
  }

  getAgentStatus(agentId: string): string | null {
    const agent = this.db.getAgent(agentId);
    return agent?.status || null;
  }
}
