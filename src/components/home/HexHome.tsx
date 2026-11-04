import React, { useEffect, useState } from 'react';
import { Settings, FolderOpen, LayoutGrid, Smartphone, Package } from 'lucide-react';
import { useWindowManager } from '../../context/WindowManagerContext';

/**
 * القائمة الرئيسية — مقصود تكون بصرياً شيء ثاني كلياً عن شاشة "كل
 * التطبيقات" (AppsGridScreen وأسلوب البطاقات فيها/StoreCard). هنا ما
 * فيه ولا بطاقة: رصيف (dock) علوي بأيقونات دائرية بس + شريط سفلي
 * شفاف فيه أول تطبيقات مثبّتة مباشرة، عشان التطبيقات تظل تظهر من
 * غير ما تتحول الشاشة لنفس شكل الشبكة.
 */

const DockIcon: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  accent?: boolean;
}> = ({ icon, label, onClick, accent }) => (
  <button
    onClick={onClick}
    className="group relative flex flex-col items-center gap-1.5 cursor-pointer shrink-0"
  >
    <div
      className={`w-14 h-14 rounded-2xl flex items-center justify-center border
        group-hover:-translate-y-1 group-active:translate-y-0 group-active:scale-95 transition-[transform,border-color,background-color] duration-150
        ${accent
          ? 'bg-[var(--astra-accent)]/15 border-[var(--astra-accent)]/50 text-[var(--astra-accent)]'
          : 'bg-white/[0.05] border-white/10 text-white/75 group-hover:border-white/25 group-hover:bg-white/[0.09]'}
      `}
    >
      {icon}
    </div>
    <span className="text-[10px] font-semibold text-white/45 group-hover:text-white/80 transition-colors">
      {label}
    </span>
  </button>
);

export const HexHome: React.FC = () => {
  const { openApp, openAppsGrid, openAndroidApps, installedApps } = useWindowManager();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' });

  // أول ٦ تطبيقات مضافة تُعرض كـ"مثبّتة" بالرصيف السفلي — القائمة
  // تكمل تظهر فيها التطبيقات بدون ما تتحول لشبكة بطاقات.
  const pinned = installedApps.slice(0, 6);

  return (
    <div dir="rtl" className="fixed inset-0 astra-bg text-white overflow-hidden">
      {/* شبكة خطوط خفيفة بالخلفية — زخرفة رفيعة بدل الشبكة السداسية القديمة */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(var(--astra-accent) 1px, transparent 1px), linear-gradient(90deg, var(--astra-accent) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      {/* الساعة — نص مجرد كبير بالركن، بدون بطاقة زجاجية حولها */}
      <div className="absolute top-10 right-10 text-right astra-fade-up">
        <div className="text-6xl font-extrabold font-mono tracking-wide astra-glow-text leading-none">{timeStr}</div>
        <div className="text-sm text-white/40 mt-2">{dateStr}</div>
      </div>

      {/* رصيف تنقّل علوي-يسار — أيقونات دائرية فقط، بلا وصف/بطاقة تحتها
          (عكس أسلوب StoreCard بالشبكة) */}
      <div
        className="absolute top-10 left-10 flex items-center gap-3 astra-fade-up"
        style={{ animationDelay: '80ms' }}
      >
        <DockIcon icon={<LayoutGrid className="w-5 h-5" />} label="كل التطبيقات" onClick={openAppsGrid} accent />
        <DockIcon icon={<Smartphone className="w-5 h-5" />} label="أندرويد" onClick={openAndroidApps} />
        <DockIcon icon={<FolderOpen className="w-5 h-5" />} label="الملفات" onClick={() => openApp('explorer')} />
        <DockIcon icon={<Settings className="w-5 h-5" />} label="الإعدادات" onClick={() => openApp('settings')} />
      </div>

      {/* رصيف سفلي عائم — التطبيقات المثبّتة الفعلية تظهر هنا مباشرة
          بدون فتح أي شاشة، بشكل شريط أفقي وليس شبكة بطاقات. */}
      {pinned.length > 0 && (
        <div
          className="absolute bottom-9 left-1/2 -translate-x-1/2 astra-fade-up"
          style={{ animationDelay: '160ms' }}
        >
          <div className="flex items-end gap-4 px-6 py-3 rounded-[28px] astra-glass astra-shadow">
            {pinned.map((app, i) => (
              <button
                key={app.id ?? i}
                onClick={() => openApp('installed', { title: app.name, icon: app.icon, entry: app.entry })}
                className="group flex flex-col items-center gap-1 cursor-pointer shrink-0"
              >
                <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center group-hover:-translate-y-1.5 group-hover:border-[var(--astra-accent)]/40 transition-[transform,border-color] duration-150">
                  {app.icon ? (
                    <img src={app.icon} className="w-7 h-7 object-contain" alt="" />
                  ) : (
                    <Package className="w-6 h-6 text-[var(--astra-accent)]" />
                  )}
                </div>
                <span className="text-[9px] text-white/40 group-hover:text-white/75 max-w-[56px] truncate">
                  {app.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!pinned.length && (
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[11px] text-white/25 astra-fade-up"
          style={{ animationDelay: '160ms' }}
        >
          افتح "كل التطبيقات" لتصفح كل شي متاح على هذا الجهاز
        </div>
      )}
    </div>
  );
};
