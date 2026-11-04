import React, { useState } from 'react';
import { Globe, Delete, CornerDownLeft, ArrowUp, ArrowLeft, ArrowRight, ArrowDown, Space, Pin, PinOff } from 'lucide-react';

function codeForChar(ch: string): string {
  if (/^[a-z]$/i.test(ch)) return `Key${ch.toUpperCase()}`;
  if (/^[0-9]$/.test(ch)) return `Digit${ch}`;
  return ch;
}

const ROWS_EN = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

const ROWS_AR = [
  ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج'],
  ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك'],
  ['ظ', 'ط', 'ذ', 'د', 'ز', 'ر', 'و', 'ة', 'ى'],
];

const NUMBER_ROW = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

interface VirtualKeyboardProps {
  onText: (text: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  /** زر "ملء الشاشة" في ControllerApp يكبّر الأزرار عبر هذا. */
  big?: boolean;
  /** مفتاح/اختصار حقيقي (Tab, Esc, الأسهم، Ctrl/Alt+حرف) — يُرسل كـ KeyboardEvent حقيقي على التلفزيون. */
  onKey: (key: string, code: string, modifiers?: { ctrlKey?: boolean; altKey?: boolean; shiftKey?: boolean }) => void;
  /**
   * ضغط/إفراج منفصلين لوضع "تثبيت المفاتيح" — يخلي أكثر من مفتاح
   * عادي (بدون Ctrl/Alt) "مضغوط" بنفس اللحظة فعلياً، عشان كومبو زي
   * "3+R" يشتغل بتطبيقك لو كان يتوقع المفتاحين نازلين سوا — شيء
   * onKey العادي ما يقدر عليه لأنه يضغط ويفك فوراً.
   */
  onKeyDown: (key: string, code: string) => void;
  onKeyUp: (key: string, code: string) => void;
}

/**
 * كيبورد PC حقيقي (مو لوحة أحرف مبسّطة): صف أرقام، صف أحرف، Tab/Esc،
 * أسهم اتجاهات، وCtrl/Alt قابلين للتفعيل كـ"مفاتيح لاصقة" — تفعّل
 * Ctrl ثم تضغط C فيترسل Ctrl+C كاختصار حقيقي (KeyboardEvent فيه
 * ctrlKey=true)، مو كأنه نص "c" عادي. هذا يخلي اختصارات حقيقية زي
 * القص/اللصق/التراجع تشتغل، ويحل مشكلة "اضغط R" أو أي اختصار يطلبه
 * تطبيق — كل ضغطة توصل فوراً وتنعرض على شاشة التلفزيون (انظر
 * KeyFeedbackOverlay) عشان تتأكد وصلت صح.
 */
export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ onText, onBackspace, onEnter, onKey, onKeyDown, onKeyUp, big }) => {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [shift, setShift] = useState(false);
  const [ctrlActive, setCtrlActive] = useState(false);
  const [altActive, setAltActive] = useState(false);
  const [holdMode, setHoldMode] = useState(false);
  const [heldKeys, setHeldKeys] = useState<Record<string, string>>({}); // key -> code
  const rows = lang === 'ar' ? ROWS_AR : ROWS_EN;

  const keyH = big ? 'h-13' : 'h-10';
  const keyText = big ? 'text-base' : 'text-sm';

  const releaseAll = () => {
    Object.entries(heldKeys).forEach(([key, code]) => onKeyUp(key, code));
    setHeldKeys({});
  };

  const pressKey = (ch: string) => {
    // وضع تثبيت المفاتيح: تاب أول مرة = ضغط ويضل نازل، تاب ثانية =
    // إفراج — يسمح بتثبيت أكثر من مفتاح بنفس الوقت (combo حقيقي).
    if (holdMode) {
      const label = shift ? ch.toUpperCase() : ch;
      const code = codeForChar(ch);
      setHeldKeys(prev => {
        if (prev[label] !== undefined) {
          onKeyUp(label, code);
          const next = { ...prev };
          delete next[label];
          return next;
        }
        onKeyDown(label, code);
        return { ...prev, [label]: code };
      });
      return;
    }
    if (ctrlActive || altActive) {
      const code = codeForChar(ch);
      onKey(ch, code, { ctrlKey: ctrlActive, altKey: altActive, shiftKey: shift });
      setCtrlActive(false);
      setAltActive(false);
      setShift(false);
      return;
    }
    onText(shift ? ch.toUpperCase() : ch);
    if (shift) setShift(false);
  };

  const pressArrow = (key: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight') => onKey(key, key);

  return (
    <div className="w-full select-none bg-slate-900/95 rounded-xl p-2 space-y-1.5 border border-slate-700">
      {/* صف الأرقام */}
      <div className="flex justify-center gap-1">
        {NUMBER_ROW.map(n => (
          <button
            key={n}
            onClick={() => pressKey(n)}
            className={`flex-1 max-w-10 ${keyH} rounded-lg text-white ${keyText} font-medium transition-colors ${
              heldKeys[n] !== undefined
                ? 'bg-emerald-600 ring-2 ring-emerald-300'
                : 'bg-slate-700 hover:bg-slate-600 active:bg-blue-600'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      {rows.map((row, i) => (
        <div key={i} className="flex justify-center gap-1">
          {i === 0 && (
            <button
              onClick={() => onKey('Tab', 'Tab')}
              className={`w-12 ${keyH} rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold transition-colors`}
            >
              Tab
            </button>
          )}
          {row.map(ch => {
            const label = shift ? ch.toUpperCase() : ch;
            const isHeld = heldKeys[label] !== undefined;
            return (
              <button
                key={ch}
                onClick={() => pressKey(ch)}
                className={`flex-1 max-w-10 ${keyH} rounded-lg text-white ${keyText} font-medium transition-colors ${
                  isHeld
                    ? 'bg-emerald-600 ring-2 ring-emerald-300'
                    : ctrlActive || altActive
                    ? 'bg-amber-700 hover:bg-amber-600'
                    : 'bg-slate-700 hover:bg-slate-600 active:bg-blue-600'
                }`}
              >
                {label}
              </button>
            );
          })}
          {i === 0 && (
            <button
              onClick={() => onKey('Escape', 'Escape')}
              className={`w-12 ${keyH} rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold transition-colors`}
            >
              Esc
            </button>
          )}
        </div>
      ))}

      {/* Ctrl / Alt كمفاتيح لاصقة + Shift + تبديل لغة */}
      <div className="flex justify-center gap-1">
        <button
          onClick={() => setCtrlActive(v => !v)}
          className={`flex-1 max-w-16 h-9 rounded-lg text-[11px] font-bold transition-colors ${
            ctrlActive ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 hover:bg-slate-600 text-white'
          }`}
        >
          Ctrl
        </button>
        <button
          onClick={() => setAltActive(v => !v)}
          className={`flex-1 max-w-16 h-9 rounded-lg text-[11px] font-bold transition-colors ${
            altActive ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 hover:bg-slate-600 text-white'
          }`}
        >
          Alt
        </button>
        <button
          onClick={() => setShift(s => !s)}
          className={`flex-1 max-w-16 h-9 rounded-lg flex items-center justify-center transition-colors ${
            shift ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'
          }`}
          title="Shift"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => setLang(l => (l === 'ar' ? 'en' : 'ar'))}
          className="flex-1 max-w-16 h-9 rounded-lg bg-slate-700 hover:bg-slate-600 active:bg-blue-600 text-white text-xs font-semibold flex items-center justify-center gap-1"
          title="تغيير لغة الكيبورد"
        >
          <Globe className="w-3.5 h-3.5" />
          {lang === 'ar' ? 'EN' : 'AR'}
        </button>
      </div>

      {/* وضع تثبيت المفاتيح — لإرسال كومبو حقيقي زي "3+R" يضغطان معاً */}
      <div className="flex justify-center items-center gap-2 pt-0.5">
        <button
          onClick={() => {
            if (holdMode) releaseAll();
            setHoldMode(v => !v);
          }}
          className={`flex-1 h-8 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors ${
            holdMode ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white/70'
          }`}
          title="وضع تثبيت المفاتيح: اضغط مفتاحين أو أكثر ليضلّوا نازلين معاً (كومبو حقيقي)"
        >
          {holdMode ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
          <span>{holdMode ? 'وضع التثبيت فعّال (اضغط مفتاحين سوا)' : 'تفعيل وضع تثبيت المفاتيح'}</span>
        </button>
        {Object.keys(heldKeys).length > 0 && (
          <button
            onClick={releaseAll}
            className="h-8 px-3 rounded-lg bg-rose-700 hover:bg-rose-600 text-white text-[11px] font-bold"
          >
            تحرير الكل
          </button>
        )}
      </div>

      {/* مسافة + حذف + أسهم + إدخال */}
      <div className="flex justify-center gap-1 pt-1">
        <button
          onClick={() => onText(' ')}
          className={`flex-[2] ${keyH} rounded-lg bg-slate-700 hover:bg-slate-600 active:bg-blue-600 text-white flex items-center justify-center`}
        >
          <Space className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-3 gap-0.5 w-24">
          <div />
          <button onClick={() => pressArrow('ArrowUp')} className={`h-5 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center`}>
            <ArrowUp className="w-3 h-3 text-white" />
          </button>
          <div />
          <button onClick={() => pressArrow('ArrowLeft')} className={`h-5 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center`}>
            <ArrowLeft className="w-3 h-3 text-white" />
          </button>
          <button onClick={() => pressArrow('ArrowDown')} className={`h-5 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center`}>
            <ArrowDown className="w-3 h-3 text-white" />
          </button>
          <button onClick={() => pressArrow('ArrowRight')} className={`h-5 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center`}>
            <ArrowRight className="w-3 h-3 text-white" />
          </button>
        </div>

        <button
          onClick={onBackspace}
          className={`w-14 ${keyH} rounded-lg bg-slate-700 hover:bg-slate-600 active:bg-rose-600 text-white flex items-center justify-center`}
          title="حذف"
        >
          <Delete className="w-4 h-4" />
        </button>

        <button
          onClick={onEnter}
          className={`w-14 ${keyH} rounded-lg bg-slate-700 hover:bg-slate-600 active:bg-emerald-600 text-white flex items-center justify-center`}
          title="إدخال"
        >
          <CornerDownLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
