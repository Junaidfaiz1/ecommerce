import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, '..');
const src = join(appRoot, 'src');
const tsxCli = join(appRoot, '..', '..', 'node_modules', 'tsx', 'dist', 'cli.mjs');

function collect(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collect(full));
    } else if (entry.name.endsWith('.test.ts')) {
      files.push(full);
    }
  }
  return files;
}

const files = collect(src);
if (files.length === 0) {
  console.error('No *.test.ts files found under src/');
  process.exit(1);
}

const result = spawnSync(process.execPath, [tsxCli, '--test', ...files], {
  cwd: appRoot,
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status === null ? 1 : result.status);
