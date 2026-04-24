import { Router } from 'express';
import type { AppDatabase } from '../services/Database';
import type { WorktreeManager } from '../services/WorktreeManager';

export function createWorktreesRouter(db: AppDatabase, worktreeManager: WorktreeManager): Router {
  const router = Router();

  router.get('/', (req, res) => {
    try {
      const wts = db.getWorktrees();
      res.json({ success: true, data: wts });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  router.post('/', async (req, res) => {
    try {
      const { repo_path, branch, base_branch, distro } = req.body;
      const wt = await worktreeManager.createWorktree(repo_path, branch, base_branch || 'main', distro || 'Ubuntu');
      res.json({ success: true, data: wt });
    } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  });

  router.delete('/:id', async (req, res) => {
    try {
      await worktreeManager.removeWorktree(req.params.id, req.query.distro as string || 'Ubuntu');
      res.json({ success: true });
    } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  });

  router.post('/:id/prune', async (req, res) => {
    try {
      const wt = db.getWorktree(req.params.id);
      if (!wt) return res.status(404).json({ success: false, error: 'Worktree not found' });
      await worktreeManager.pruneWorktrees(wt.repo_path, req.query.distro as string || 'Ubuntu');
      res.json({ success: true });
    } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  });

  return router;
}
