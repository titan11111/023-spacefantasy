import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const distIndex = join(dist, 'index.html');

if (!existsSync(distIndex)) {
  console.error('dist/index.html missing');
  process.exit(1);
}

const distAssets = join(dist, 'assets');
const rootAssets = join(root, 'assets');
const gameBundle = readFileSync(join(distAssets, 'game.js'));
const bundleVersion = createHash('sha256').update(gameBundle).digest('hex').slice(0, 10);
const playableHtml = readFileSync(distIndex, 'utf8').replace(
  './assets/game.js',
  `./assets/game.js?v=${bundleVersion}`,
);
writeFileSync(join(root, 'index.html'), playableHtml);

if (existsSync(rootAssets)) {
  rmSync(rootAssets, { recursive: true, force: true });
}
mkdirSync(rootAssets, { recursive: true });
cpSync(distAssets, rootAssets, { recursive: true });

console.log(`Synced playable files → index.html + assets/ (${bundleVersion})`);
