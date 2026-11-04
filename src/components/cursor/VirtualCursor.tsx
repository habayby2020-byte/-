import React from 'react';
import { useCursor } from '../../cast/CursorContext';

/**
 * The visible mouse pointer drawn on the TV screen, driven by the phone's
 * touchpad. Pure visual — the actual clicking/dragging is done by real
 * DOM mouse events dispatched in CursorContext, this is just "paint a
 * cursor where the real events are happening" so the person watching the
 * TV can see what's being pointed at.
 */
export const VirtualCursor: React.FC = () => {
  const { x, y, isDown } = useCursor();

  return (
    // بدون أي transition على transform: الموقع أصلاً متزامن مع
    // requestAnimationFrame من CursorContext، فإضافة تأخير 40ms هنا
    // فوق هذا كانت تضيف بطء إضافي محسوس وتجبر المتصفح يعيد الرسم مرتين.
    // ملاحظة أداء: ما فيه هنا أي filter:blur ولا backdrop-filter — بس
    // drop-shadow ثابت (رخيص، ما يتغيّر كل فريم) + scale بسيط عند
    // الضغط، عشان المؤشر نفسه ما يصير سبب تهنيق إضافي وهو يتحرك ٦٠
    // مرة بالثانية فوق الشاشة.
    <div
      className="fixed pointer-events-none z-[9999] will-change-transform"
      style={{ left: 0, top: 0, transform: `translate3d(${x - 3}px, ${y - 3}px, 0)` }}
    >
      <svg
        width="30"
        height="30"
        viewBox="0 0 30 30"
        className={`drop-shadow-[0_2px_4px_rgba(0,0,0,0.55)] transition-transform duration-75 ${
          isDown ? 'scale-[0.85]' : 'scale-100'
        }`}
      >
        {/* حلقة خارجية بلون العلامة — رفيعة، ثابتة الشفافية، بدون نبض/أنيميشن عشان ما تكلّف أي فريم إضافي */}
        <circle cx="15" cy="15" r="13" fill="none" stroke="var(--astra-accent)" strokeWidth="1.3" opacity="0.55" />
        {/* السهم الأساسي — شكل مائل مميّز غير سهم ويندوز/ماك الافتراضي */}
        <path
          d="M6 4 L6 22.5 L10.8 18.2 L14.2 25.5 L17.6 23.9 L14.2 16.8 L21 16.8 Z"
          fill="#0b0f1f"
          stroke="var(--astra-accent)"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* نقطة مركزية صغيرة تتلوّن عند الضغط — تأكيد بصري فوري للكليك */}
        <circle cx="15" cy="15" r="2.3" fill={isDown ? '#ffffff' : 'var(--astra-accent)'} />
      </svg>
    </div>
  );
};
