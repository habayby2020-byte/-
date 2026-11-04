/**
 * Receiver-side (TV) cursor. Turns incoming pointer/key messages from the
 * phone into a real, visible on-screen cursor AND real DOM events dispatched
 * at the cursor's position — so the existing window drag/resize/click logic
 * (which already listens for genuine mouse events) reacts exactly as if a
 * physical mouse were plugged into the TV. No duplicate "remote control"
 * code path to keep in sync with the real one.
 */

import React, { createContext, useContext, useRef, useState, ReactNode } from 'react';

export interface KeyModifiers {
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
}

export interface KeyFlash {
  label: string;
  id: number;
}

interface CursorContextType {
  x: number;
  y: number;
  isDown: boolean;
  /**
   * آخر حرف/مفتاح وصل فعلياً وانعرض على الشاشة — أي تطبيق (زي
   * KeyFeedbackOverlay) يقدر يعرضه كتوست صغير، عشان يصير واضح أي
   * ضغطة من كيبورد الجوال فعلاً وصلت ("اضغط R" مثلاً تقدر تتأكد إن R
   * وصلت فعلاً وليست حرف ثاني).
   */
  keyFlash: KeyFlash | null;
  moveBy: (dx: number, dy: number) => void;
  pointerDown: () => void;
  pointerUp: () => void;
  click: () => void;
  rightClick: () => void;
  typeText: (text: string) => void;
  sendKey: (key: string, code: string, modifiers?: KeyModifiers) => void;
  /**
   * ضغط/إفراج منفصلين — يسمح بتثبيت أكثر من مفتاح "مضغوط" بنفس
   * الوقت فعلياً (combo حقيقي زي "3+R")، عكس sendKey اللي يضغط ويفك
   * فوراً. شوف VirtualKeyboard.tsx (وضع "تثبيت المفاتيح").
   */
  keyDown: (key: string, code: string, modifiers?: KeyModifiers) => void;
  keyUp: (key: string, code: string) => void;
  scrollBy: (dy: number) => void;
}

const FRIENDLY_KEY_NAMES: Record<string, string> = {
  ' ': 'مسافة',
  Enter: 'Enter ↵',
  Backspace: 'Backspace ⌫',
  Tab: 'Tab ⇥',
  Escape: 'Esc',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
};

function friendlyKeyLabel(key: string, mods?: KeyModifiers): string {
  const base = FRIENDLY_KEY_NAMES[key] ?? (key.length === 1 ? key.toUpperCase() : key);
  const parts: string[] = [];
  if (mods?.ctrlKey) parts.push('Ctrl');
  if (mods?.altKey) parts.push('Alt');
  if (mods?.shiftKey) parts.push('Shift');
  parts.push(base);
  return parts.join(' + ');
}

const CursorContext = createContext<CursorContextType | null>(null);

/**
 * عنصر الكتابة/المفاتيح الحقيقي. لو المستخدم فاتح تطبيقه الخاص
 * (installed app بـ apps-inbox) فهذا يشتغل داخل <iframe> — لو وقفنا
 * عند document.activeElement العادي بس، أي مفتاح يترسل من الجوال
 * (كيبورد أو يد تحكم) يضرب عنصر الـ <iframe> نفسه ولا يوصل أبداً
 * لكود JS الحقيقي جوا تطبيق المستخدم. هذي الدالة "تنزل" خطوة بخطوة
 * داخل أي iframe مُركَّز عليه (بنفس الأصل) لحد ما توصل للعنصر
 * الحقيقي جوا تطبيق المستخدم، فيوصله الحدث فعلياً ويقدر يمسكه بـ
 * window.addEventListener('keydown', ...) عادي بكوده هو.
 */
function resolveKeyTarget(): HTMLElement {
  let active: Element | null = document.activeElement;
  while (active && active.tagName === 'IFRAME') {
    try {
      const frameDoc = (active as HTMLIFrameElement).contentDocument;
      if (!frameDoc) break;
      active = frameDoc.activeElement || frameDoc.body;
    } catch {
      // تطبيق من أصل (origin) مختلف — ما نقدر ندخل جواه لأسباب أمان
      // المتصفح، نوقف عند آخر عنصر وصلنا له بصمت.
      break;
    }
  }
  return (active as HTMLElement) || document.body;
}

function dispatchMouseEvent(type: string, x: number, y: number, button = 0) {
  const target = document.elementFromPoint(x, y) || document.body;
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: x,
    clientY: y,
    button,
    buttons: button === 2 ? 2 : 1,
  });
  target.dispatchEvent(event);
  return target;
}

export const CursorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [x, setX] = useState(() => window.innerWidth / 2);
  const [y, setY] = useState(() => window.innerHeight / 2);
  const [isDown, setIsDown] = useState(false);
  const [keyFlash, setKeyFlash] = useState<KeyFlash | null>(null);
  const flashIdRef = useRef(0);
  const flashKey = (label: string) => {
    flashIdRef.current += 1;
    setKeyFlash({ label, id: flashIdRef.current });
  };
  const posRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  // الجوال يرسل حركات المؤشر بمعدل أعلى بكثير من 60 فريم/ثانية (كل
  // بكسل فرق لمسة). قبل هذا التعديل كل رسالة وحدها كانت تسوي
  // document.elementFromPoint (يفرض إعادة حساب تخطيط/ستايل كاملة)
  // + dispatch حدث DOM حقيقي فوراً — يعني مئات العمليات الثقيلة
  // بالثانية، وهذا هو السبب الرئيسي لبطء الفريمات ("تحس إنك تلعب على
  // سلحفاة"). الحل: نجمع كل الحركات الواصلة بين فريم وفريم في
  // pendingRef، ونطبّقها مرة وحدة بس كل requestAnimationFrame — يعني
  // أقصى معدل معالجة فعلي = معدل تحديث الشاشة نفسها (٦٠ فريم تقريباً)
  // مهما كان معدل إرسال الجوال أعلى من هذا.
  const pendingRef = useRef<{ dx: number; dy: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  const flush = () => {
    rafRef.current = null;
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (!pending) return;
    const nx = Math.max(0, Math.min(window.innerWidth - 1, posRef.current.x + pending.dx));
    const ny = Math.max(0, Math.min(window.innerHeight - 1, posRef.current.y + pending.dy));
    posRef.current = { x: nx, y: ny };
    setX(nx);
    setY(ny);
    dispatchMouseEvent('mousemove', nx, ny);
  };

  const moveBy = (dx: number, dy: number) => {
    pendingRef.current = pendingRef.current
      ? { dx: pendingRef.current.dx + dx, dy: pendingRef.current.dy + dy }
      : { dx, dy };
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(flush);
    }
  };

  // يطبّق أي حركة مؤشر متجمّعة لسه ما وصلت الشاشة قبل أي ضغطة — عشان
  // الكليك/السحب يصير بالضبط على آخر مكان أشّر له الجوال، مو مكان
  // قديم بفريم أو فريمين.
  const flushPending = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      flush();
    }
  };

  const pointerDown = () => {
    flushPending();
    setIsDown(true);
    dispatchMouseEvent('mousedown', posRef.current.x, posRef.current.y);
  };

  const pointerUp = () => {
    flushPending();
    setIsDown(false);
    dispatchMouseEvent('mouseup', posRef.current.x, posRef.current.y);
  };

  const click = () => {
    flushPending();
    const { x: cx, y: cy } = posRef.current;
    dispatchMouseEvent('mousedown', cx, cy);
    dispatchMouseEvent('mouseup', cx, cy);
    dispatchMouseEvent('click', cx, cy);
  };

  const rightClick = () => {
    flushPending();
    const { x: cx, y: cy } = posRef.current;
    dispatchMouseEvent('mousedown', cx, cy, 2);
    dispatchMouseEvent('mouseup', cx, cy, 2);
    dispatchMouseEvent('contextmenu', cx, cy, 2);
  };

  const typeText = (text: string) => {
    const el = resolveKeyTarget() as HTMLInputElement | HTMLTextAreaElement | null;
    if (!el) {
      flashKey(text);
      return;
    }
    const isEditable =
      el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as any).isContentEditable;
    if (!isEditable) {
      flashKey(text);
      return;
    }
    flashKey(text);

    if ((el as any).isContentEditable) {
      document.execCommand('insertText', false, text);
      return;
    }
    const input = el as HTMLInputElement | HTMLTextAreaElement;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const newValue = input.value.slice(0, start) + text + input.value.slice(end);
    const setter = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(input),
      'value'
    )?.set;
    setter?.call(input, newValue);
    const caret = start + text.length;
    input.setSelectionRange(caret, caret);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };

  const sendKey = (key: string, code: string, modifiers?: KeyModifiers) => {
    flashKey(friendlyKeyLabel(key, modifiers));
    const el = resolveKeyTarget();
    const opts = {
      key,
      code,
      bubbles: true,
      cancelable: true,
      ctrlKey: !!modifiers?.ctrlKey,
      altKey: !!modifiers?.altKey,
      shiftKey: !!modifiers?.shiftKey,
    };
    el.dispatchEvent(new KeyboardEvent('keydown', opts));
    if (key === 'Backspace' && (el as any).value !== undefined) {
      const input = el as HTMLInputElement | HTMLTextAreaElement;
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      if (start === end && start > 0) {
        const newValue = input.value.slice(0, start - 1) + input.value.slice(end);
        const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value')?.set;
        setter?.call(input, newValue);
        input.setSelectionRange(start - 1, start - 1);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    el.dispatchEvent(new KeyboardEvent('keyup', opts));
  };

  const keyDown = (key: string, code: string, modifiers?: KeyModifiers) => {
    flashKey(`${friendlyKeyLabel(key, modifiers)} ⬇`);
    const el = resolveKeyTarget();
    el.dispatchEvent(
      new KeyboardEvent('keydown', {
        key,
        code,
        bubbles: true,
        cancelable: true,
        ctrlKey: !!modifiers?.ctrlKey,
        altKey: !!modifiers?.altKey,
        shiftKey: !!modifiers?.shiftKey,
        repeat: false,
      })
    );
  };

  const keyUp = (key: string, code: string) => {
    flashKey(`${friendlyKeyLabel(key)} ⬆`);
    const el = resolveKeyTarget();
    el.dispatchEvent(new KeyboardEvent('keyup', { key, code, bubbles: true, cancelable: true }));
  };

  const scrollBy = (dy: number) => {
    const el = document.elementFromPoint(posRef.current.x, posRef.current.y);
    el?.scrollBy?.({ top: dy, behavior: 'auto' });
  };

  return (
    <CursorContext.Provider
      value={{ x, y, isDown, keyFlash, moveBy, pointerDown, pointerUp, click, rightClick, typeText, sendKey, keyDown, keyUp, scrollBy }}
    >
      {children}
    </CursorContext.Provider>
  );
};

export const useCursor = () => {
  const ctx = useContext(CursorContext);
  if (!ctx) throw new Error('useCursor must be used within CursorProvider');
  return ctx;
};
