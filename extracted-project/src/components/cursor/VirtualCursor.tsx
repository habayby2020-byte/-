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
    <div
      className="fixed pointer-events-none z-[9999] will-change-transform"
      style={{ left: 0, top: 0, transform: `translate3d(${x}px, ${y}px, 0)` }}
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 26 26"
        className={`drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] transition-transform ${
          isDown ? 'scale-90' : 'scale-100'
        }`}
      >
        <path
          d="M2 2 L2 20 L7.5 15.5 L11 23 L14 21.5 L10.5 14 L18 14 Z"
          fill="white"
          stroke="black"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
