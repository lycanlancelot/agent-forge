import { EventEmitter } from 'events';
import cron from 'node-cron';
import type { AppDatabase } from './Database';
import type { WorktreeManager } from './WorktreeManager';

export class CommitScheduler extends EventEmitter {
  private jobs = new Map<string, cron.ScheduledTask>();

  constructor(private db: AppDatabase, private worktreeManager: WorktreeManager) {
    super();
  }

  start(agentId: string, intervalMinutes: number): void {
    this.stop(agentId);
    // node-cron supports minute-level scheduling, cap at 59 minutes
    const safeInterval = Math.max(1, Math.min(intervalMinutes, 59));
    const cronExpr = `*/${safeInterval} * * * *`;
    const job = cron.schedule(cronExpr, async () => {
      await this.autoCommit(agentId);
    }, { scheduled: true });
    this.jobs.set(agentId, job);
  }

  stop(agentId: string): void {
    const job = this.jobs.get(agentId);
    if (job) {
      job.stop();
      this.jobs.delete(agentId);
    }
  }

  private async autoCommit(agentId: string): Promise<void> {
    const agent = this.db.getAgent(agentId);
    if (!agent || !agent.worktree_path) return;

    const hasChanges = await this.worktreeManager.hasChanges(agent.worktree_path, agent.config.wsl_distro);
    if (!hasChanges) return;

    const now = new Date();
    const message = `[AgentForge] ${agent.name} auto-commit @ ${now.toISOString()}`;
    try {
      const hash = await this.worktreeManager.commitChanges(agent.worktree_path, message, agent.name, agent.config.wsl_distro);
      const stats = await this.worktreeManager.getStatus(agent.worktree_path, agent.config.wsl_distro);
      const commit = this.db.createCommit({
        agent_id: agentId,
        task_id: null,
        commit_hash: hash,
        message,
        branch: agent.branch || 'unknown',
        files_changed: 0, // Could be enhanced with diff stats
        insertions: 0,
        deletions: 0,
        committed_at: Date.now(),
      });
      this.emit('commit:new', { commit });

      if (agent.config.auto_push) {
        const { execGit } = await import('../utils/git');
        await execGit(agent.worktree_path, ['push', 'origin', agent.branch || 'HEAD'], agent.config.wsl_distro);
      }
    } catch (err) {
      console.error('Auto-commit failed:', err);
    }
  }
}
