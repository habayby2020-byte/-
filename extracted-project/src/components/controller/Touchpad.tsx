import React, { useRef, useState } from 'react';
import { MousePointer2 } from 'lucide-react';

interface TouchpadProps {
  onMove: (dx: number, dy: number) => void;
  onClick: () => void;
  onRightClick: () => void;
  /** ملء الشاشة + الكيبورد ظاهر سوا = تاتش باد يمد ليملا كل الارتفاع المتاح بدل ارتفاع ثابت صغير. */
  fillHeight?: boolean;
}

// Multiplies raw finger movement so a small phone-size swipe covers the
// whole TV width — a 1:1 mapping would make the cursor barely creep.
const SENSITIVITY = 2.2;
// Two fingers moving together at once = a tap-and-drag gone wrong is
// avoided by only tracking the first touch point; a second finger landing
// (common while resting a thumb) is ignored rather than jumping the cursor.
const TAP_MOVE_THRESHOLD = 8;
const TAP_MAX_MS = 250;

export const Touchpad: React.FC<TouchpadProps> = ({ onMove, onClick, onRightClick, fillHeight }) => {
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const tapStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const movedRef = useRef(0);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [active, setActive] = useState(false);

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    setActive(true);
    lastRef.current = { x: t.clientX, y: t.clientY };
    tapStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
    movedRef.current = 0;

    longPressTimerRef.current = setTimeout(() => {
      onRightClick();
      tapStartRef.current = null; // long-press already resolved as right-click
    }, 550);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t || !lastRef.current) return;
    const dx = (t.clientX - lastRef.current.x) * SENSITIVITY;
    const dy = (t.clientY - lastRef.current.y) * SENSITIVITY;
    movedRef.current += Math.abs(t.clientX - lastRef.current.x) + Math.abs(t.clientY - lastRef.current.y);
    lastRef.current = { x: t.clientX, y: t.clientY };
    if (movedRef.current > TAP_MOVE_THRESHOLD) clearLongPress();
    onMove(dx, dy);
  };

  const handleTouchEnd = () => {
    clearLongPress();
    setActive(false);
    lastRef.current = null;
    const tap = tapStartRef.current;
    tapStartRef.current = null;
    if (tap && movedRef.current <= TAP_MOVE_THRESHOLD && Date.now() - tap.time <= TAP_MAX_MS) {
      onClick();
    }
  };

  return (
    <div className={`space-y-1.5 ${fillHeight ? 'h-full flex flex-col' : ''}`}>
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className={`relative w-full rounded-xl border-2 touch-none select-none transition-colors flex items-center justify-center ${
          fillHeight ? 'flex-1 min-h-[140px]' : 'h-48'
        } ${active ? 'border-blue-500 bg-slate-800/80' : 'border-slate-700 bg-slate-800/50'}`}
      >
        {!active && (
          <div className="flex flex-col items-center gap-1.5 text-slate-500">
            <MousePointer2 className="w-5 h-5" />
            <span className="text-[11px]">حرّك إصبعك هنا كماوس — ضغطة سريعة = كليك، اضغط مطولاً = كليك يمين</span>
          </div>
        )}
      </div>
      <div className="flex gap-1.5">
        <button
          onClick={onClick}
          className="flex-1 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 active:bg-blue-600 text-white text-xs font-medium"
        >
          كليك يسار
        </button>
        <button
          onClick={onRightClick}
          className="flex-1 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 active:bg-blue-600 text-white text-xs font-medium"
        >
          كليك يمين
        </button>
      </div>
    </div>
  );
};
