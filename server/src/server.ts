import express from 'express';
import fs from 'fs';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import type { AppDatabase } from './services/Database';
import type { AgentManager } from './services/AgentManager';
import type { TaskQueue } from './services/TaskQueue';
import type { CommitScheduler } from './services/CommitScheduler';
import type { CloudflareManager } from './services/CloudflareManager';
import type { WorktreeManager } from './services/WorktreeManager';
import { createAgentsRouter } from './routes/agents';
import { createTasksRouter } from './routes/tasks';
import { createWorktreesRouter } from './routes/worktrees';
import { createCommitsRouter } from './routes/commits';
import { createStatsRouter } from './routes/stats';
import { createSettingsRouter } from './routes/settings';
import { createSystemRouter } from './routes/system';

export function createApp(
  db: AppDatabase,
  agentManager: AgentManager,
  taskQueue: TaskQueue,
  commitScheduler: CommitScheduler,
  cloudflareManager: CloudflareManager,
  worktreeManager: WorktreeManager
) {
  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    cors: { origin: '*' },
  });

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // REST API routes
  app.use('/api/agents', createAgentsRouter(db, agentManager, taskQueue));
  app.use('/api/tasks', createTasksRouter(db, agentManager));
  app.use('/api/worktrees', createWorktreesRouter(db, worktreeManager));
  app.use('/api/commits', createCommitsRouter(db));
  app.use('/api/stats', createStatsRouter(db));
  app.use('/api/settings', createSettingsRouter(db, cloudflareManager));
  app.use('/api/system', createSystemRouter());

  // Serve static frontend build (only if public dir exists, e.g. production)
  if (fs.existsSync('public')) {
    app.use(express.static('public'));
    app.get('*', (_req, res) => {
      const indexPath = 'public/index.html';
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath, { root: process.cwd() });
      } else {
        res.status(404).json({ success: false, error: 'Frontend build not found' });
      }
    });
  }

  // Error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(err);
    }
    res.status(err.statusCode || 500).json({ success: false, error: err.message || 'Internal server error' });
  });

  // Socket.io handlers
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('agent:connect', ({ agentId }) => {
      socket.join(`agent:${agentId}`);
      const agent = db.getAgent(agentId);
      if (agent) socket.emit('agent:status', { agentId, status: agent.status });
    });

    socket.on('agent:disconnect', ({ agentId }) => {
      socket.leave(`agent:${agentId}`);
    });

    socket.on('agent:terminal', ({ agentId, input }) => {
      agentManager.sendInput(agentId, input);
    });

    socket.on('agent:terminal:resize', ({ agentId, cols, rows }) => {
      agentManager.resizeTerminal(agentId, cols, rows);
    });
  });

  // Wire AgentManager events to Socket.io
  agentManager.on('output', ({ agentId, data }) => {
    io.to(`agent:${agentId}`).emit('agent:output', { agentId, data });
  });

  agentManager.on('status', ({ agentId, status }) => {
    io.to(`agent:${agentId}`).emit('agent:status', { agentId, status });
  });

  agentManager.on('exit', ({ agentId, code }) => {
    io.to(`agent:${agentId}`).emit('agent:exit', { agentId, code });
  });

  // Wire TaskQueue events
  taskQueue.on('task:assigned', ({ task, agentId }) => {
    io.emit('task:update', { task, agentId });
  });

  taskQueue.on('task:started', ({ task }) => {
    io.emit('task:update', { task });
  });

  taskQueue.on('task:completed', ({ task }) => {
    io.emit('task:update', { task });
  });

  // Wire CommitScheduler events
  commitScheduler.on('commit:new', ({ commit }) => {
    io.emit('commit:new', { commit });
  });

  return { app, server, io };
}
