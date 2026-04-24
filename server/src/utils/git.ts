import { execWSL } from './wsl';

export async function execGit(
  cwd: string,
  args: string[],
  distro: string = 'Ubuntu'
): Promise<{ stdout: string; stderr: string }> {
  return execWSL(distro, `git ${args.join(' ')}`, cwd);
}

export async function getRepoStatus(
  repoPath: string,
  distro: string = 'Ubuntu'
): Promise<{ branch: string; clean: boolean; ahead: number; behind: number; modified: string[] }> {
  try {
    const { stdout } = await execGit(repoPath, ['status', '--porcelain', '-b'], distro);
    const lines = stdout.split('\n');
    const branchLine = lines[0];
    const branchMatch = branchLine.match(/## ([^\.\s\[]+)/);
    const branch = branchMatch ? branchMatch[1] : 'unknown';
    const aheadMatch = branchLine.match(/ahead (\d+)/);
    const behindMatch = branchLine.match(/behind (\d+)/);
    const statusLines = lines.slice(1).filter(l => l.trim());
    const clean = statusLines.length === 0;
    const modified = statusLines.map(l => l.slice(3).trim()).filter(Boolean);
    return {
      branch,
      clean,
      ahead: aheadMatch ? parseInt(aheadMatch[1], 10) : 0,
      behind: behindMatch ? parseInt(behindMatch[1], 10) : 0,
      modified,
    };
  } catch {
    return { branch: 'unknown', clean: true, ahead: 0, behind: 0, modified: [] };
  }
}

export async function getCommitStats(
  commitHash: string,
  cwd: string,
  distro: string = 'Ubuntu'
): Promise<{ files_changed: number; insertions: number; deletions: number }> {
  try {
    const { stdout } = await execGit(cwd, ['show', '--stat', '--oneline', commitHash], distro);
    const lastLine = stdout.split('\n').filter(l => l.includes('changed') || l.includes('insertion') || l.includes('deletion')).pop() || '';
    const filesMatch = lastLine.match(/(\d+) file/);
    const insertMatch = lastLine.match(/(\d+) insertion/);
    const deleteMatch = lastLine.match(/(\d+) deletion/);
    return {
      files_changed: filesMatch ? parseInt(filesMatch[1], 10) : 0,
      insertions: insertMatch ? parseInt(insertMatch[1], 10) : 0,
      deletions: deleteMatch ? parseInt(deleteMatch[1], 10) : 0,
    };
  } catch {
    return { files_changed: 0, insertions: 0, deletions: 0 };
  }
}
