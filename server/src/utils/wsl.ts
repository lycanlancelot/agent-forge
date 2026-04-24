import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const IS_WIN = process.platform === 'win32';

export async function execWSL(
  distro: string,
  command: string,
  cwd?: string
): Promise<{ stdout: string; stderr: string }> {
  if (!IS_WIN) {
    // Linux/macOS: execute directly via bash -c
    const fullCommand = cwd ? `cd "${cwd}" && ${command}` : command;
    return execAsync(fullCommand, { timeout: 30000 });
  }
  // Windows: via WSL
  const cdPart = cwd ? `cd "${cwd}" && ` : '';
  const fullCommand = `wsl.exe -d ${distro} -e bash -c "${cdPart}${command.replace(/"/g, '\"')}"`;
  return execAsync(fullCommand, { timeout: 30000 });
}

export async function listWSLDistros(): Promise<{ name: string; state: string; version: number }[]> {
  if (!IS_WIN) {
    return [{ name: 'Native Linux', state: 'Running', version: 2 }];
  }
  try {
    const { stdout } = await execAsync('wsl.exe -l -v', { timeout: 10000 });
    const lines = stdout.split('\n').slice(1); // skip header
    const distros: { name: string; state: string; version: number }[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const match = trimmed.match(/^(?:\s*\*?\s*)([^\s]+)\s+(Running|Stopped)\s+(\d+)/);
      if (match) {
        distros.push({
          name: match[1].replace(/\x00/g, ''),
          state: match[2],
          version: parseInt(match[3], 10),
        });
      }
    }
    return distros;
  } catch {
    return [];
  }
}

export function resolveWSLPath(winPath: string, distro: string = 'Ubuntu'): string {
  if (!IS_WIN) return winPath;
  const clean = winPath.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (m, drive) => `/mnt/${drive.toLowerCase()}`);
  return clean;
}
