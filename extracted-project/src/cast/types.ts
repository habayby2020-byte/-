/**
 * بروتوكول رسائل التحكم بين الجوال والتلفاز. مستقل عن طبقة النقل —
 * اللي هي الآن حقن JS مباشر عبر MiracastPresentationPlugin.java (شوف
 * android-presentation-bridge/README.md)، بدون أي شبكة أو سيرفر.
 */
export type CastMessage =
  | { type: 'pointer-move'; dx: number; dy: number }
  | { type: 'pointer-down' }
  | { type: 'pointer-up' }
  | { type: 'pointer-click' }
  | { type: 'pointer-right-click' }
  | {
      type: 'key';
      key: string;
      code: string;
      ctrlKey?: boolean;
      altKey?: boolean;
      shiftKey?: boolean;
    }
  // key-down/key-up منفصلين (بدون إفراج تلقائي) — يخليان تطبيقاتك
  // (زي اللي تطلب "اضغط 3+R" بنفس اللحظة) تشوف المفتاحين "مضغوطين"
  // معاً فعلياً، شيء ما يقدر عليه 'key' العادي لأنه يضغط ويفك فوراً.
  | { type: 'key-down'; key: string; code: string; ctrlKey?: boolean; altKey?: boolean; shiftKey?: boolean }
  | { type: 'key-up'; key: string; code: string }
  | { type: 'key-text'; text: string }
  | { type: 'scroll'; dy: number }
  // صورة مرفوعة من معرض/كاميرا الجوال — نفس القناة بالضبط (حقن JS عبر
  // MiracastPresentationPlugin.java)، بدون أي اتصال شبكة جديد.
  | { type: 'file-upload'; name: string; dataUrl: string };
