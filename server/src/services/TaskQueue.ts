import { EventEmitter } from 'events';
import type { AppDatabase } from './Database';
import type { AgentManager } from './AgentManager';
import type { Task } from '../types';

export class TaskQueue extends EventEmitter {
  private ralphLoops = new Set<string>();

  constructor(private db: AppDatabase, private agentManager: AgentManager) {
    super();
    this.agentManager.on('exit', ({ agentId }) => {
      if (this.ralphLoops.has(agentId)) {
        this.processNext(agentId).then(ok => {
          if (!ok) this.emit('ralph:idle', { agentId });
        });
      }
    });
  }

  async enqueue(task: Omit<Task, 'id' | 'created_at' | 'status'>): Promise<Task> {
    return this.db.createTask(task);
  }

  async dequeue(agentId: string): Promise<Task | null> {
    const pending = this.db.getTasks({ status: 'pending' });
    if (pending.length === 0) return null;
    const task = pending[0];
    this.db.updateTask(task.id, { agent_id: agentId, status: 'assigned' });
    this.emit('task:assigned', { task: this.db.getTask(task.id)!, agentId });
    return this.db.getTask(task.id);
  }

  async processNext(agentId: string): Promise<boolean> {
    const agent = this.db.getAgent(agentId);
    if (!agent || agent.status !== 'idle') return false;
    const task = await this.dequeue(agentId);
    if (!task) return false;
    await this.agentManager.startAgent(agentId, task.id);
    this.emit('task:started', { task: this.db.getTask(task.id)! });
    return true;
  }

  startRalphLoop(agentId: string): void {
    this.ralphLoops.add(agentId);
    // Immediately try to process if idle
    const agent = this.db.getAgent(agentId);
    if (agent?.status === 'idle') {
      this.processNext(agentId);
    }
  }

  stopRalphLoop(agentId: string): void {
    this.ralphLoops.delete(agentId);
  }

  isRalphLoopEnabled(agentId: string): boolean {
    return this.ralphLoops.has(agentId);
  }
}
