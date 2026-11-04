import React, { useEffect, useState } from 'react';
import { Settings, FolderOpen, Smartphone, Package } from 'lucide-react';
import { useWindowManager } from '../../context/WindowManagerContext';
import { launchInstalledAndroidApp } from '../../services/installedAndroidApps';

/**
 * القائمة الرئيسية. فيها شكلين مختلفين تماماً عن بعض بقصد:
 *  - زر "استرو" السداسي بالنص — مدخل وحيد يفتح "كل التطبيقات"،
 *    شكله مميز (سداسي الأضلاع) ومختلف كلياً عن بطاقات الشبكة
 *    المستطيلة بشاشة "كل التطبيقات" نفسها.
 *  - رصيف سفلي يعرض بس التطبيقات اللي *انت* ثبّتها بنفسك (نجمة
 *    التثبيت بشاشتي "كل التطبيقات" و"أندرويد") — مو أول ٦ تلقائياً.
 */

const HEX_CLIP = 'polygon(25% 2%, 75% 2%, 100% 50%, 75% 98%, 25% 98%, 0% 50%)';

const DockIcon: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="group relative flex flex-col items-center gap-1.5 cursor-pointer shrink-0">
    <div className="w-12 h-12 rounded-2xl flex items-center justify-center border bg-white/[0.05] border-white/10 text-white/70
                     group-hover:-translate-y-1 group-hover:border-white/25 group-hover:bg-white/[0.09]
                     group-active:translate-y-0 group-active:scale-95 transition-[transform,border-color,background-color] duration-150">
      {icon}
    </div>
    <span className="text-[10px] font-semibold text-white/40 group-hover:text-white/75 transition-colors">{label}</span>
  </button>
);

export const HexHome: React.FC = () => {
  const { openApp, openAppsGrid, openAndroidApps, pinnedHomeApps } = useWindowManager();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' });

  const openPinned = (app: (typeof pinnedHomeApps)[number]) => {
    if (app.kind === 'core') openApp(app.id as any);
    else if (app.kind === 'discovered') openApp('installed', { title: app.name, icon: app.icon, entry: app.entry });
    else if (app.kind === 'android' && app.packageName) launchInstalledAndroidApp(app.packageName);
  };

  return (
    <div dir="rtl" className="fixed inset-0 astra-bg text-white overflow-hidden flex flex-col items-center justify-center">
      {/* توهّجين عملاقين متحركين ببطء — بدون blur، بس gradient + حركة
          مستمرة خفيفة، عشان الخلفية تحس حية وفخمة بدون أي تكلفة أداء. */}
      <div
        className="astra-aurora absolute -top-1/3 -right-1/4 w-[70vw] h-[70vw] max-w-[700px] max-h-[700px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(56,226,255,0.16), transparent 65%)' }}
      />
      <div
        className="astra-aurora-2 absolute -bottom-1/3 -left-1/4 w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(130,110,255,0.14), transparent 65%)' }}
      />

      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(var(--astra-accent) 1px, transparent 1px), linear-gradient(90deg, var(--astra-accent) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      {/* إطار زخرفي رفيع حول حواف الشاشة كلها — لمسة "فخامة" بسيطة
          ورخيصة (حدود بس، بدون أي ظل متحرك). */}
      <div className="absolute inset-3 rounded-[28px] border border-white/[0.06] pointer-events-none" />

      {/* الساعة — أعلى الشاشة، بعيدة عن الزر السداسي */}
      <div className="absolute top-10 inset-x-0 text-center astra-fade-up">
        <div className="text-5xl font-extrabold font-mono tracking-wide astra-glow-text leading-none">{timeStr}</div>
        <div className="text-sm text-white/40 mt-2">{dateStr}</div>
      </div>

      {/* رصيف تنقّل علوي-يسار */}
      <div className="absolute top-10 left-10 flex items-center gap-3 astra-fade-up" style={{ animationDelay: '80ms' }}>
        <DockIcon icon={<Smartphone className="w-5 h-5" />} label="أندرويد" onClick={openAndroidApps} />
        <DockIcon icon={<FolderOpen className="w-5 h-5" />} label="الملفات" onClick={() => openApp('explorer')} />
        <DockIcon icon={<Settings className="w-5 h-5" />} label="الإعدادات" onClick={() => openApp('settings')} />
      </div>

      {/* الزر السداسي — المدخل الوحيد لـ"كل التطبيقات"، شكله مميز
          بقصد (سداسي) عشان ما يتشابه مع بطاقات الشبكة المستطيلة بشاشة
          "كل التطبيقات" نفسها. */}
      <button
        onClick={openAppsGrid}
        className="group relative w-44 h-44 flex items-center justify-center cursor-pointer astra-fade-up"
        style={{ animationDelay: '120ms' }}
      >
        {/* حلقة خارجية دوّارة رفيعة جداً — زخرفة بس، بدون أي تفاعل */}
        <div
          className="astra-slow-spin absolute inset-0 opacity-40 pointer-events-none"
          style={{
            clipPath: HEX_CLIP,
            background: 'conic-gradient(from 0deg, var(--astra-accent), transparent 35%, transparent 65%, var(--astra-accent))',
            padding: 2,
          }}
        >
          <div className="w-full h-full bg-[#070a16]" style={{ clipPath: HEX_CLIP }} />
        </div>
        {/* الجسم السداسي الرئيسي */}
        <div
          className="absolute inset-3 bg-[var(--astra-accent)]/10 border-2 border-[var(--astra-accent)]/50 group-hover:border-[var(--astra-accent)] group-hover:bg-[var(--astra-accent)]/15 group-active:scale-95 transition-[border-color,background-color,transform] duration-150"
          style={{ clipPath: HEX_CLIP }}
        />
        <div className="relative text-center">
          <div className="text-lg font-black tracking-[0.2em] text-[var(--astra-accent)] astra-glow-text">ASTRO</div>
          <div className="text-[9px] text-white/40 mt-1">كل التطبيقات</div>
        </div>
      </button>

      {/* رصيف سفلي — التطبيقات اللي *أنت* ثبّتها بنجمة التثبيت، مو تلقائي */}
      {pinnedHomeApps.length > 0 ? (
        <div className="absolute bottom-9 left-1/2 -translate-x-1/2 astra-fade-up" style={{ animationDelay: '180ms' }}>
          <div className="flex items-end gap-4 px-6 py-3 rounded-[28px] astra-glass astra-shadow max-w-[90vw] overflow-x-auto">
            {pinnedHomeApps.map((app) => (
              <button
                key={app.id}
                onClick={() => openPinned(app)}
                className="group flex flex-col items-center gap-1 cursor-pointer shrink-0"
              >
                <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center group-hover:-translate-y-1.5 group-hover:border-[var(--astra-accent)]/40 transition-[transform,border-color] duration-150">
                  {app.icon ? (
                    <img src={app.icon} className="w-7 h-7 object-contain" alt="" />
                  ) : (
                    <Package className="w-6 h-6 text-[var(--astra-accent)]" />
                  )}
                </div>
                <span className="text-[9px] text-white/40 group-hover:text-white/75 max-w-[56px] truncate">{app.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="absolute bottom-10 inset-x-0 text-center text-[11px] text-white/25 astra-fade-up" style={{ animationDelay: '180ms' }}>
          افتح "كل التطبيقات" أو "أندرويد" واضغط ⭐ على أي تطبيق لتثبيته هنا
        </div>
      )}
    </div>
  );
};
