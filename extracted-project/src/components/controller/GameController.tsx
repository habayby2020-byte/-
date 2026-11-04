import React, { useRef, useState } from 'react';
import { Triangle, Circle, Square, X as XIcon } from 'lucide-react';

interface GameControllerProps {
  /** ضغط/إفراج حقيقيين — يخلي أكثر من اتجاه أو زر "نازل" بنفس اللحظة،
   * بالضبط زي يد تحكم ألعاب حقيقية (مثلاً فوق+يمين = قطري). */
  onKeyDown: (key: string, code: string) => void;
  onKeyUp: (key: string, code: string) => void;
  fillHeight?: boolean;
}

type Dir = 'up' | 'down' | 'left' | 'right' | 'up-right' | 'up-left' | 'down-right' | 'down-left';

// كل اتجاه = مفتاح واحد أو مفتاحين نازلين سوا (القطري) — بدون أي كتابة،
// بالضبط زي D-pad حقيقي: زاوية إصبعك تحدد الاتجاه مباشرة.
const DIR_KEYS: Record<Dir, { key: string; code: string }[]> = {
  up: [{ key: 'ArrowUp', code: 'ArrowUp' }],
  down: [{ key: 'ArrowDown', code: 'ArrowDown' }],
  left: [{ key: 'ArrowLeft', code: 'ArrowLeft' }],
  right: [{ key: 'ArrowRight', code: 'ArrowRight' }],
  'up-right': [
    { key: 'ArrowUp', code: 'ArrowUp' },
    { key: 'ArrowRight', code: 'ArrowRight' },
  ],
  'up-left': [
    { key: 'ArrowUp', code: 'ArrowUp' },
    { key: 'ArrowLeft', code: 'ArrowLeft' },
  ],
  'down-right': [
    { key: 'ArrowDown', code: 'ArrowDown' },
    { key: 'ArrowRight', code: 'ArrowRight' },
  ],
  'down-left': [
    { key: 'ArrowDown', code: 'ArrowDown' },
    { key: 'ArrowLeft', code: 'ArrowLeft' },
  ],
};

function angleToDir(dx: number, dy: number): Dir {
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI; // -180..180, 0 = يمين
  if (deg >= -22.5 && deg < 22.5) return 'right';
  if (deg >= 22.5 && deg < 67.5) return 'down-right';
  if (deg >= 67.5 && deg < 112.5) return 'down';
  if (deg >= 112.5 && deg < 157.5) return 'down-left';
  if (deg >= 157.5 || deg < -157.5) return 'left';
  if (deg >= -157.5 && deg < -112.5) return 'up-left';
  if (deg >= -112.5 && deg < -67.5) return 'up';
  return 'up-right';
}

interface ActionButton {
  /** نص قصير تختاره أنت (مثلاً "دعس" أو "فرامل") — اختياري، يظهر بدل الرمز لو حطيته. */
  label?: string;
  icon?: React.ReactNode;
  key: string;
  code: string;
  color: string;
}

/**
 * أزرار الحركة — بلا حد أقصى، هذي بالضبط نقطة التعديل اللي تسألني
 * عنها: ضيف أي عدد أسطر تبيه هنا، كل سطر = زر جديد بمفتاحه الخاص.
 * ما فيه ولا قيد على عدد الأسطر ولا مكانها — تلقائيًا تترتب بشكل
 * متجاوب (تلف لصف جديد لو ما كفت المساحة).
 *
 * مثال لعبة سيارات — بدّل الأربعة اللي تحت بأي شي زي:
 *   { label: 'دعس',    key: 'ArrowUp',   code: 'ArrowUp',   color: 'text-emerald-400' },
 *   { label: 'فرامل',  key: 'ArrowDown', code: 'ArrowDown', color: 'text-rose-400' },
 *   { label: 'يد',     key: ' ',         code: 'Space',     color: 'text-amber-400' },
 *   { label: 'بوق',    key: 'h',         code: 'KeyH',      color: 'text-blue-400' },
 *   { label: 'نيترو',  key: 'n',         code: 'KeyN',      color: 'text-violet-400' },
 * — أضف كم زر تبي بنفس الشكل، بدون أي تعديل ثاني بالكود.
 */
const ACTION_BUTTONS: ActionButton[] = [
  { icon: <Triangle className="w-4 h-4" />, key: 'Enter', code: 'Enter', color: 'text-emerald-400' },
  { icon: <XIcon className="w-4 h-4" />, key: 'Control', code: 'ControlLeft', color: 'text-blue-400' },
  { icon: <Square className="w-4 h-4" />, key: 'Shift', code: 'ShiftLeft', color: 'text-pink-400' },
  { icon: <Circle className="w-4 h-4" />, key: ' ', code: 'Space', color: 'text-amber-400' },
];

export const GameController: React.FC<GameControllerProps> = ({ onKeyDown, onKeyUp, fillHeight }) => {
  const padRef = useRef<HTMLDivElement>(null);
  const activeDirRef = useRef<Dir | null>(null);
  const [activeDir, setActiveDir] = useState<Dir | null>(null);
  const [pressedBtn, setPressedBtn] = useState<string | null>(null);

  const releaseDir = () => {
    const prev = activeDirRef.current;
    if (prev) DIR_KEYS[prev].forEach(k => onKeyUp(k.key, k.code));
    activeDirRef.current = null;
    setActiveDir(null);
  };

  const applyDir = (dir: Dir) => {
    if (activeDirRef.current === dir) return;
    const prev = activeDirRef.current;
    if (prev) DIR_KEYS[prev].forEach(k => onKeyUp(k.key, k.code));
    DIR_KEYS[dir].forEach(k => onKeyDown(k.key, k.code));
    activeDirRef.current = dir;
    setActiveDir(dir);
  };

  const fromTouch = (e: React.TouchEvent) => {
    const el = padRef.current;
    const t = e.touches[0];
    if (!el || !t) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = t.clientX - cx;
    const dy = t.clientY - cy;
    const dist = Math.hypot(dx, dy);
    // منطقة ميتة بالنص — يرفع إصبعه شوي بالنص بدون ما يرسل اتجاه خطأ
    if (dist < rect.width * 0.14) {
      releaseDir();
      return;
    }
    applyDir(angleToDir(dx, dy));
  };

  const DirIcon = ({ dir }: { dir: Dir }) => {
    const rot: Record<Dir, number> = {
      right: 0, 'down-right': 45, down: 90, 'down-left': 135,
      left: 180, 'up-left': 225, up: 270, 'up-right': 315,
    };
    return (
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ transform: `rotate(${rot[dir]}deg)` }}
      >
        <div className="w-0 h-0 border-y-[9px] border-y-transparent border-r-[14px] border-r-[var(--astra-accent)]" />
      </div>
    );
  };

  return (
    <div className={`select-none ${fillHeight ? 'h-full flex flex-col justify-center' : ''}`}>
      <div className="flex items-center justify-between gap-6 px-2">
        {/* D-pad دائري — إصبع واحد، زاويته تحدد الاتجاه (8 اتجاهات بدون كتابة) */}
        <div
          ref={padRef}
          onTouchStart={(e) => { fromTouch(e); }}
          onTouchMove={(e) => { fromTouch(e); }}
          onTouchEnd={releaseDir}
          onTouchCancel={releaseDir}
          className="relative w-36 h-36 rounded-full bg-slate-800/70 border-2 border-slate-700 touch-none shrink-0"
        >
          <div className="absolute inset-3 rounded-full bg-slate-900/60 border border-slate-700" />
          {activeDir && <DirIcon dir={activeDir} />}
          <div
            className={`absolute w-5 h-5 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-colors ${
              activeDir ? 'bg-[var(--astra-accent)]' : 'bg-slate-600'
            }`}
          />
        </div>

        {/* أزرار الحركة — عدد مفتوح، تلف لصف جديد تلقائياً لو زاد العدد. */}
        <div className="flex flex-wrap content-center gap-2 max-w-[220px]">
          {ACTION_BUTTONS.map((b) => (
            <button
              key={b.code}
              onTouchStart={(e) => { e.preventDefault(); setPressedBtn(b.code); onKeyDown(b.key, b.code); }}
              onTouchEnd={(e) => { e.preventDefault(); setPressedBtn(null); onKeyUp(b.key, b.code); }}
              onTouchCancel={() => { setPressedBtn(null); onKeyUp(b.key, b.code); }}
              className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all touch-none shrink-0 ${
                pressedBtn === b.code
                  ? 'bg-white/20 border-white scale-90'
                  : 'bg-slate-800/80 border-slate-600'
              } ${b.color}`}
            >
              {b.label ? <span className="text-[11px] font-bold">{b.label}</span> : b.icon}
            </button>
          ))}
        </div>
      </div>
      <div className="text-center text-[10px] text-white/30 mt-3">
        D-pad 8 اتجاهات (قطري = مفتاحين سوا) · أزرار الحركة تقدر تضيف منها كم ما تبي
      </div>
    </div>
  );
};
