import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import type { AppSettings } from '../types';

export class CloudflareManager extends EventEmitter {
  private process: ChildProcess | null = null;
  private tunnelUrl: string | null = null;

  constructor(private settings: AppSettings) {
    super();
  }

  async start(localPort: number): Promise<string> {
    if (this.process) return this.tunnelUrl || '';

    let args: string[];
    if (this.settings.cloudflare_token) {
      args = ['tunnel', 'run', '--token', this.settings.cloudflare_token];
    } else {
      args = ['tunnel', '--url', `http://localhost:${localPort}`];
    }

    return new Promise((resolve, reject) => {
      const cloudflaredPath = process.env.CLOUDFLARED_PATH || 'cloudflared';
      this.process = spawn(cloudflaredPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });

      const timeout = setTimeout(() => {
        reject(new Error('Cloudflare tunnel start timeout'));
      }, 30000);

      const onData = (data: Buffer) => {
        const line = data.toString();
        // Parse tunnel URL from output
        const match = line.match(/(https:\/\/[a-z0-9-]+\.trycloudflare\.com)/);
        if (match && !this.tunnelUrl) {
          this.tunnelUrl = match[1];
          clearTimeout(timeout);
          resolve(this.tunnelUrl);
          this.emit('started', { url: this.tunnelUrl });
        }
      };

      this.process!.stdout?.on('data', onData);
      this.process!.stderr?.on('data', onData);

      this.process!.on('exit', (code) => {
        this.process = null;
        this.tunnelUrl = null;
        this.emit('stopped', { code });
      });

      this.process!.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.process) return;
    this.process.kill('SIGTERM');
    await new Promise(r => setTimeout(r, 2000));
    if (!this.process.killed) {
      this.process.kill('SIGKILL');
    }
    this.process = null;
    this.tunnelUrl = null;
  }

  getStatus(): { running: boolean; url: string | null; pid: number | null } {
    return {
      running: !!this.process,
      url: this.tunnelUrl,
      pid: this.process?.pid || null,
    };
  }
}
