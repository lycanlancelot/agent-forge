import { Router } from 'express';
import type { AppDatabase } from '../services/Database';
import type { AgentManager } from '../services/AgentManager';

export function createTasksRouter(db: AppDatabase, agentManager: AgentManager): Router {
  const router = Router();

  router.get('/', (req, res) => {
    try {
      const filter: any = {};
      if (req.query.status) filter.status = req.query.status as string;
      if (req.query.agent_id) filter.agent_id = req.query.agent_id as string;
      res.json({ success: true, data: db.getTasks(filter) });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  router.post('/', (req, res) => {
    try {
      const task = db.createTask(req.body);
      res.json({ success: true, data: task });
    } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  });

  router.get('/:id', (req, res) => {
    const task = db.getTask(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, data: task });
  });

  router.patch('/:id', (req, res) => {
    try { const task = db.updateTask(req.params.id, req.body); res.json({ success: true, data: task }); }
    catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  });

  router.delete('/:id', (req, res) => {
    try { db.deleteTask(req.params.id); res.json({ success: true }); }
    catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  });

  router.post('/:id/assign/:agentId', (req, res) => {
    try {
      const task = db.updateTask(req.params.id, { agent_id: req.params.agentId, status: 'assigned' });
      res.json({ success: true, data: task });
    } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  });

  router.post('/:id/start', async (req, res) => {
    try {
      const task = db.getTask(req.params.id);
      if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
      if (task.agent_id) {
        await agentManager.startAgent(task.agent_id, task.id);
      } else {
        db.updateTask(req.params.id, { status: 'running', started_at: Date.now() });
      }
      const updated = db.getTask(req.params.id);
      res.json({ success: true, data: updated });
    } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  });

  router.post('/:id/cancel', (req, res) => {
    try {
      const task = db.updateTask(req.params.id, { status: 'cancelled', completed_at: Date.now() });
      res.json({ success: true, data: task });
    } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  });

  return router;
}
