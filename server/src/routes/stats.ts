import { Router } from 'express';
import type { AppDatabase } from '../services/Database';
import type { OverviewStats } from '../types';

export function createStatsRouter(db: AppDatabase): Router {
  const router = Router();

  router.get('/overview', (_req, res) => {
    try {
      const agents = db.getAgents();
      const tasks = db.getTasks();
      const commits = db.getCommits(undefined, 10000);
      const wts = db.getWorktrees();
      const today = new Date(); today.setHours(0,0,0,0);
      const stats: OverviewStats = {
        totalAgents: agents.length,
        activeAgents: agents.filter(a => a.status === 'running').length,
        pendingTasks: tasks.filter(t => t.status === 'pending').length,
        completedTasksToday: tasks.filter(t => t.status === 'completed' && t.completed_at && t.completed_at >= today.getTime()).length,
        totalCommits: commits.length,
        totalWorktrees: wts.length,
      };
      res.json({ success: true, data: stats });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  router.get('/activity', (_req, res) => {
    try {
      const logs = db.getSessionLogs(''); // need all agents - get from DB directly
      res.json({ success: true, data: [] });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  return router;
}
