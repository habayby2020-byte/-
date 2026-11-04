import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';
import { scanApps } from './apps-scanner.mjs';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

/**
 * Makes `npm run dev` understand the apps/ folder the exact same way
 * server.js does in production — so dropping an app folder in shows up
 * immediately in dev too, no rebuild, no restart, no code edit.
 */
function installedAppsPlugin() {
  const appsDir = path.resolve(__dirname, 'apps');
  return {
    name: 'installed-apps',
    configureServer(server: any) {
      // اتصال الجوال بالتلفزيون (Miracast) ما له علاقة بسيرفر التطوير
      // هذا إطلاقاً — يديره MiracastPresentationPlugin.java داخل الـ APK
      // مباشرة، فما فيه شيء نعلّقه هنا بعد الآن.
      server.middlewares.use('/api/apps', (req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(scanApps(appsDir)));
      });
      server.middlewares.use('/apps', (req: any, res: any, next: any) => {
        const safePath = path.normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
        const filePath = path.join(appsDir, safePath);
        if (!filePath.startsWith(appsDir) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          next();
          return;
        }
        res.setHeader('Content-Type', MIME[path.extname(filePath)] || 'application/octet-stream');
        fs.createReadStream(filePath).pipe(res);
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), installedAppsPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
