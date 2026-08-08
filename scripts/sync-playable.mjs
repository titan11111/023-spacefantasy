import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const distIndex = join(dist, 'index.html');

if (!existsSync(distIndex)) {
  console.error('dist/index.html missing');
  process.exit(1);
}

writeFileSync(join(root, 'index.html'), readFileSync(distIndex, 'utf8'));

const distAssets = join(dist, 'assets');
const rootAssets = join(root, 'assets');
if (existsSync(rootAssets)) {
  rmSync(rootAssets, { recursive: true, force: true });
}
mkdirSync(rootAssets, { recursive: true });
cpSync(distAssets, rootAssets, { recursive: true });

console.log('Synced playable files → index.html + assets/');
