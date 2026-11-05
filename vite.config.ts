import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';
import { scanApps } from './apps-scanner.mjs';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

/**
 * Keeps apps/ available in both the dev server and the packaged Android APK.
 * Capacitor serves only files inside dist, so build-time copying is required.
 */
function installedAppsPlugin() {
  const appsDir = path.resolve(__dirname, 'apps');
  const distDir = path.resolve(__dirname, 'dist');

  return {
    name: 'installed-apps',
    configureServer(server: any) {
      // Miracast is handled natively by MiracastPresentationPlugin.java.
      server.middlewares.use('/api/apps', (_req: any, res: any) => {
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
    closeBundle() {
      // Include every installed mini-app in the web bundle copied into the APK.
      if (fs.existsSync(appsDir)) {
        fs.cpSync(appsDir, path.join(distDir, 'apps'), { recursive: true });
      }

      // Android's WebView has no Node/Express server. Serve the app catalogue
      // as a static endpoint at the same URL the React app already requests.
      const apiDir = path.join(distDir, 'api');
      fs.mkdirSync(apiDir, { recursive: true });
      fs.writeFileSync(
        path.join(apiDir, 'apps'),
        JSON.stringify(scanApps(appsDir)),
        'utf8'
      );
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
