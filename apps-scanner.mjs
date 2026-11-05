/**
 * Shared "drop a folder in apps/ and it shows up" logic.
 * Used by both server.js (production) and the vite dev plugin below,
 * so `npm run dev` and `npm start` behave identically — no code edits
 * needed either way, just add/remove folders under apps/.
 */
import fs from 'fs';
import path from 'path';

export function scanApps(appsDir) {
  if (!fs.existsSync(appsDir)) return [];

  const entries = fs.readdirSync(appsDir, { withFileTypes: true }).filter(e => e.isDirectory());

  return entries
    .map(entry => {
      const folder = entry.name;
      const dir = path.join(appsDir, folder);
      let files;
      try {
        files = fs.readdirSync(dir);
      } catch {
        return null;
      }

      const entryFile = files.includes('index.html') ? 'index.html' : files.find(f => f.endsWith('.html'));
      if (!entryFile) return null; // not a valid app — skip quietly, no crash

      let name = folder.replace(/[-_]/g, ' ');
      name = name.charAt(0).toUpperCase() + name.slice(1);
      let icon = null;

      const manifestPath = path.join(dir, 'manifest.json');
      if (files.includes('manifest.json')) {
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
          if (manifest.name) name = manifest.name;
          if (manifest.icon) icon = manifest.icon;
        } catch {
          // malformed manifest.json — ignore it, fall back to defaults instead of breaking the list
        }
      }
      if (!icon) {
        const iconFile = files.find(f => /^icon\.(png|jpg|jpeg|svg|webp)$/i.test(f));
        if (iconFile) icon = iconFile;
      }

      // بالعرض الصحيح — لقيتها فعلاً: كنا نحط اسم الملف خام بالرابط
      // بدون ترميز، فأي اسم فيه مسافة أو رمز خاص (زي "Rocket Soccer.html")
      // يطلع رابط src="/apps/rocket-soccer/Rocket Soccer.html" فيه
      // مسافة خام — بعض السياقات (iframe/img src جوا React تحديداً)
      // ما تضمن ترميزه تلقائياً قبل الطلب، فيفشل التحميل بصمت أحياناً.
      // encodeURIComponent لكل جزء من المسار يحل هذا نهائياً، أياً كان
      // اسم المجلد أو الملف.
      const enc = (s) => encodeURIComponent(s);
      return {
        id: folder,
        name,
        icon: icon ? `/apps/${enc(folder)}/${enc(icon)}` : null,
        entry: `/apps/${enc(folder)}/${enc(entryFile)}`,
      };
    })
    .filter(Boolean);
}
