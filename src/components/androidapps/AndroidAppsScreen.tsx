import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Smartphone, RefreshCw, Search, Star } from 'lucide-react';
import { useWindowManager } from '../../context/WindowManagerContext';
import {
  isInstalledAppsAvailable,
  listInstalledAndroidApps,
  launchInstalledAndroidApp,
  InstalledAndroidApp,
  AndroidLaunchResult,
} from '../../services/installedAndroidApps';

export const AndroidAppsScreen: React.FC = () => {
  const { goBack, isHomePinned, toggleHomePinned } = useWindowManager();
  const [apps, setApps] = useState<InstalledAndroidApp[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [launching, setLaunching] = useState<string | null>(null);
  const [launchResult, setLaunchResult] = useState<AndroidLaunchResult | null>(null);
  const available = isInstalledAppsAvailable();

  const load = async () => {
    setLoadError(null);
    if (!available) {
      setApps(null);
      setLoading(false);
      setLoadError('جسر تطبيقات أندرويد غير متصل بهذه الشاشة.');
      return;
    }
    setLoading(true);
    try {
      const list = await listInstalledAndroidApps();
      if (list === null) {
        setApps([]);
        setLoadError('تعذّر قراءة التطبيقات من أندرويد. أعد فتح الشاشة أو تحقق من صلاحيات/تضمين الإضافة.');
      } else {
        setApps(list);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLaunch = async (app: InstalledAndroidApp) => {
    if (launching) return;
    setLaunching(app.packageName);
    setLaunchResult(null);
    try {
      const result = await launchInstalledAndroidApp(app);
      setLaunchResult(result);
    } finally {
      setLaunching(null);
    }
  };

  const q = query.trim();
  const filteredApps = useMemo(
    () => (apps && q ? apps.filter(a => a.name.includes(q)) : apps),
    [apps, q]
  );

  return (
    <div dir="rtl" className="fixed inset-0 astra-bg text-white flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-6 pt-6 pb-4 astra-fade-up">
        <button onClick={goBack} className="w-10 h-10 rounded-full astra-glass flex items-center justify-center hover:border-[var(--astra-accent)]/50 cursor-pointer shrink-0">
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-extrabold">تطبيقات أندرويد المثبّتة</h1>
          {available && apps && <div className="text-[11px] text-white/35 mt-0.5">{apps.length} تطبيق على جوالك</div>}
        </div>
        {available && (
          <button onClick={load} className="w-10 h-10 rounded-full astra-glass flex items-center justify-center hover:border-[var(--astra-accent)]/50 cursor-pointer shrink-0" title="تحديث">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {available && apps && apps.length > 0 && (
        <div className="px-6 pb-5 astra-fade-up" style={{ animationDelay: '40ms' }}>
          <div className="relative astra-glass rounded-full flex items-center gap-2 px-4 py-2.5 focus-within:border-[var(--astra-accent)]/50 transition-colors">
            <Search className="w-4 h-4 text-white/40 shrink-0" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث بين تطبيقات جوالك..." className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/30 text-white" />
          </div>
        </div>
      )}

      {launchResult && (
        <div className={`mx-6 mb-3 px-4 py-3 rounded-xl border text-xs leading-relaxed ${launchResult.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' : 'bg-rose-500/10 border-rose-500/30 text-rose-200'}`}>
          {launchResult.message}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 pb-10">
        {!available && (
          <div className="astra-glass astra-shadow rounded-2xl p-6 text-center space-y-2 max-w-md mx-auto mt-10">
            <Smartphone className="w-8 h-8 mx-auto text-white/30" />
            <p className="text-sm font-semibold text-white/80">غير متاح بهذه النسخة بعد</p>
            <p className="text-xs text-white/40 leading-relaxed">عرض تطبيقات أندرويد يحتاج الجسر الأصلي المضمّن داخل APK.</p>
          </div>
        )}
        {available && loading && <div className="text-center text-white/40 text-xs mt-10">جار التحميل...</div>}
        {loadError && !loading && (
          <div className="astra-glass rounded-2xl p-5 text-center max-w-md mx-auto mt-8 space-y-3">
            <p className="text-xs text-amber-200 leading-relaxed">{loadError}</p>
            <button onClick={load} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold">إعادة المحاولة</button>
          </div>
        )}
        {available && !loading && !loadError && apps && apps.length === 0 && <div className="text-center text-white/40 text-xs mt-10">ما لقينا أي تطبيقات.</div>}
        {available && !loading && !loadError && filteredApps && filteredApps.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {filteredApps.map((app, i) => (
              <button key={app.packageName} onClick={() => void handleLaunch(app)} disabled={!!launching}
                style={{ animationDelay: `${i * 30}ms` }}
                className="astra-fade-up group relative flex flex-col items-center gap-2 p-4 rounded-2xl astra-glass astra-shadow hover:border-[var(--astra-accent)]/50 hover:-translate-y-1 hover:bg-white/[0.06] active:scale-95 active:translate-y-0 transition-all duration-200 cursor-pointer overflow-hidden disabled:opacity-60">
                <span role="button" onClick={(e) => { e.stopPropagation(); toggleHomePinned({ id: app.packageName, name: app.name, icon: app.iconDataUrl, kind: 'android', packageName: app.packageName }); }}
                  className="absolute top-1.5 left-1.5 z-10 w-6 h-6 rounded-full flex items-center justify-center bg-black/30 hover:bg-black/50"
                  title={isHomePinned(app.packageName) ? 'إزالة من الرئيسية' : 'تثبيت بالرئيسية'}>
                  <Star className={`w-3.5 h-3.5 ${isHomePinned(app.packageName) ? 'fill-[var(--astra-accent)] text-[var(--astra-accent)]' : 'text-white/40'}`} />
                </span>
                {app.iconDataUrl ? <img src={app.iconDataUrl} className="relative w-9 h-9 object-contain rounded-lg" alt="" /> : <Smartphone className="relative w-9 h-9 text-[var(--astra-accent)]" />}
                <span className="relative text-xs font-semibold text-white/80 text-center line-clamp-2">{launching === app.packageName ? 'جارٍ الفتح…' : app.name}</span>
              </button>
            ))}
          </div>
        )}
        {available && !loading && !loadError && q && filteredApps && filteredApps.length === 0 && <div className="text-center text-white/30 text-sm mt-16">ما فيه نتائج لـ "{q}"</div>}
      </div>
    </div>
  );
};
