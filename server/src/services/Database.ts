import Database from 'better-sqlite3';
import type { Agent, Task, Commit, WorktreeEntry, SessionLog, AppSettings, TaskRun, AgentEvent } from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import { generateId } from '../utils/id';

export class AppDatabase {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.initSchema();
  }

  initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('claude','codex','kimi')),
        status TEXT NOT NULL DEFAULT 'idle' CHECK(status IN ('idle','running','paused','error','completed')),
        worktree_path TEXT,
        repo_path TEXT NOT NULL,
        branch TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        config TEXT NOT NULL DEFAULT '{}'
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        agent_id TEXT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','assigned','running','paused','completed','failed','cancelled')),
        plan_mode INTEGER NOT NULL DEFAULT 0,
        auto_commit INTEGER,
        commit_interval_minutes INTEGER,
        priority INTEGER NOT NULL DEFAULT 5,
        created_at INTEGER NOT NULL,
        started_at INTEGER,
        completed_at INTEGER,
        exit_code INTEGER,
        output_summary TEXT,
        error_message TEXT,
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS commits (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        task_id TEXT,
        commit_hash TEXT,
        message TEXT NOT NULL,
        branch TEXT NOT NULL,
        files_changed INTEGER NOT NULL DEFAULT 0,
        insertions INTEGER NOT NULL DEFAULT 0,
        deletions INTEGER NOT NULL DEFAULT 0,
        committed_at INTEGER NOT NULL,
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS worktrees (
        id TEXT PRIMARY KEY,
        repo_path TEXT NOT NULL,
        worktree_path TEXT NOT NULL UNIQUE,
        branch TEXT NOT NULL,
        agent_id TEXT,
        task_id TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS session_logs (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        task_id TEXT,
        timestamp INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('stdout','stderr','system','user_input')),
        content TEXT NOT NULL,
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS task_runs (
        id TEXT PRIMARY KEY,
        task_id TEXT,
        agent_id TEXT NOT NULL,
        agent_config_snapshot TEXT NOT NULL,
        repo_head TEXT,
        worktree_path TEXT,
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        status TEXT NOT NULL DEFAULT 'pending',
        exit_code INTEGER,
        summary TEXT
      );

      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        task_id TEXT,
        timestamp INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        data TEXT NOT NULL
      );
    `);

    const row = this.db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
    if (row.count === 0) {
      this.db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)')
        .run('app', JSON.stringify(DEFAULT_SETTINGS));
    }
  }

  getAgents(): Agent[] {
    const rows = this.db.prepare('SELECT * FROM agents ORDER BY created_at DESC').all() as any[];
    return rows.map(r => ({ ...r, config: JSON.parse(r.config) }));
  }

  getAgent(id: string): Agent | null {
    const row = this.db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as any;
    if (!row) return null;
    return { ...row, config: JSON.parse(row.config) };
  }

  createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'updated_at'>): Agent {
    const id = generateId();
    const now = Date.now();
    const record = { ...agent, id, created_at: now, updated_at: now, config: JSON.stringify(agent.config) };
    this.db.prepare(`INSERT INTO agents (id,name,type,status,worktree_path,repo_path,branch,created_at,updated_at,config)
      VALUES (@id,@name,@type,@status,@worktree_path,@repo_path,@branch,@created_at,@updated_at,@config)`).run(record);
    return this.getAgent(id)!;
  }

  updateAgent(id: string, patch: Partial<Agent>): Agent {
    const a = this.getAgent(id);
    if (!a) throw new Error('Agent not found');
    const u = { ...a, ...patch, updated_at: Date.now() };
    this.db.prepare(`UPDATE agents SET name=@name,type=@type,status=@status,worktree_path=@worktree_path,
      repo_path=@repo_path,branch=@branch,updated_at=@updated_at,config=@config WHERE id=@id`)
      .run({ ...u, config: JSON.stringify(u.config) });
    return this.getAgent(id)!;
  }

  deleteAgent(id: string): void {
    this.db.prepare('DELETE FROM agents WHERE id = ?').run(id);
  }

  getTasks(filter?: { status?: string; agent_id?: string }): Task[] {
    let sql = 'SELECT * FROM tasks';
    const conds: string[] = []; const params: any[] = [];
    if (filter?.status) { conds.push('status = ?'); params.push(filter.status); }
    if (filter?.agent_id) { conds.push('agent_id = ?'); params.push(filter.agent_id); }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' ORDER BY priority DESC, created_at ASC';
    const rows = this.db.prepare(sql).all(...params) as any[];
    return rows.map(r => ({ ...r, plan_mode: !!r.plan_mode, auto_commit: r.auto_commit !== null ? !!r.auto_commit : null }));
  }

  getTask(id: string): Task | null {
    const r = this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
    if (!r) return null;
    return { ...r, plan_mode: !!r.plan_mode, auto_commit: r.auto_commit !== null ? !!r.auto_commit : null };
  }

  createTask(task: Omit<Task, 'id' | 'created_at' | 'status'>): Task {
    const id = generateId(); const now = Date.now();
    this.db.prepare(`INSERT INTO tasks (id,agent_id,title,description,status,plan_mode,auto_commit,commit_interval_minutes,priority,created_at,started_at,completed_at,exit_code,output_summary,error_message)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id, task.agent_id||null, task.title, task.description, 'pending', task.plan_mode?1:0, task.auto_commit===null?null:(task.auto_commit?1:0), task.commit_interval_minutes||null, task.priority, now, null, null, null, null, null);
    return this.getTask(id)!;
  }

  updateTask(id: string, patch: Partial<Task>): Task {
    const t = this.getTask(id); if (!t) throw new Error('Task not found');
    const sets: string[] = []; const params: any[] = [];
    const allowed = ['agent_id','title','description','status','plan_mode','auto_commit','commit_interval_minutes','priority','started_at','completed_at','exit_code','output_summary','error_message'] as const;
    for (const k of allowed) if (k in patch) {
      sets.push(`${k}=?`);
      const v = (patch as any)[k];
      params.push(k==='plan_mode' ? (v?1:0) : (k==='auto_commit' ? (v===null?null:(v?1:0)) : v));
    }
    if (sets.length) { this.db.prepare(`UPDATE tasks SET ${sets.join(',')} WHERE id=?`).run(...params, id); }
    return this.getTask(id)!;
  }

  deleteTask(id: string): void { this.db.prepare('DELETE FROM tasks WHERE id=?').run(id); }

  getCommits(agentId?: string, limit=100): Commit[] {
    let sql='SELECT * FROM commits'; const params: any[]=[];
    if (agentId) { sql+=' WHERE agent_id=?'; params.push(agentId); }
    sql+=' ORDER BY committed_at DESC LIMIT ?'; params.push(limit);
    return this.db.prepare(sql).all(...params) as Commit[];
  }

  createCommit(commit: Omit<Commit,'id'>): Commit {
    const id=generateId();
    this.db.prepare(`INSERT INTO commits (id,agent_id,task_id,commit_hash,message,branch,files_changed,insertions,deletions,committed_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).run(id,commit.agent_id,commit.task_id||null,commit.commit_hash,commit.message,commit.branch,commit.files_changed,commit.insertions,commit.deletions,commit.committed_at);
    return { ...commit, id };
  }

  getWorktrees(): WorktreeEntry[] { return this.db.prepare('SELECT * FROM worktrees ORDER BY created_at DESC').all() as WorktreeEntry[]; }
  getWorktree(id: string): WorktreeEntry | null { return this.db.prepare('SELECT * FROM worktrees WHERE id=?').get(id) as WorktreeEntry|null; }
  createWorktree(wt: Omit<WorktreeEntry,'id'|'created_at'>): WorktreeEntry {
    const id=generateId(); const now=Date.now();
    this.db.prepare(`INSERT INTO worktrees (id,repo_path,worktree_path,branch,agent_id,task_id,status,created_at) VALUES (?,?,?,?,?,?,?,?)`)
      .run(id,wt.repo_path,wt.worktree_path,wt.branch,wt.agent_id||null,wt.task_id||null,wt.status,now);
    return this.getWorktree(id)!;
  }
  updateWorktree(id: string, patch: Partial<WorktreeEntry>): WorktreeEntry {
    const sets: string[]=[]; const params: any[]=[];
    for (const k of ['repo_path','worktree_path','branch','agent_id','task_id','status'] as const) if (k in patch) { sets.push(`${k}=?`); params.push((patch as any)[k]); }
    if (sets.length) this.db.prepare(`UPDATE worktrees SET ${sets.join(',')} WHERE id=?`).run(...params,id);
    return this.getWorktree(id)!;
  }
  deleteWorktree(id: string): void { this.db.prepare('DELETE FROM worktrees WHERE id=?').run(id); }

  getSessionLogs(agentId: string, limit=500): SessionLog[] {
    return this.db.prepare('SELECT * FROM session_logs WHERE agent_id=? ORDER BY timestamp DESC LIMIT ?').all(agentId,limit) as SessionLog[];
  }
  addSessionLog(log: Omit<SessionLog,'id'>): SessionLog {
    const id=generateId();
    this.db.prepare(`INSERT INTO session_logs (id,agent_id,task_id,timestamp,type,content) VALUES (?,?,?,?,?,?)`)
      .run(id,log.agent_id,log.task_id||null,log.timestamp,log.type,log.content);
    return { ...log, id };
  }

  getSettings(): AppSettings {
    const row=this.db.prepare('SELECT value FROM settings WHERE key=?').get('app') as any;
    return row ? { ...DEFAULT_SETTINGS, ...JSON.parse(row.value) } : DEFAULT_SETTINGS;
  }
  updateSettings(patch: Partial<AppSettings>): AppSettings {
    const cur=this.getSettings(); const u={ ...cur, ...patch };
    this.db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run('app',JSON.stringify(u));
    return u;
  }

  createTaskRun(data: Omit<TaskRun, 'id' | 'ended_at' | 'exit_code' | 'summary'>): TaskRun {
    const id = generateId();
    this.db.prepare(`INSERT INTO task_runs (id,task_id,agent_id,agent_config_snapshot,repo_head,worktree_path,started_at,ended_at,status,exit_code,summary)
      VALUES (?,?,?,?,?,?,?,NULL,?,NULL,NULL)`)
      .run(id, data.task_id||null, data.agent_id, data.agent_config_snapshot, data.repo_head||null, data.worktree_path||null, data.started_at, data.status);
    return this.db.prepare('SELECT * FROM task_runs WHERE id=?').get(id) as TaskRun;
  }

  updateTaskRun(id: string, patch: Partial<Pick<TaskRun,'ended_at'|'status'|'exit_code'|'summary'>>): void {
    const sets: string[] = []; const params: any[] = [];
    for (const k of ['ended_at','status','exit_code','summary'] as const) {
      if (k in patch) { sets.push(`${k}=?`); params.push((patch as any)[k]); }
    }
    if (sets.length) this.db.prepare(`UPDATE task_runs SET ${sets.join(',')} WHERE id=?`).run(...params, id);
  }

  getTaskRuns(taskId?: string): TaskRun[] {
    if (taskId) return this.db.prepare('SELECT * FROM task_runs WHERE task_id=? ORDER BY started_at DESC').all(taskId) as TaskRun[];
    return this.db.prepare('SELECT * FROM task_runs ORDER BY started_at DESC LIMIT 200').all() as TaskRun[];
  }

  addEvent(data: Omit<AgentEvent,'id'>): AgentEvent {
    const id = generateId();
    this.db.prepare(`INSERT INTO events (id,run_id,agent_id,task_id,timestamp,event_type,data) VALUES (?,?,?,?,?,?,?)`)
      .run(id, data.run_id, data.agent_id, data.task_id||null, data.timestamp, data.event_type, data.data);
    return { ...data, id };
  }

  getEvents(agentId?: string, limit=100): AgentEvent[] {
    if (agentId) return this.db.prepare('SELECT * FROM events WHERE agent_id=? ORDER BY timestamp DESC LIMIT ?').all(agentId, limit) as AgentEvent[];
    return this.db.prepare('SELECT * FROM events ORDER BY timestamp DESC LIMIT ?').all(limit) as AgentEvent[];
  }
}
