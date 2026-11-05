import React from 'react';
import { Settings, FolderOpen, Smartphone, Store } from 'lucide-react';
import { useWindowManager } from '../../context/WindowManagerContext';

/**
 * الصفحة الرئيسية — أبسط شاشة بالنظام بقصد: سداسي بالنص (يفتح شاشة
 * "أسترو" المنفصلة عند الضغط عليه — الوقت/الحالة/تطبيقاتك المثبّتة
 * كلها هناك، مو هنا) + ٦ زوايا حوله، ٤ منها أيقونات (متجر التطبيقات/
 * الإعدادات/الملفات/أندرويد)، وزاويتين محجوزتين لحد ما تحدد أيقونتين
 * إضافيتين. صفر بحث، صفر أنيميشن مستمر.
 */

const HEX_CLIP = 'polygon(25% 2%, 75% 2%, 100% 50%, 75% 98%, 25% 98%, 0% 50%)';

const CornerIcon: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  pos: { top: string; left: string };
}> = ({ icon, label, onClick, pos }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    style={{ top: pos.top, left: pos.left }}
    className="group absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 cursor-pointer z-10"
  >
    <div className="w-11 h-11 rounded-full flex items-center justify-center bg-[#0b0f1f] border-2 border-white/15 text-white/70
                     group-hover:border-[var(--astra-accent)] group-hover:text-[var(--astra-accent)] group-active:scale-90
                     transition-[border-color,color,transform] duration-150">
      {icon}
    </div>
    <span className="text-[9px] font-semibold text-white/35 group-hover:text-white/70 whitespace-nowrap transition-colors">{label}</span>
  </button>
);

export const HexHome: React.FC = () => {
  const { openApp, openAstro, openAppsGrid, openAndroidApps } = useWindowManager();

  return (
    <div dir="rtl" className="fixed inset-0 astra-bg text-white overflow-hidden flex items-center justify-center">
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(var(--astra-accent) 1px, transparent 1px), linear-gradient(90deg, var(--astra-accent) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />
      <div className="absolute inset-3 rounded-[28px] border border-white/[0.06] pointer-events-none" />

      {/* الزر السداسي — يفتح شاشة "أسترو" المنفصلة. عنصر div وليس
          button عشان أزرار الزوايا تنحط جواه بدون أزرار متداخلة
          (ما تصح بـ HTML — تسبب سلوك ضغط غريب وغير متوقع). */}
      <div role="button" onClick={openAstro} className="relative w-44 h-44 flex items-center justify-center cursor-pointer astra-fade-up">
        <div
          className="absolute inset-3 bg-[var(--astra-accent)]/10 border-2 border-[var(--astra-accent)]/50 hover:border-[var(--astra-accent)] hover:bg-[var(--astra-accent)]/15 active:scale-95 transition-[border-color,background-color,transform] duration-150"
          style={{ clipPath: HEX_CLIP }}
        />
        <div className="relative text-center">
          <div className="text-lg font-black tracking-[0.2em] text-[var(--astra-accent)] astra-glow-text">ASTRO</div>
        </div>

        {/* ٦ زوايا — ٤ مستخدمة، ٢ محجوزة */}
        <CornerIcon icon={<Store className="w-5 h-5" />} label="متجر التطبيقات" onClick={openAppsGrid} pos={{ top: '50%', left: '-14%' }} />
        <CornerIcon icon={<Settings className="w-5 h-5" />} label="الإعدادات" onClick={() => openApp('settings')} pos={{ top: '4%', left: '27%' }} />
        <CornerIcon icon={<FolderOpen className="w-5 h-5" />} label="الملفات" onClick={() => openApp('explorer')} pos={{ top: '4%', left: '73%' }} />
        <CornerIcon icon={<Smartphone className="w-5 h-5" />} label="أندرويد" onClick={openAndroidApps} pos={{ top: '50%', left: '114%' }} />
        <div className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-dashed border-white/10" style={{ top: '96%', left: '27%' }} />
        <div className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-dashed border-white/10" style={{ top: '96%', left: '73%' }} />
      </div>
    </div>
  );
};
