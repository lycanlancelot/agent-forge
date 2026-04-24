import * as pty from 'node-pty';
import * as os from 'os';

export interface PTYSession {
  pid: number;
  write(data: string): void;
  resize(cols: number, rows: number): void;
  kill(signal?: string): void;
  onData(cb: (data: string) => void): void;
  onExit(cb: (code: number, signal?: number) => void): void;
}

export class PTYManager {
  spawn(
    command: string,
    args: string[],
    options: {
      cwd?: string;
      env?: Record<string, string>;
      cols?: number;
      rows?: number;
    } = {}
  ): PTYSession {
    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
    const isWSL = command === 'wsl.exe';

    const ptyProcess = pty.spawn(command, args, {
      name: 'xterm-color',
      cols: options.cols || 80,
      rows: options.rows || 30,
      cwd: options.cwd || process.cwd(),
      // Use caller-provided env as-is (caller is responsible for merging/filtering)
      env: options.env ?? (process.env as Record<string, string>),
    });

    const session: PTYSession = {
      pid: ptyProcess.pid,
      write: (data: string) => ptyProcess.write(data),
      resize: (cols: number, rows: number) => ptyProcess.resize(cols, rows),
      kill: (signal?: string) => {
        try {
          if (signal) process.kill(ptyProcess.pid, signal as any);
          else ptyProcess.kill();
        } catch {}
      },
      onData: (cb) => ptyProcess.onData(cb),
      onExit: (cb) => ptyProcess.onExit(({ exitCode, signal }) => cb(exitCode, signal)),
    };

    return session;
  }
}
