import React, { useEffect, useRef, useState } from 'react';
import { Tv, Settings, ChevronUp, ChevronDown, Eye, EyeOff, Wifi, CheckCircle2, Maximize, Minimize, ImagePlus, Loader2 } from 'lucide-react';
import { Touchpad } from './Touchpad';
import { VirtualKeyboard } from './VirtualKeyboard';
import { GameController } from './GameController';
import { initCastSender, requestCastSession, subscribeCastSender, sendCastMessage } from '../../cast/sender';
import { CastMessage } from '../../cast/types';
import { MOUSE_BUTTONS, KEYBOARD_BUTTONS } from '../../cast/controlKeys';
import { isPhotoPickerAvailable, pickPhotoDataUrl } from '../../services/photoPicker';

type TileId = 'touchpad' | 'keyboard' | 'gamepad';

interface TileConfig {
  id: TileId;
  visible: boolean;
}

const DEFAULT_LAYOUT: TileConfig[] = [
  { id: 'touchpad', visible: true },
  { id: 'keyboard', visible: true },
  { id: 'gamepad', visible: false },
];

const LAYOUT_STORAGE_KEY = 'nexus-controller-layout-v2';

function loadLayout(): TileConfig[] {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return DEFAULT_LAYOUT;
    const parsed = JSON.parse(raw) as TileConfig[];
    // Guard against a stale saved layout missing a tile added later.
    const ids = parsed.map(t => t.id);
    const merged = [...parsed, ...DEFAULT_LAYOUT.filter(t => !ids.includes(t.id))];
    return merged;
  } catch {
    return DEFAULT_LAYOUT;
  }
}

const TILE_LABELS: Record<TileId, string> = {
  touchpad: 'لوحة الماوس (تاتش باد)',
  keyboard: 'الكيبورد',
  gamepad: 'يد تحكم الألعاب',
};

export const ControllerApp: React.FC = () => {
  const [layout, setLayout] = useState<TileConfig[]>(loadLayout);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // تنبيه محلي بالجوال نفسه — أي زر تضغطه (ماوس أو كيبورد) يظهر اسمه
  // هنا فوراً، بالإضافة لـ KeyFeedbackOverlay اللي يظهر على التلفزيون.
  const [lastAction, setLastAction] = useState<string | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flash = (label: string) => {
    setLastAction(label);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setLastAction(null), 900);
  };

  // --- طريق الاتصال الوحيد: Miracast الأصلي بنظام أندرويد ---
  const [available, setAvailable] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [castError, setCastError] = useState<string | null>(null);

  useEffect(() => {
    initCastSender();
    return subscribeCastSender(state => {
      setAvailable(state.available);
      setConnected(state.connected);
      setConnecting(state.connecting);
      setDisplayName(state.displayName);
      setCastError(state.error);
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  }, [layout]);

  // ملء الشاشة: يخفي شريط عنوان المتصفح/النظام ويكبّر مساحة لوحة
  // اللمس والكيبورد، بالذات مفيد للكيبورد الجديد اللي صار فيه أزرار أكثر.
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // لحظة ما يتصل التلفزيون فعلياً (connected يصير true)، نحاول نكبّر
  // شاشة الجوال (التاتش باد/الكيبورد) ملء الشاشة تلقائياً — بدون ما
  // تضغط زر "ملء الشاشة" بنفسك. غير إجباري بالكامل: بعض المتصفحات
  // ترفض fullscreen() لو ما جت من ضغطة مباشرة — لو رفض، نكمل عادي
  // بالوضع العادي بدون ما نوقف أو نكسر شيء. الاتصال نفسه ما له علاقة
  // بهذا إطلاقاً، هذا بس يراقب حالة connected الموجودة أصلاً.
  const autoFsTriedRef = useRef(false);
  useEffect(() => {
    if (connected && !autoFsTriedRef.current && !document.fullscreenElement) {
      autoFsTriedRef.current = true;
      rootRef.current?.requestFullscreen?.().catch(() => {
        // رُفض (يحتاج ضغطة مباشرة بمتصفحات معينة) — يضل الوضع العادي شغال تمام.
      });
    }
    if (!connected) autoFsTriedRef.current = false;
  }, [connected]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await rootRef.current?.requestFullscreen?.();
        // تدوير أفقي (مستطيل) عشان الماوس والكيبورد ياخذوا أقصى
        // مساحة ممكنة — اختياري بالكامل: لو الجهاز/المتصفح رفضه
        // (غير مدعوم، أو ما فيه إذن) نكمل عادي بدون ما نوقف شيء.
        try {
          await (screen.orientation as any)?.lock?.('landscape');
        } catch {
          // مو إجباري — ملء الشاشة نفسه يشتغل حتى لو رفض قفل الاتجاه.
        }
      } else {
        try {
          (screen.orientation as any)?.unlock?.();
        } catch {
          // تجاهل بصمت
        }
        await document.exitFullscreen?.();
      }
    } catch {
      // بعض المتصفحات/الأجهزة ما تدعم fullscreen API — نتجاهل بصمت.
    }
  };

  const handlePickPhoto = async () => {
    if (!isPhotoPickerAvailable() || uploadingPhoto) return;
    setUploadingPhoto(true);
    try {
      const picked = await pickPhotoDataUrl();
      if (picked) {
        send({ type: 'file-upload', name: picked.name, dataUrl: picked.dataUrl });
      }
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCastPress = async () => {
    setCastError(null);
    try {
      await requestCastSession();
    } catch {
      // الخطأ نفسه يوصل عبر subscribeCastSender ويظهر تحت شريط الأزرار.
    }
  };

  const moveTile = (index: number, dir: -1 | 1) => {
    setLayout(prev => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const toggleTile = (id: TileId) => {
    setLayout(prev => prev.map(t => (t.id === id ? { ...t, visible: !t.visible } : t)));
  };

  const send = (message: CastMessage) => sendCastMessage(message);

  // ==================== بوابة الماوس (gate: mouse) ====================
  const onMove = (dx: number, dy: number) => send({ type: 'pointer-move', dx, dy, source: 'mouse' });
  const onClick = () => {
    send({ type: 'pointer-click', source: 'mouse', buttonId: MOUSE_BUTTONS.left.buttonId });
    flash('كليك يسار');
  };
  const onRightClick = () => {
    send({ type: 'pointer-right-click', source: 'mouse', buttonId: MOUSE_BUTTONS.right.buttonId });
    flash('كليك يمين');
  };

  // ==================== بوابة الكيبورد (gate: keyboard) ====================
  const onText = (text: string) => {
    send({ type: 'key-text', text, source: 'keyboard' });
    flash(text === ' ' ? 'مسافة' : text);
  };
  const onBackspace = () => {
    const b = KEYBOARD_BUTTONS.backspace;
    send({ type: 'key', key: b.key, code: b.code, source: 'keyboard', buttonId: b.buttonId });
    flash('حذف');
  };
  const onEnter = () => {
    const b = KEYBOARD_BUTTONS.enter;
    send({ type: 'key', key: b.key, code: b.code, source: 'keyboard', buttonId: b.buttonId });
    flash('إدخال ⏎');
  };
  const onKey = (
    key: string,
    code: string,
    modifiers?: { ctrlKey?: boolean; altKey?: boolean; shiftKey?: boolean }
  ) => {
    send({ type: 'key', key, code, source: 'keyboard', ...modifiers });
    const prefix = [modifiers?.ctrlKey && 'Ctrl', modifiers?.altKey && 'Alt', modifiers?.shiftKey && 'Shift']
      .filter(Boolean)
      .join('+');
    flash(prefix ? `${prefix}+${key}` : key);
  };
  const onKeyboardKeyDown = (key: string, code: string) => {
    send({ type: 'key-down', key, code, source: 'keyboard' });
    flash(`${key} (مثبّت)`);
  };
  const onKeyboardKeyUp = (key: string, code: string) => send({ type: 'key-up', key, code, source: 'keyboard' });

  // ==================== بوابة يد التحكم (gate: gamepad) ====================
  // buttonId يوصل من GameController.tsx (يسحبه هو من controlKeys.ts) —
  // هذا اللي يخلي كل زر بيد التحكم له "مفتاحه" الثابت الخاص بمعزل عن
  // بوابتي الكيبورد والماوس.
  const onGamepadKeyDown = (key: string, code: string, buttonId?: string) => {
    send({ type: 'key-down', key, code, source: 'gamepad', buttonId });
    flash(`${key} (مثبّت)`);
  };
  const onGamepadKeyUp = (key: string, code: string, buttonId?: string) =>
    send({ type: 'key-up', key, code, source: 'gamepad', buttonId });

  // بملء الشاشة: نشيل كل شيء غير عناصر التحكم نفسها — شريط العنوان،
  // بطاقة حالة الاتصال، تنبيهات الخطأ، لوحة الإعدادات — يضل بس اللي
  // اخترته (يد تحكم / تاتش باد / كيبورد) يملا الشاشة بالكامل، بالضبط
  // زي ما طُلب: "شيل كل القوائم يخليه مال الشاشة اللي أنا مختاره فقط".
  // زر خروج صغير شبه-شفاف يطفو فوق عشان تقدر ترجع عادي.
  if (isFullscreen) {
    const visible = layout.filter(t => t.visible);
    const count = visible.length;
    return (
      <div ref={rootRef} dir="rtl" className="w-full h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
        {/* ملء الشاشة الحقيقي: ولا شي يظهر غير اللي اخترته — بدون نقطة
            اتصال، بدون تأكيد الضغطة، بدون أي نص. زر الخروج نفسه خافت
            جداً (شبه مخفي) — بس لمسة إصبعك بالزاوية تكفي ترجعك. */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-2 left-2 z-50 w-9 h-9 flex items-center justify-center text-white/15 active:text-white/60 transition-colors"
          title="خروج من ملء الشاشة"
        >
          <Minimize className="w-4 h-4" />
        </button>

        <div className={count >= 2 ? 'flex-1 p-2 flex gap-2 min-h-0' : 'flex-1 min-h-0'}>
          {visible.map(tile => {
            if (tile.id === 'touchpad') {
              return (
                <div key="touchpad" className={count >= 2 ? 'flex-[0.8] h-full min-w-0' : 'h-full w-full'}>
                  <Touchpad onMove={onMove} onClick={onClick} onRightClick={onRightClick} fillHeight />
                </div>
              );
            }
            if (tile.id === 'keyboard') {
              return (
                <div key="keyboard" className={count >= 2 ? 'flex-[1.2] h-full min-w-0 overflow-y-auto' : 'h-full w-full overflow-y-auto'}>
                  <VirtualKeyboard
                    onText={onText}
                    onBackspace={onBackspace}
                    onEnter={onEnter}
                    onKey={onKey}
                    onKeyDown={onKeyboardKeyDown}
                    onKeyUp={onKeyboardKeyUp}
                    big
                  />
                </div>
              );
            }
            return (
              <div key="gamepad" className={count >= 2 ? 'flex-1 h-full min-w-0' : 'h-full w-full'}>
                <GameController onKeyDown={onGamepadKeyDown} onKeyUp={onGamepadKeyUp} fillHeight />
              </div>
            );
          })}
          {count === 0 && (
            <div className="h-full w-full flex items-center justify-center text-white/30 text-sm">
              ما فيه أي عنصر تحكم مفعّل — اطلع من ملء الشاشة وفعّل واحد من الإعدادات
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} dir="rtl" className="w-full min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <h1 className="text-sm font-bold">لوحة التحكم</h1>

        <div className="flex items-center gap-2">
          {isPhotoPickerAvailable() && (
            <button
              onClick={handlePickPhoto}
              disabled={uploadingPhoto}
              className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center disabled:opacity-50"
              title="إرسال صورة من الجوال للتلفزيون"
            >
              {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center"
            title="ملء الشاشة"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowSettings(s => !s)}
            className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center"
            title="الإعدادات"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={handleCastPress}
            disabled={!available || connecting}
            className={`flex items-center gap-2 px-3.5 h-9 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
              connected ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {connected ? <Tv className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            <span>{connecting ? 'جارٍ فتح إعدادات Cast...' : connected ? 'متصل بالتلفزيون' : 'اختيار تلفزيون'}</span>
          </button>
        </div>
      </div>

      {/* تأكيد فوري: أي زر تضغطه (ماوس أو كيبورد) يطلع اسمه هنا تحت مباشرة */}
      <div className="h-8 flex items-center justify-center">
        {lastAction && (
          <div
            key={lastAction + Date.now()}
            dir="ltr"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/90 text-white text-xs font-mono font-bold shadow-lg animate-in fade-in zoom-in-95 duration-150"
          >
            {lastAction}
          </div>
        )}
      </div>

      <div className="mx-4 mt-3 p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
            connected
              ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-300'
              : 'bg-blue-950/40 border border-blue-800 text-blue-300'
          }`}
        >
          {connected ? <CheckCircle2 className="w-4 h-4" /> : <Wifi className="w-4 h-4 animate-pulse" />}
          <span>{connected ? `متصل الآن${displayName ? ' — ' + displayName : ''}` : 'ما فيه تلفزيون متصل بعد'}</span>
        </div>
        {!connected && (
          <div className="text-[11px] text-slate-500 leading-relaxed">
            اضغط "اختيار تلفزيون" فوق. راح تفتح شاشة إعدادات أندرويد نفسها
            (Cast) — اختر تلفزيونك منها، وارجع هنا: الاتصال يصير تلقائياً
            بمجرد ما تختار، بدون أي خطوة ثانية.
          </div>
        )}
      </div>

      {castError && (
        <div className="mx-4 mt-2 px-3 py-2 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">
          {castError}
        </div>
      )}

      {!available && (
        <div className="mx-4 mt-2 px-3 py-2 rounded-lg bg-amber-950/40 border border-amber-800 text-amber-200 text-[11px]">
          هذا الجهاز ما يدعم Cast (Wireless Display) — تأكد إنك فاتح التطبيق
          (APK) وليس متصفح عادي.
        </div>
      )}

      {/* Settings panel: add/remove/reorder tiles */}
      {showSettings && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-400 mb-1">ترتيب وإظهار عناصر التحكم</div>
          {layout.map((tile, i) => (
            <div
              key={tile.id}
              className="flex items-center justify-between gap-2 bg-slate-800/60 rounded-lg px-2.5 py-2"
            >
              <span className="text-xs">{TILE_LABELS[tile.id]}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleTile(tile.id)}
                  className="w-7 h-7 rounded-md bg-slate-700 hover:bg-slate-600 flex items-center justify-center"
                  title={tile.visible ? 'إخفاء' : 'إظهار'}
                >
                  {tile.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
                </button>
                <button
                  onClick={() => moveTile(i, -1)}
                  disabled={i === 0}
                  className="w-7 h-7 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-30 flex items-center justify-center"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => moveTile(i, 1)}
                  disabled={i === layout.length - 1}
                  className="w-7 h-7 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-30 flex items-center justify-center"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Control tiles — خارج ملء الشاشة بس، تمرير عمودي عادي */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {layout.filter(t => t.visible).map(tile => {
          if (tile.id === 'touchpad') {
            return <Touchpad key="touchpad" onMove={onMove} onClick={onClick} onRightClick={onRightClick} />;
          }
          if (tile.id === 'keyboard') {
            return (
              <VirtualKeyboard
                key="keyboard"
                onText={onText}
                onBackspace={onBackspace}
                onEnter={onEnter}
                onKey={onKey}
                onKeyDown={onKeyboardKeyDown}
                onKeyUp={onKeyboardKeyUp}
              />
            );
          }
          return (
            <div key="gamepad" className="bg-slate-900/60 rounded-xl p-4 border border-slate-800">
              <GameController onKeyDown={onGamepadKeyDown} onKeyUp={onGamepadKeyUp} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
