import React, { useRef, useState } from 'react';
import { Triangle, Circle, Square, X as XIcon } from 'lucide-react';
import {
  DPAD_BUTTONS,
  STICK2_BUTTONS,
  GAMEPAD_ACTION_BUTTONS,
  GAMEPAD_SHOULDER_BUTTONS,
  GAMEPAD_TRIGGER_BUTTONS,
  GAMEPAD_MENU_BUTTONS,
} from '../../cast/controlKeys';

interface GameControllerProps {
  /** ضغط/إفراج حقيقيين — يخلي أكثر من اتجاه أو زر "نازل" بنفس اللحظة،
   * بالضبط زي يد تحكم ألعاب حقيقية (مثلاً فوق+يمين = قطري).
   * buttonId = مفتاح الزر الثابت من controlKeys.ts (شوف GATE_KEYS.gamepad). */
  onKeyDown: (key: string, code: string, buttonId?: string) => void;
  onKeyUp: (key: string, code: string, buttonId?: string) => void;
  fillHeight?: boolean;
}

type Dir = 'up' | 'down' | 'left' | 'right' | 'up-right' | 'up-left' | 'down-right' | 'down-left';
type DirMap = typeof DPAD_BUTTONS;

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

const POS_CLASS: Record<string, string> = {
  top: 'top-0 left-1/2 -translate-x-1/2',
  right: 'top-1/2 right-0 -translate-y-1/2',
  bottom: 'bottom-0 left-1/2 -translate-x-1/2',
  left: 'top-1/2 left-0 -translate-y-1/2',
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  'gamepad.action.top': <Triangle className="w-4 h-4" />,
  'gamepad.action.right': <XIcon className="w-4 h-4" />,
  'gamepad.action.left': <Square className="w-4 h-4" />,
  'gamepad.action.bottom': <Circle className="w-4 h-4" />,
};

/** زر بسيط (كتف/زناد/قائمة) — نفس شكل الضغط/الإفراج المشترك بين
 * الثلاثة، بدون تكرار نفس المعالج ثلاث مرات. */
const FlatButton: React.FC<{
  buttonId: string;
  label: string;
  keyCode: { key: string; code: string };
  pressed: string | null;
  setPressed: (id: string | null) => void;
  onKeyDown: GameControllerProps['onKeyDown'];
  onKeyUp: GameControllerProps['onKeyUp'];
  className?: string;
}> = ({ buttonId, label, keyCode, pressed, setPressed, onKeyDown, onKeyUp, className }) => (
  <button
    onTouchStart={(e) => { e.preventDefault(); setPressed(buttonId); onKeyDown(keyCode.key, keyCode.code, buttonId); }}
    onTouchEnd={(e) => { e.preventDefault(); setPressed(null); onKeyUp(keyCode.key, keyCode.code, buttonId); }}
    onTouchCancel={() => { setPressed(null); onKeyUp(keyCode.key, keyCode.code, buttonId); }}
    className={`rounded-lg flex items-center justify-center border-2 touch-none text-[10px] font-bold text-white/60 transition-[background-color,border-color,transform] ${
      pressed === buttonId ? 'bg-white/20 border-white scale-95 text-white' : 'bg-slate-800/80 border-slate-600'
    } ${className ?? ''}`}
  >
    {label}
  </button>
);

/** عصا دائرية (D-pad أو عصا ثانية) — إصبع واحد، زاويته تحدد الاتجاه،
 * 8 اتجاهات، بدون أي كتابة. نفس منطق واحد يُستخدم مرتين (حركة + نظر). */
function useAnalogStick(map: DirMap, onKeyDown: GameControllerProps['onKeyDown'], onKeyUp: GameControllerProps['onKeyUp']) {
  const ref = useRef<HTMLDivElement>(null);
  const activeRef = useRef<Dir | null>(null);
  const [active, setActive] = useState<Dir | null>(null);

  const release = () => {
    const prev = activeRef.current;
    if (prev) map[prev].keys.forEach(k => onKeyUp(k.key, k.code, map[prev].buttonId));
    activeRef.current = null;
    setActive(null);
  };

  const apply = (dir: Dir) => {
    if (activeRef.current === dir) return;
    const prev = activeRef.current;
    if (prev) map[prev].keys.forEach(k => onKeyUp(k.key, k.code, map[prev].buttonId));
    map[dir].keys.forEach(k => onKeyDown(k.key, k.code, map[dir].buttonId));
    activeRef.current = dir;
    setActive(dir);
  };

  const fromTouch = (e: React.TouchEvent) => {
    const el = ref.current;
    const t = e.touches[0];
    if (!el || !t) return;
    const rect = el.getBoundingClientRect();
    const dx = t.clientX - (rect.left + rect.width / 2);
    const dy = t.clientY - (rect.top + rect.height / 2);
    const dist = Math.hypot(dx, dy);
    if (dist < rect.width * 0.16) { release(); return; }
    apply(angleToDir(dx, dy));
  };

  return { ref, active, fromTouch, release };
}

export const GameController: React.FC<GameControllerProps> = ({ onKeyDown, onKeyUp, fillHeight }) => {
  const [pressedBtn, setPressedBtn] = useState<string | null>(null);
  const dpad = useAnalogStick(DPAD_BUTTONS, onKeyDown, onKeyUp);
  const stick2 = useAnalogStick(STICK2_BUTTONS, onKeyDown, onKeyUp);

  const padSize = fillHeight ? 'w-32 h-32' : 'w-28 h-28';
  const stick2Size = fillHeight ? 'w-20 h-20' : 'w-16 h-16';
  const diamondSize = fillHeight ? 'w-32 h-32' : 'w-28 h-28';
  const btnSize = fillHeight ? 'w-14 h-14' : 'w-11 h-11';

  const DirIcon = ({ dir, small }: { dir: Dir; small?: boolean }) => {
    const rot: Record<Dir, number> = {
      right: 0, 'down-right': 45, down: 90, 'down-left': 135,
      left: 180, 'up-left': 225, up: 270, 'up-right': 315,
    };
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ transform: `rotate(${rot[dir]}deg)` }}>
        <div
          className="w-0 h-0 border-y-transparent border-r-[var(--astra-accent)]"
          style={{ borderTopWidth: small ? 6 : 9, borderBottomWidth: small ? 6 : 9, borderRightWidth: small ? 10 : 14, borderStyle: 'solid', borderLeftWidth: 0 }}
        />
      </div>
    );
  };

  return (
    <div className={`select-none ${fillHeight ? 'h-full flex flex-col justify-center items-stretch gap-2' : 'space-y-2'}`}>
      {/* زناد فوق: L2 / R2 */}
      <div className="flex items-center justify-between px-2">
        {GAMEPAD_TRIGGER_BUTTONS.map((b) => (
          <FlatButton key={b.buttonId} buttonId={b.buttonId} label={b.label} keyCode={b} pressed={pressedBtn} setPressed={setPressedBtn} onKeyDown={onKeyDown} onKeyUp={onKeyUp} className="w-16 h-7" />
        ))}
      </div>

      {/* كتف: L1 / R1 */}
      <div className="flex items-center justify-between px-3">
        {GAMEPAD_SHOULDER_BUTTONS.map((b) => (
          <FlatButton key={b.buttonId} buttonId={b.buttonId} label={b.label} keyCode={b} pressed={pressedBtn} setPressed={setPressedBtn} onKeyDown={onKeyDown} onKeyUp={onKeyUp} className="w-16 h-8" />
        ))}
      </div>

      {/* وسط صغير: اختيار / بدء */}
      <div className="flex items-center justify-center gap-4">
        {GAMEPAD_MENU_BUTTONS.map((b) => (
          <FlatButton key={b.buttonId} buttonId={b.buttonId} label={b.label} keyCode={b} pressed={pressedBtn} setPressed={setPressedBtn} onKeyDown={onKeyDown} onKeyUp={onKeyUp} className="w-14 h-6 text-[9px] text-white/40" />
        ))}
      </div>

      {/* المنطقة الرئيسية: D-pad + عصا ثانية (يسار، فوق بعض) — أزرار الحركة (يمين) */}
      <div className="flex items-center justify-between gap-4 px-2 flex-1">
        <div className="flex flex-col items-center gap-3 shrink-0">
          <div
            ref={dpad.ref}
            onTouchStart={dpad.fromTouch}
            onTouchMove={dpad.fromTouch}
            onTouchEnd={dpad.release}
            onTouchCancel={dpad.release}
            className={`relative ${padSize} rounded-full bg-slate-800/70 border-2 border-slate-700 touch-none`}
          >
            <div className="absolute inset-3 rounded-full bg-slate-900/60 border border-slate-700" />
            {dpad.active && <DirIcon dir={dpad.active} />}
            <div className={`absolute w-5 h-5 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-colors ${dpad.active ? 'bg-[var(--astra-accent)]' : 'bg-slate-600'}`} />
          </div>

          {/* عصا ثانية — نظر/كاميرا، أصغر، تحت D-pad مباشرة */}
          <div
            ref={stick2.ref}
            onTouchStart={stick2.fromTouch}
            onTouchMove={stick2.fromTouch}
            onTouchEnd={stick2.release}
            onTouchCancel={stick2.release}
            className={`relative ${stick2Size} rounded-full bg-slate-800/50 border-2 border-slate-700/80 touch-none`}
          >
            <div className="absolute inset-2.5 rounded-full bg-slate-900/50 border border-slate-700" />
            {stick2.active && <DirIcon dir={stick2.active} small />}
            <div className={`absolute w-3.5 h-3.5 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-colors ${stick2.active ? 'bg-[var(--astra-accent)]' : 'bg-slate-600'}`} />
          </div>
        </div>

        {/* أزرار الحركة — شكل "ماسي" زي يد تحكم حقيقية (فوق/يمين/تحت/يسار). */}
        <div className={`relative ${diamondSize} shrink-0`}>
          {GAMEPAD_ACTION_BUTTONS.map((b) => (
            <button
              key={b.buttonId}
              onTouchStart={(e) => { e.preventDefault(); setPressedBtn(b.buttonId); onKeyDown(b.key, b.code, b.buttonId); }}
              onTouchEnd={(e) => { e.preventDefault(); setPressedBtn(null); onKeyUp(b.key, b.code, b.buttonId); }}
              onTouchCancel={() => { setPressedBtn(null); onKeyUp(b.key, b.code, b.buttonId); }}
              className={`absolute ${POS_CLASS[b.pos]} ${btnSize} rounded-full flex items-center justify-center border-2 touch-none transition-[background-color,border-color,transform] ${
                pressedBtn === b.buttonId ? 'bg-white/20 border-white scale-90' : 'bg-slate-800/80 border-slate-600'
              } ${b.color}`}
            >
              {ACTION_ICONS[b.buttonId] ?? (
                <span className="text-[10px] font-bold">{(b.key.length === 1 ? b.key.toUpperCase() : b.key).slice(0, 3)}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="text-center text-[10px] text-white/30">
        عصا يسار = حركة · عصا يمين = نظر · كل المفاتيح بملف src/cast/controlKeys.ts
      </div>
    </div>
  );
};
