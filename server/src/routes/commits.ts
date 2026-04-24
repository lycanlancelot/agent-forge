import { Router } from 'express';
import type { AppDatabase } from '../services/Database';

export function createCommitsRouter(db: AppDatabase): Router {
  const router = Router();

  router.get('/', (req, res) => {
    try {
      const commits = db.getCommits(req.query.agent_id as string | undefined, parseInt(req.query.limit as string) || 100);
      res.json({ success: true, data: commits });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  router.get('/stats', (req, res) => {
    try {
      const commits = db.getCommits(req.query.agent_id as string | undefined, 10000);
      const byAgent: Record<string, number> = {};
      for (const c of commits) { byAgent[c.agent_id] = (byAgent[c.agent_id] || 0) + 1; }
      const byDate: Record<string, number> = {};
      for (const c of commits) {
        const d = new Date(c.committed_at).toISOString().slice(0, 10);
        byDate[d] = (byDate[d] || 0) + 1;
      }
      res.json({ success: true, data: { total: commits.length, byAgent, byDate } });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  return router;
}
