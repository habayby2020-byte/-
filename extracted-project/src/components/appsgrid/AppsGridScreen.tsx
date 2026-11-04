import React, { useMemo, useState } from 'react';
import { ArrowRight, Package, Search, Sparkles } from 'lucide-react';
import { useWindowManager } from '../../context/WindowManagerContext';
import { AppId } from '../../types/os';
import { ExplorerIcon, BrowserIcon, SettingsIcon, NotepadIcon, CalculatorIcon, DiagnosticsIcon } from '../icons/WinIcons';

const CORE_APPS: { id: AppId; name: string; desc: string; icon: React.ReactNode }[] = [
  { id: 'explorer', name: 'الملفات', desc: 'مستكشف الملفات والمجلدات', icon: <ExplorerIcon className="w-9 h-9" /> },
  { id: 'notepad', name: 'المفكرة', desc: 'كتابة وتدوين الملاحظات', icon: <NotepadIcon className="w-9 h-9" /> },
  { id: 'calculator', name: 'الحاسبة', desc: 'حاسبة علمية سريعة', icon: <CalculatorIcon className="w-9 h-9" /> },
  { id: 'browser', name: 'المتصفح', desc: 'تصفّح الإنترنت', icon: <BrowserIcon className="w-9 h-9" /> },
  { id: 'settings', name: 'الإعدادات', desc: 'تخصيص وضبط النظام', icon: <SettingsIcon className="w-9 h-9" /> },
  { id: 'diagnostics', name: 'الإصلاح الذاتي', desc: 'فحص وإصلاح المشاكل', icon: <DiagnosticsIcon className="w-9 h-9" /> },
];

/** بطاقة تطبيق بأسلوب متجر — أيقونة بشارة زجاجية + عنوان ووصف، توهّج خفيف عند المرور/التركيز. */
const StoreCard: React.FC<{
  icon: React.ReactNode;
  name: string;
  desc?: string;
  onClick: () => void;
  delay: number;
}> = ({ icon, name, desc, onClick, delay }) => (
  <button
    onClick={onClick}
    style={{ animationDelay: `${delay}ms` }}
    className="astra-fade-up group relative flex flex-col items-start gap-3 p-4 rounded-2xl astra-glass astra-shadow
               hover:border-[var(--astra-accent)]/50 hover:-translate-y-1 hover:bg-white/[0.06]
               active:scale-[0.97] active:translate-y-0 transition-all duration-200 cursor-pointer text-right overflow-hidden"
  >
    <div
      className="pointer-events-none absolute -inset-x-6 -top-10 h-24 rounded-full opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-300"
      style={{ background: 'radial-gradient(circle, rgba(56,226,255,0.22), transparent 70%)' }}
    />
    <div className="relative w-14 h-14 rounded-xl flex items-center justify-center bg-white/[0.06] border border-white/10 text-[var(--astra-accent)] group-hover:border-[var(--astra-accent)]/40 transition-colors">
      {icon}
    </div>
    <div className="relative w-full">
      <div className="text-sm font-bold text-white/90 truncate">{name}</div>
      {desc && <div className="text-[11px] text-white/40 mt-0.5 line-clamp-1">{desc}</div>}
    </div>
  </button>
);

export const AppsGridScreen: React.FC = () => {
  const { openApp, goBack, installedApps } = useWindowManager();
  const [query, setQuery] = useState('');

  const q = query.trim();
  const filteredCore = useMemo(
    () => (q ? CORE_APPS.filter((a) => a.name.includes(q)) : CORE_APPS),
    [q]
  );
  const filteredInstalled = useMemo(
    () => (q ? installedApps.filter((a) => a.name.includes(q)) : installedApps),
    [q, installedApps]
  );
  const totalCount = CORE_APPS.length + installedApps.length;

  return (
    <div dir="rtl" className="fixed inset-0 astra-bg text-white flex flex-col overflow-hidden">
      {/* شريط علوي — عنوان المتجر + عدّاد التطبيقات */}
      <div className="flex items-center gap-3 px-6 pt-6 pb-4 astra-fade-up">
        <button
          onClick={goBack}
          className="w-10 h-10 rounded-full astra-glass flex items-center justify-center hover:border-[var(--astra-accent)]/50 cursor-pointer shrink-0"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-extrabold flex items-center gap-2">
            كل التطبيقات
            <Sparkles className="w-4 h-4 text-[var(--astra-accent)]" />
          </h1>
          <div className="text-[11px] text-white/35 mt-0.5">{totalCount} تطبيق متاح على هذا الجهاز</div>
        </div>
      </div>

      {/* شريط بحث — بأسلوب متجر تطبيقات */}
      <div className="px-6 pb-5 astra-fade-up" style={{ animationDelay: '40ms' }}>
        <div className="relative astra-glass rounded-full flex items-center gap-2 px-4 py-2.5 focus-within:border-[var(--astra-accent)]/50 transition-colors">
          <Search className="w-4 h-4 text-white/40 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن تطبيق..."
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/30 text-white"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-10">
        {filteredCore.length > 0 && (
          <>
            <div className="text-[11px] font-bold text-white/40 mb-3 tracking-wider px-2">تطبيقات النظام</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
              {filteredCore.map((app, i) => (
                <StoreCard
                  key={app.id}
                  icon={app.icon}
                  name={app.name}
                  desc={app.desc}
                  onClick={() => openApp(app.id)}
                  delay={i * 35}
                />
              ))}
            </div>
          </>
        )}

        {filteredInstalled.length > 0 && (
          <>
            <div className="text-[11px] font-bold text-white/40 mb-3 tracking-wider px-2">تطبيقات مضافة</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {filteredInstalled.map((app, i) => (
                <StoreCard
                  key={app.id}
                  icon={
                    app.icon ? (
                      <img src={app.icon} className="w-9 h-9 object-contain" alt="" />
                    ) : (
                      <Package className="w-9 h-9 text-[var(--astra-accent)]" />
                    )
                  }
                  name={app.name}
                  onClick={() => openApp('installed', { title: app.name, icon: app.icon, entry: app.entry })}
                  delay={(filteredCore.length + i) * 35}
                />
              ))}
            </div>
          </>
        )}

        {q && filteredCore.length === 0 && filteredInstalled.length === 0 && (
          <div className="text-center text-white/30 text-sm mt-16">ما فيه نتائج لـ "{q}"</div>
        )}

        {!q && installedApps.length === 0 && (
          <div className="text-[11px] text-white/30 mt-4 px-2">
            ما فيه تطبيقات مضافة بعد — اسحب أي ملف فوق "إضافة-تطبيق.bat" بجذر المشروع ليظهر هنا تلقائياً.
          </div>
        )}
      </div>
    </div>
  );
};
