import React, { useEffect } from 'react';
import { Hexagon } from 'lucide-react';

interface Props {
  name: string;
  onDone: () => void;
}

/**
 * شاشة ترحيب تظهر مرة وحدة بعد كل دخول ناجح (تسجيل جديد أو فتح
 * بالرمز) — أنيميشن قصير ثم تختفي تلقائياً لوحدها لسطح ASTRO
 * الرئيسي. تقدر تضغط بأي مكان لتخطيها فوراً (مفيد لو حد مستعجل).
 */
export const WelcomeIntro: React.FC<Props> = ({ name, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      dir="rtl"
      onClick={onDone}
      className="fixed inset-0 z-[400] astra-bg flex flex-col items-center justify-center gap-6 cursor-pointer overflow-hidden"
    >
      {/* حلقات متوهجة بالخلفية */}
      <div className="absolute w-[420px] h-[420px] rounded-full border border-[var(--astra-accent)]/20 astra-pulse-ring" />
      <div className="absolute w-[300px] h-[300px] rounded-full border border-[var(--astra-accent-2)]/25 astra-pulse-ring" style={{ animationDelay: '0.6s' }} />

      <div className="relative w-24 h-24 flex items-center justify-center astra-float">
        <div className="absolute inset-0 astra-ring astra-hex" />
        <div className="absolute inset-[4px] astra-hex bg-[#04050c] flex items-center justify-center">
          <Hexagon className="w-10 h-10 text-[var(--astra-accent)]" strokeWidth={2.2} />
        </div>
      </div>

      <div className="text-center space-y-2 astra-fade-up" style={{ animationDelay: '250ms' }}>
        <h1 className="text-2xl font-extrabold astra-shimmer-text">مرحباً بك في عالمك الآخر</h1>
        <p className="text-sm text-white/50">{name}</p>
      </div>
    </div>
  );
};
