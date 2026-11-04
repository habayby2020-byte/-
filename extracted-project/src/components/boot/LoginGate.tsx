import React, { useState } from 'react';
import { Hexagon, Delete, ArrowRight, RotateCcw, User } from 'lucide-react';
import { getSavedAccount, saveAccount, clearAccount } from '../../services/auth';

interface Props {
  onSuccess: () => void;
}

const PAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

const Dots: React.FC<{ length: number; filled: number }> = ({ length, filled }) => (
  <div className="flex items-center gap-3 justify-center" dir="ltr">
    {Array.from({ length }).map((_, i) => (
      <div
        key={i}
        className={`w-3.5 h-3.5 rounded-full border transition-all ${
          i < filled ? 'bg-[var(--astra-accent)] border-[var(--astra-accent)] shadow-[0_0_10px_var(--astra-accent)]' : 'border-white/25'
        }`}
      />
    ))}
  </div>
);

const NumPad: React.FC<{ onDigit: (d: string) => void; onBackspace: () => void }> = ({ onDigit, onBackspace }) => (
  <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mx-auto">
    {PAD_KEYS.map((k, i) =>
      k === '' ? (
        <div key={i} />
      ) : k === 'back' ? (
        <button
          key={i}
          onClick={onBackspace}
          className="h-14 rounded-2xl astra-glass flex items-center justify-center text-white/80 hover:text-white hover:border-[var(--astra-accent)]/50 transition-colors cursor-pointer"
        >
          <Delete className="w-5 h-5" />
        </button>
      ) : (
        <button
          key={i}
          onClick={() => onDigit(k)}
          className="h-14 rounded-2xl astra-glass flex items-center justify-center text-xl font-bold text-white hover:border-[var(--astra-accent)]/50 hover:bg-white/10 transition-colors cursor-pointer"
        >
          {k}
        </button>
      )
    )}
  </div>
);

const PIN_LEN = 4;

export const LoginGate: React.FC<Props> = ({ onSuccess }) => {
  const saved = getSavedAccount();

  const [step, setStep] = useState<'name' | 'set-pin' | 'confirm-pin' | 'unlock'>(saved ? 'unlock' : 'name');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const pushDigit = (d: string) => {
    setError(null);
    setPin(prev => (prev.length >= PIN_LEN ? prev : prev + d));
  };
  const backspace = () => setPin(prev => prev.slice(0, -1));

  React.useEffect(() => {
    if (pin.length !== PIN_LEN) return;

    if (step === 'set-pin') {
      setFirstPin(pin);
      setPin('');
      setStep('confirm-pin');
      return;
    }
    if (step === 'confirm-pin') {
      if (pin === firstPin) {
        saveAccount({ name: name.trim() || 'المستخدم', pin });
        onSuccess();
      } else {
        setError('الرمزان غير متطابقين — حاول من جديد.');
        setPin('');
        setFirstPin('');
        setStep('set-pin');
      }
      return;
    }
    if (step === 'unlock') {
      if (saved && pin === saved.pin) {
        onSuccess();
      } else {
        setError('رمز غير صحيح.');
        setPin('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const handleResetAccount = () => {
    clearAccount();
    setPin('');
    setFirstPin('');
    setError(null);
    setStep('name');
  };

  return (
    <div dir="rtl" className="fixed inset-0 z-[500] astra-bg flex flex-col items-center justify-center gap-7 px-6 text-white">
      <div className="flex flex-col items-center gap-3 astra-fade-up">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 astra-ring astra-hex opacity-70" />
          <div className="absolute inset-[3px] astra-hex bg-[#04050c] flex items-center justify-center">
            <Hexagon className="w-7 h-7 text-[var(--astra-accent)]" strokeWidth={2.4} />
          </div>
        </div>
        <div className="text-xs tracking-[0.35em] text-white/50 font-semibold">ASTRA</div>
      </div>

      {step === 'name' && (
        <div className="flex flex-col items-center gap-4 w-full max-w-xs astra-fade-up">
          <div className="text-center space-y-1">
            <h1 className="text-lg font-bold">مستخدم جديد</h1>
            <p className="text-xs text-white/50">اكتب اسمك، ثم حط رمز سري من {PIN_LEN} أرقام تحفظه لنفسك.</p>
          </div>
          <div className="relative w-full">
            <User className="w-4 h-4 text-white/40 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="اسمك"
              autoFocus
              className="w-full astra-glass rounded-xl pr-9 pl-3 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[var(--astra-accent)]/60"
            />
          </div>
          <button
            onClick={() => name.trim() && setStep('set-pin')}
            disabled={!name.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-l from-[var(--astra-accent)] to-[var(--astra-accent-2)] text-slate-950 font-bold text-sm disabled:opacity-40 cursor-pointer"
          >
            <span>متابعة</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {(step === 'set-pin' || step === 'confirm-pin' || step === 'unlock') && (
        <div className="flex flex-col items-center gap-5 astra-fade-up">
          <div className="text-center space-y-1">
            <h1 className="text-lg font-bold">
              {step === 'set-pin' && 'اختر رمزك السري'}
              {step === 'confirm-pin' && 'أكّد الرمز مرة ثانية'}
              {step === 'unlock' && `مرحباً ${saved?.name ?? ''}`}
            </h1>
            <p className="text-xs text-white/50">
              {step === 'unlock' ? 'أدخل رمزك السري للدخول' : `${PIN_LEN} أرقام`}
            </p>
          </div>
          <Dots length={PIN_LEN} filled={pin.length} />
          {error && <div className="text-rose-400 text-xs font-semibold">{error}</div>}
          <NumPad onDigit={pushDigit} onBackspace={backspace} />
          {step === 'unlock' && (
            <button
              onClick={handleResetAccount}
              className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70 cursor-pointer mt-1"
            >
              <RotateCcw className="w-3 h-3" />
              نسيت الرمز؟ إعادة الضبط من جديد
            </button>
          )}
        </div>
      )}
    </div>
  );
};
