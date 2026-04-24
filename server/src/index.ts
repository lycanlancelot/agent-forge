import { AppDatabase } from './services/Database';
import { PTYManager } from './services/PTYManager';
import { WorktreeManager } from './services/WorktreeManager';
import { AgentManager } from './services/AgentManager';
import { TaskQueue } from './services/TaskQueue';
import { CommitScheduler } from './services/CommitScheduler';
import { CloudflareManager } from './services/CloudflareManager';
import { createApp } from './server';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '127.0.0.1';
const DB_PATH = process.env.DB_PATH || './data/agentforge.db';

async function main() {
  console.log('🚀 AgentForge Server starting...');

  // Initialize database
  const db = new AppDatabase(DB_PATH);
  console.log('✅ Database initialized');

  // Initialize services
  const ptyManager = new PTYManager();
  const worktreeManager = new WorktreeManager(db);
  const commitScheduler = new CommitScheduler(db, worktreeManager);
  const agentManager = new AgentManager(db, ptyManager, worktreeManager, commitScheduler);
  const taskQueue = new TaskQueue(db, agentManager);
  const settings = db.getSettings();
  const cloudflareManager = new CloudflareManager(settings);

  console.log('✅ Services initialized');

  // Create server
  const { server } = createApp(db, agentManager, taskQueue, commitScheduler, cloudflareManager, worktreeManager);

  server.listen(PORT, HOST, () => {
    console.log(`🌐 Server running at http://${HOST}:${PORT}`);
    console.log(`📱 Dashboard: http://${HOST}:${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down...');
    server.close(() => process.exit(0));
  });
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
