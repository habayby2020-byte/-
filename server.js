/**
 * Production server: serves the built app and serves every folder
 * under apps/ as a self-contained mini-app, answering /api/apps by
 * scanning that folder fresh on every request.
 *
 * الاتصال بين الجوال والتلفزيون ما عاد يحتاج أي سيرفر/WebSocket هنا
 * إطلاقاً — هو اتصال Wireless Display (Miracast) أصلي بنظام أندرويد،
 * يديره MiracastPresentationPlugin.java داخل الـ APK مباشرة، بدون أي
 * مرور عبر هذا السيرفر. شوف android-presentation-bridge/README.md.
 *
 * Run after `npm run build`:
 *   node server.js
 */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { scanApps } from './apps-scanner.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;
const APPS_DIR = path.join(__dirname, 'apps');

app.use(express.static(path.join(__dirname, 'dist')));
app.use('/apps', express.static(APPS_DIR));

app.get('/api/apps', (req, res) => {
  res.json(scanApps(APPS_DIR));
});

// SPA fallback — any other route serves the app shell.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`جاهز على http://localhost:${PORT}`);
});
