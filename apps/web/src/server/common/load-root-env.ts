import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

let loaded = false;

function hasEnvFile(dir: string): boolean {
  return (
    existsSync(path.join(dir, '.env')) ||
    existsSync(path.join(dir, '.env.local')) ||
    existsSync(path.join(dir, '.env.development')) ||
    existsSync(path.join(dir, '.env.development.local'))
  );
}

function applyEnvFile(file: string, override: boolean): void {
  const text = readFileSync(file, 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eq = line.indexOf('=');
    if (eq <= 0) continue;

    const key = line.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;

    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (override || process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function loadEnvDir(dir: string): void {
  const files: Array<{ file: string; override: boolean }> = [
    { file: path.join(dir, '.env'), override: false },
  ];
  if (process.env.NODE_ENV !== 'production') {
    files.push({
      file: path.join(dir, '.env.development'),
      override: false,
    });
  }
  files.push({ file: path.join(dir, '.env.local'), override: true });
  if (process.env.NODE_ENV !== 'production') {
    files.push({
      file: path.join(dir, '.env.development.local'),
      override: true,
    });
  }

  for (const { file, override } of files) {
    if (existsSync(file)) applyEnvFile(file, override);
  }
}

/**
 * Next.js only auto-loads `.env` from `apps/web`. Prisma CLI loads the repo-root
 * `.env`. This helper loads the first directory that actually has an env file.
 */
export function loadRootEnv(): void {
  if (loaded) return;
  loaded = true;

  const cwd = process.cwd();
  const candidates = [cwd, path.resolve(cwd, '../..'), path.resolve(cwd, '..')];

  for (const dir of candidates) {
    if (hasEnvFile(dir)) {
      loadEnvDir(dir);
      return;
    }
  }
}
