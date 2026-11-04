import React, { useEffect, useState } from 'react';
import { Keyboard } from 'lucide-react';
import { useCursor } from '../../cast/CursorContext';

/**
 * طلب المستخدم صراحة: أي حرف/مفتاح يوصل من كيبورد الجوال ويترسل
 * للشاشة لازم يكون له "شيء يظهر" — عشان تتأكد بعينك أي ضغطة وصلت
 * فعلاً ولأي حرف بالضبط (مهم جداً لو تطبيق يطلب ضغط اختصار معين، مثلاً
 * "اضغط R" أو "Ctrl+X"). كل ضغطة تطلع كبطاقة صغيرة أسفل الشاشة
 * لحظياً وتختفي من نفسها — نستخدم `key={keyFlash.id}` عشان الأنيميشن
 * يعيد نفسه مع كل ضغطة حتى لو كرّرت نفس الحرف.
 */
export const KeyFeedbackOverlay: React.FC = () => {
  const { keyFlash } = useCursor();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!keyFlash) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 1100);
    return () => clearTimeout(t);
  }, [keyFlash]);

  if (!keyFlash || !visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-[9998] flex justify-center pointer-events-none">
      <div
        key={keyFlash.id}
        dir="ltr"
        className="astra-glass astra-fade-up flex items-center gap-2 px-4 py-2 rounded-full text-white font-mono font-bold text-sm astra-shadow"
        style={{ animationDuration: '120ms' }}
      >
        <Keyboard className="w-4 h-4 text-[var(--astra-accent)]" />
        <span>{keyFlash.label}</span>
      </div>
    </div>
  );
};
