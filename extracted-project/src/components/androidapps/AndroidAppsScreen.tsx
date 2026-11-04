import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Smartphone, RefreshCw, Search } from 'lucide-react';
import { useWindowManager } from '../../context/WindowManagerContext';
import {
  isInstalledAppsAvailable,
  listInstalledAndroidApps,
  launchInstalledAndroidApp,
  InstalledAndroidApp,
} from '../../services/installedAndroidApps';

export const AndroidAppsScreen: React.FC = () => {
  const { goBack } = useWindowManager();
  const [apps, setApps] = useState<InstalledAndroidApp[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const available = isInstalledAppsAvailable();

  const load = () => {
    if (!available) {
      setLoading(false);
      return;
    }
    setLoading(true);
    listInstalledAndroidApps().then(list => {
      setApps(list);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = query.trim();
  const filteredApps = useMemo(
    () => (apps && q ? apps.filter(a => a.name.includes(q)) : apps),
    [apps, q]
  );

  return (
    <div dir="rtl" className="fixed inset-0 astra-bg text-white flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-6 pt-6 pb-4 astra-fade-up">
        <button
          onClick={goBack}
          className="w-10 h-10 rounded-full astra-glass flex items-center justify-center hover:border-[var(--astra-accent)]/50 cursor-pointer shrink-0"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-extrabold">تطبيقات أندرويد المثبّتة</h1>
          {available && apps && (
            <div className="text-[11px] text-white/35 mt-0.5">{apps.length} تطبيق على جوالك</div>
          )}
        </div>
        {available && (
          <button
            onClick={load}
            className="w-10 h-10 rounded-full astra-glass flex items-center justify-center hover:border-[var(--astra-accent)]/50 cursor-pointer shrink-0"
            title="تحديث"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {available && apps && apps.length > 0 && (
        <div className="px-6 pb-5 astra-fade-up" style={{ animationDelay: '40ms' }}>
          <div className="relative astra-glass rounded-full flex items-center gap-2 px-4 py-2.5 focus-within:border-[var(--astra-accent)]/50 transition-colors">
            <Search className="w-4 h-4 text-white/40 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث بين تطبيقات جوالك..."
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/30 text-white"
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 pb-10">
        {!available && (
          <div className="astra-glass astra-shadow rounded-2xl p-6 text-center space-y-2 max-w-md mx-auto mt-10">
            <Smartphone className="w-8 h-8 mx-auto text-white/30" />
            <p className="text-sm font-semibold text-white/80">غير متاح بهذه النسخة بعد</p>
            <p className="text-xs text-white/40 leading-relaxed">
              عرض تطبيقات أندرويد الحقيقية المثبتة على جوالك (جوجل، كروم، الألعاب...) يحتاج
              إضافة Java جديدة (InstalledAppsPlugin) مبنية ضمن نسخة APK جديدة. الكود جاهز —
              شوف android-installed-apps-bridge/README.md للتركيب.
            </p>
          </div>
        )}

        {available && loading && (
          <div className="text-center text-white/40 text-xs mt-10">جار التحميل...</div>
        )}

        {available && !loading && apps && apps.length === 0 && (
          <div className="text-center text-white/40 text-xs mt-10">ما لقينا أي تطبيقات.</div>
        )}

        {available && !loading && filteredApps && filteredApps.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {filteredApps.map((app, i) => (
              <button
                key={app.packageName}
                onClick={() => launchInstalledAndroidApp(app.packageName)}
                style={{ animationDelay: `${i * 30}ms` }}
                className="astra-fade-up group relative flex flex-col items-center gap-2 p-4 rounded-2xl astra-glass astra-shadow
                           hover:border-[var(--astra-accent)]/50 hover:-translate-y-1 hover:bg-white/[0.06]
                           active:scale-95 active:translate-y-0 transition-all duration-200 cursor-pointer overflow-hidden"
              >
                <div
                  className="pointer-events-none absolute -inset-x-6 -top-8 h-20 rounded-full opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-300"
                  style={{ background: 'radial-gradient(circle, rgba(56,226,255,0.22), transparent 70%)' }}
                />
                {app.iconDataUrl ? (
                  <img src={app.iconDataUrl} className="relative w-9 h-9 object-contain rounded-lg" alt="" />
                ) : (
                  <Smartphone className="relative w-9 h-9 text-[var(--astra-accent)]" />
                )}
                <span className="relative text-xs font-semibold text-white/80 text-center line-clamp-2">{app.name}</span>
              </button>
            ))}
          </div>
        )}

        {available && !loading && q && filteredApps && filteredApps.length === 0 && (
          <div className="text-center text-white/30 text-sm mt-16">ما فيه نتائج لـ "{q}"</div>
        )}
      </div>
    </div>
  );
};
