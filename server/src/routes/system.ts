import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { listWSLDistros } from '../utils/wsl';

const execAsync = promisify(exec);

export function createSystemRouter(): Router {
  const router = Router();

  router.get('/repos', async (_req, res) => {
    try {
      const IS_WIN = process.platform === 'win32';
      const commonPaths = IS_WIN ? ['/home', '/mnt/c/Users', '/mnt/d'] : ['/home'];
      const repos: string[] = [];
      for (const basePath of commonPaths) {
        try {
          let stdout: string;
          if (IS_WIN) {
            const result = await execAsync(`wsl.exe -d Ubuntu -e bash -c "find ${basePath} -maxdepth 4 -name .git -type d 2>/dev/null | head -20"`, { timeout: 15000 });
            stdout = result.stdout;
          } else {
            const result = await execAsync(`find ${basePath} -maxdepth 4 -name .git -type d 2>/dev/null | head -20`, { timeout: 15000 });
            stdout = result.stdout;
          }
          const found = stdout.split('\n').filter(Boolean).map(p => p.replace(/\/.git$/, ''));
          repos.push(...found);
        } catch {}
      }
      res.json({ success: true, data: repos });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  router.get('/wsl-distro', async (_req, res) => {
    try {
      const distros = await listWSLDistros();
      res.json({ success: true, data: distros });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  return router;
}
