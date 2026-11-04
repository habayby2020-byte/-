import fs from 'node:fs';
import path from 'node:path';
import { scanApps } from '../apps-scanner.mjs';

const root = process.cwd();
const appsDir = path.join(root, 'apps');
const publicDir = path.join(root, 'public');
const publicAppsDir = path.join(publicDir, 'apps');
const publicApiDir = path.join(publicDir, 'api');

if (!fs.existsSync(appsDir)) throw new Error('apps/ directory is missing');
fs.mkdirSync(publicDir, { recursive: true });
fs.rmSync(publicAppsDir, { recursive: true, force: true });
fs.cpSync(appsDir, publicAppsDir, { recursive: true });
fs.mkdirSync(publicApiDir, { recursive: true });

// Keep the game fully inside the APK: vendor the exact Three.js r128
// build used by Rocket Soccer and replace its CDN reference with a local path.
const gameDir = path.join(publicAppsDir, 'rocket-soccer');
const gameHtml = path.join(gameDir, 'index.html');
const cdn = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
if (fs.existsSync(gameHtml)) {
  const threeSource = path.join(root, 'node_modules/three/build/three.min.js');
  if (!fs.existsSync(threeSource)) throw new Error('Three.js r128 package file is missing');
  fs.copyFileSync(threeSource, path.join(gameDir, 'three.min.js'));
  const html = fs.readFileSync(gameHtml, 'utf8');
  if (!html.includes(cdn)) throw new Error('Rocket Soccer Three.js CDN reference changed; refusing to silently alter the game');
  fs.writeFileSync(gameHtml, html.replace(cdn, '/apps/rocket-soccer/three.min.js'));
}

const apps = scanApps(appsDir);
const game = apps.find(app => app.id === 'rocket-soccer');
if (!game) throw new Error('Rocket Soccer was not discovered by apps-scanner.mjs');
fs.writeFileSync(path.join(publicApiDir, 'apps'), JSON.stringify(apps), 'utf8');

console.log('Bundled apps:', apps.map(app => app.id).join(', '));
console.log('Rocket Soccer entry:', game.entry);
console.log('Generated public/api/apps for offline APK discovery.');
