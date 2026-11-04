import React, { useEffect, useState } from 'react';
import { Hexagon, Settings, FolderOpen, LayoutGrid, Smartphone } from 'lucide-react';
import { useWindowManager } from '../../context/WindowManagerContext';

const CornerButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  position: string;
  onClick: () => void;
  delay: string;
}> = ({ icon, label, position, onClick, delay }) => (
  <button
    onClick={onClick}
    style={{ animationDelay: delay }}
    className={`absolute ${position} astra-fade-up flex flex-col items-center gap-2 group cursor-pointer`}
  >
    <div className="relative w-16 h-16 rounded-full astra-glass flex items-center justify-center text-[var(--astra-accent)] group-hover:border-[var(--astra-accent)]/60 group-hover:bg-white/10 group-hover:-translate-y-0.5 group-active:scale-95 group-active:translate-y-0 transition-all astra-shadow overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-300"
        style={{ background: 'radial-gradient(circle, rgba(56,226,255,0.3), transparent 70%)' }}
      />
      <div className="relative">{icon}</div>
    </div>
    <span className="text-[11px] font-semibold text-white/70 group-hover:text-white transition-colors">{label}</span>
  </button>
);

export const HexHome: React.FC = () => {
  const { openApp, openAppsGrid, openAndroidApps } = useWindowManager();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div dir="rtl" className="fixed inset-0 astra-bg text-white overflow-hidden">
      {/* الساعة والتاريخ أعلى الشاشة — داخل بطاقة زجاجية بدل نص عائم */}
      <div className="absolute top-7 left-1/2 -translate-x-1/2 text-center astra-fade-up">
        <div className="astra-glass astra-shadow rounded-2xl px-7 py-3">
          <div className="text-3xl font-extrabold font-mono tracking-wide astra-glow-text">{timeStr}</div>
          <div className="text-xs text-white/40 mt-1">{dateStr}</div>
        </div>
      </div>

      {/* شبكة سداسية خفيفة بالخلفية — زخرفة بس */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(60deg, var(--astra-accent) 0, var(--astra-accent) 1px, transparent 1px, transparent 64px), repeating-linear-gradient(-60deg, var(--astra-accent) 0, var(--astra-accent) 1px, transparent 1px, transparent 64px)',
        }}
      />

      {/* زر ASTRA المركزي — يفتح شاشة كل التطبيقات */}
      <div className="absolute inset-0 flex items-center justify-center">
        <button
          onClick={openAppsGrid}
          className="relative w-44 h-44 flex items-center justify-center group cursor-pointer astra-fade-up"
          style={{ animationDelay: '80ms' }}
        >
          <div className="absolute inset-0 astra-ring astra-hex opacity-80 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-[6px] astra-hex bg-[#070a18] flex flex-col items-center justify-center gap-1.5 group-active:scale-95 transition-transform">
            <Hexagon className="w-9 h-9 text-[var(--astra-accent)]" strokeWidth={2} />
            <span className="text-sm font-extrabold tracking-[0.2em]">ASTRA</span>
            <span className="text-[10px] text-white/40">كل التطبيقات</span>
          </div>
        </button>
      </div>

      {/* أربع أيقونات بالزوايا */}
      <CornerButton
        icon={<Settings className="w-6 h-6" />}
        label="الإعدادات"
        position="top-24 right-10"
        onClick={() => openApp('settings')}
        delay="140ms"
      />
      <CornerButton
        icon={<FolderOpen className="w-6 h-6" />}
        label="الملفات"
        position="top-24 left-10"
        onClick={() => openApp('explorer')}
        delay="200ms"
      />
      <CornerButton
        icon={<LayoutGrid className="w-6 h-6" />}
        label="التطبيقات"
        position="bottom-10 right-10"
        onClick={openAppsGrid}
        delay="260ms"
      />
      <CornerButton
        icon={<Smartphone className="w-6 h-6" />}
        label="تطبيقات أندرويد"
        position="bottom-10 left-10"
        onClick={openAndroidApps}
        delay="320ms"
      />
    </div>
  );
};
