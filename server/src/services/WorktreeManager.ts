import type { AppDatabase } from './Database';
import type { WorktreeEntry } from '../types';
import { generateId } from '../utils/id';
import { execWSL } from '../utils/wsl';
import { execGit, getRepoStatus, getCommitStats } from '../utils/git';

export class WorktreeManager {
  constructor(private db: AppDatabase) {}

  async createWorktree(repoPath: string, branch: string, baseBranch: string = 'main', distro: string = 'Ubuntu'): Promise<WorktreeEntry> {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const worktreeName = `agentforge-${branch.replace(/\//g, '-')}-${timestamp}-${randomSuffix}`;
    const parentDir = repoPath.replace(/\/[^\/]+$/, '');
    const worktreePath = `${parentDir}/${worktreeName}`;

    // Auto-detect current branch if baseBranch doesn't exist
    try {
      await execWSL(distro, `cd "${repoPath}" && git rev-parse --verify "${baseBranch}"`);
    } catch {
      const { stdout } = await execWSL(distro, `cd "${repoPath}" && git rev-parse --abbrev-ref HEAD`);
      baseBranch = stdout.trim();
    }

    // Create worktree via git command
    await execWSL(distro, `cd "${repoPath}" && git worktree add "${worktreePath}" -b "${branch}" "${baseBranch}"`);

    const entry = this.db.createWorktree({
      repo_path: repoPath,
      worktree_path: worktreePath,
      branch,
      agent_id: null,
      task_id: null,
      status: 'active',
    });

    return entry;
  }

  async removeWorktree(worktreeId: string, distro: string = 'Ubuntu'): Promise<void> {
    const wt = this.db.getWorktree(worktreeId);
    if (!wt) throw new Error('Worktree not found');

    try {
      await execWSL(distro, `cd "${wt.repo_path}" && git worktree remove "${wt.worktree_path}" --force`);
    } catch {
      // If removal fails, try manual cleanup
      try {
        await execWSL(distro, `rm -rf "${wt.worktree_path}"`);
        await execWSL(distro, `cd "${wt.repo_path}" && git worktree prune`);
      } catch {}
    }

    this.db.updateWorktree(worktreeId, { status: 'removed' });
  }

  async listWorktrees(repoPath: string, distro: string = 'Ubuntu'): Promise<WorktreeEntry[]> {
    try {
      const { stdout } = await execWSL(distro, `cd "${repoPath}" && git worktree list --porcelain`);
      // Parse output and sync with DB
      return this.db.getWorktrees().filter(w => w.repo_path === repoPath);
    } catch {
      return this.db.getWorktrees().filter(w => w.repo_path === repoPath);
    }
  }

  async pruneWorktrees(repoPath: string, distro: string = 'Ubuntu'): Promise<void> {
    await execWSL(distro, `cd "${repoPath}" && git worktree prune`);
  }

  async commitChanges(worktreePath: string, message: string, author: string = 'AgentForge', distro: string = 'Ubuntu'): Promise<string> {
    await execGit(worktreePath, ['add', '-A'], distro);
    await execGit(worktreePath, ['commit', '-m', message, '--author', `${author} <agentforge@local>`], distro);
    const { stdout } = await execGit(worktreePath, ['rev-parse', 'HEAD'], distro);
    return stdout.trim();
  }

  async hasChanges(worktreePath: string, distro: string = 'Ubuntu'): Promise<boolean> {
    try {
      const { stdout } = await execGit(worktreePath, ['status', '--porcelain'], distro);
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  async getStatus(worktreePath: string, distro: string = 'Ubuntu'): Promise<{ branch: string; ahead: number; behind: number; modified: string[] }> {
    return getRepoStatus(worktreePath, distro);
  }
}
