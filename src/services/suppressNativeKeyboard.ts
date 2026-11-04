import { useEffect } from 'react';

/**
 * يمنع ظهور كيبورد أندرويد الأصلي (لاحظنا تحديداً كيبورد سامسونج) فوق
 * شاشة التلفزيون. القصة: شاشة التلفزيون (#tv) ترتسم بواسطة WebView
 * ثاني يفتحه نفس تطبيق الأندرويد على "شاشة" Presentation منفصلة — لما
 * المؤشر البعيد (من الجوال) يضغط على حقل كتابة، المتصفح يسوي
 * .focus() حقيقي عليه، وأندرويد يفتح الكيبورد الخاص به فوق *شاشة
 * التلفزيون نفسها* (مو الجوال) — بينما التحكم كله فعلياً من كيبورد
 * التطبيق على الجوال (VirtualKeyboard/PcKeyboard يرسل أحرف عبر
 * cursor.typeText/sendKey إلى نفس العنصر المركّز). كيبورد أندرويد هذا
 * ما له أي فايدة هنا، ويحجب الواجهة ولا تقدر توصله من الجوال.
 *
 * الحل القياسي: `inputMode="none"` على كل عنصر قابل للكتابة — يخلي
 * العنصر يقدر ياخذ focus() ويستقبل كتابة برمجية (نفس اللي يحتاجه
 * typeText) بدون ما يستدعي أي لوحة مفاتيح نظام. نراقب الـ DOM
 * باستمرار (MutationObserver) عشان أي input/textarea يطلع لاحقاً
 * (داخل أي تطبيق يفتح) يتعالج تلقائياً بدون ما نعدّل كل مكوّن لحاله.
 */
function hardenElement(el: Element) {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    if (el.getAttribute('inputmode') !== 'none') {
      el.setAttribute('inputmode', 'none');
    }
    if (!el.hasAttribute('autocomplete')) {
      el.setAttribute('autocomplete', 'off');
    }
  }
  if ((el as HTMLElement).isContentEditable) {
    (el as HTMLElement).setAttribute('inputmode', 'none');
  }
}

export function useSuppressNativeKeyboard(active: boolean): void {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return;

    document.querySelectorAll('input, textarea, [contenteditable="true"]').forEach(hardenElement);

    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        m.addedNodes.forEach(node => {
          if (!(node instanceof Element)) return;
          hardenElement(node);
          node.querySelectorAll?.('input, textarea, [contenteditable="true"]').forEach(hardenElement);
        });
        if (m.type === 'attributes' && m.target instanceof Element) {
          hardenElement(m.target);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['contenteditable'],
    });

    return () => observer.disconnect();
  }, [active]);
}
