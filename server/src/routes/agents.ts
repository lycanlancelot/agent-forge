import { Router } from 'express';
import type { AppDatabase } from '../services/Database';
import type { AgentManager } from '../services/AgentManager';
import type { TaskQueue } from '../services/TaskQueue';

export function createAgentsRouter(db: AppDatabase, agentManager: AgentManager, taskQueue: TaskQueue): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    try { res.json({ success: true, data: db.getAgents() }); }
    catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  router.post('/', (req, res) => {
    try {
      const { name, type, repo_path, config } = req.body;
      const agent = db.createAgent({ name, type, status: 'idle', worktree_path: null, repo_path, branch: null, config });
      res.json({ success: true, data: agent });
    } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  });

  router.get('/:id', (req, res) => {
    const agent = db.getAgent(req.params.id);
    if (!agent) return res.status(404).json({ success: false, error: 'Agent not found' });
    res.json({ success: true, data: agent });
  });

  router.patch('/:id', (req, res) => {
    try {
      const agent = db.updateAgent(req.params.id, req.body);
      res.json({ success: true, data: agent });
    } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const agent = db.getAgent(req.params.id);
      if (agent && agent.status === 'running') {
        await agentManager.stopAgent(req.params.id);
      }
      db.deleteAgent(req.params.id);
      res.json({ success: true });
    } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  });

  router.post('/:id/start', async (req, res) => {
    try {
      await agentManager.startAgent(req.params.id, req.body?.taskId);
      res.json({ success: true });
    } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  });

  router.post('/:id/stop', async (req, res) => {
    try { await agentManager.stopAgent(req.params.id); res.json({ success: true }); }
    catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  });

  router.post('/:id/pause', async (req, res) => {
    try { await agentManager.pauseAgent(req.params.id); res.json({ success: true }); }
    catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  });

  router.post('/:id/resume', async (req, res) => {
    try { await agentManager.resumeAgent(req.params.id); res.json({ success: true }); }
    catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  });

  router.post('/:id/input', async (req, res) => {
    try {
      const { input } = req.body;
      await agentManager.sendInput(req.params.id, input);
      res.json({ success: true });
    } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  });

  router.get('/:id/logs', (req, res) => {
    try {
      const logs = db.getSessionLogs(req.params.id, parseInt(req.query.limit as string) || 500);
      res.json({ success: true, data: logs.reverse() });
    } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  });

  router.post('/:id/ralph/start', async (req, res) => {
    try {
      taskQueue.startRalphLoop(req.params.id);
      res.json({ success: true });
    } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  });

  router.post('/:id/ralph/stop', async (req, res) => {
    try {
      taskQueue.stopRalphLoop(req.params.id);
      res.json({ success: true });
    } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  });

  return router;
}
