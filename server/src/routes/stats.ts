import { Router } from 'express';
import type { AppDatabase } from '../services/Database';
import type { OverviewStats, ActivityItem } from '../types';

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
      const items: ActivityItem[] = [];

      // Recent commits
      const commits = db.getCommits(undefined, 50);
      for (const c of commits) {
        items.push({
          id: c.id,
          timestamp: c.committed_at,
          type: 'commit_made',
          title: c.message.split('\n')[0].slice(0, 80),
          description: `Branch: ${c.branch} • +${c.insertions}/-${c.deletions}`,
          agent_id: c.agent_id,
          task_id: c.task_id || undefined,
        });
      }

      // Recent task completions/failures
      const tasks = db.getTasks();
      for (const t of tasks) {
        if ((t.status === 'completed' || t.status === 'failed') && t.completed_at) {
          items.push({
            id: `task-${t.id}`,
            timestamp: t.completed_at,
            type: t.status === 'completed' ? 'task_completed' : 'task_failed',
            title: t.title,
            description: t.output_summary || t.error_message || '',
            agent_id: t.agent_id || undefined,
            task_id: t.id,
          });
        }
      }

      // Recent meaningful session logs (content length > 30, not noise)
      const agents = db.getAgents();
      for (const agent of agents) {
        const logs = db.getSessionLogs(agent.id, 20);
        for (const log of logs) {
          if (log.content.length > 30) {
            items.push({
              id: log.id,
              timestamp: log.timestamp,
              type: 'agent_output',
              title: log.content.slice(0, 80).replace(/[\r\n]+/g, ' ').trim(),
              description: `Agent: ${agent.name}`,
              agent_id: log.agent_id,
              task_id: log.task_id || undefined,
            });
          }
        }
      }

      // Sort by timestamp descending, take 50
      items.sort((a, b) => b.timestamp - a.timestamp);
      res.json({ success: true, data: items.slice(0, 50) });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  return router;
}
