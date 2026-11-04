/**
 * بروتوكول رسائل التحكم بين الجوال والتلفاز. مستقل عن طبقة النقل —
 * اللي هي الآن حقن JS مباشر عبر MiracastPresentationPlugin.java (شوف
 * android-presentation-bridge/README.md)، بدون أي شبكة أو سيرفر.
 *
 * كل رسالة تحمل source: مفتاح البوابة (أي نوع تحكم أرسلها — كيبورد/
 * ماوس/يد تحكم، شوف controlKeys.ts) + buttonId اختياري (مفتاح الزر
 * الثابت لو الرسالة جاية من زر محدد). التلفزيون يستقبلهم كما هم —
 * ما يغيّر سلوكه الحالي، بس يصيرون متاحين لأي منطق مستقبلي يحتاج
 * يميّز مصدر الضغطة (مثلاً ربط لعبة معينة ببوابة/زر محدد).
 */
import { ControlGate } from './controlKeys';

export type CastMessage =
  | { type: 'pointer-move'; dx: number; dy: number; source: ControlGate }
  | { type: 'pointer-down'; source: ControlGate }
  | { type: 'pointer-up'; source: ControlGate }
  | { type: 'pointer-click'; source: ControlGate; buttonId?: string }
  | { type: 'pointer-right-click'; source: ControlGate; buttonId?: string }
  | {
      type: 'key';
      key: string;
      code: string;
      source: ControlGate;
      buttonId?: string;
      ctrlKey?: boolean;
      altKey?: boolean;
      shiftKey?: boolean;
    }
  // key-down/key-up منفصلين (بدون إفراج تلقائي) — يخليان تطبيقاتك
  // (زي اللي تطلب "اضغط 3+R" بنفس اللحظة) تشوف المفتاحين "مضغوطين"
  // معاً فعلياً، شيء ما يقدر عليه 'key' العادي لأنه يضغط ويفك فوراً.
  | { type: 'key-down'; key: string; code: string; source: ControlGate; buttonId?: string; ctrlKey?: boolean; altKey?: boolean; shiftKey?: boolean }
  | { type: 'key-up'; key: string; code: string; source: ControlGate; buttonId?: string }
  | { type: 'key-text'; text: string; source: ControlGate }
  | { type: 'scroll'; dy: number; source: ControlGate }
  // صورة مرفوعة من معرض/كاميرا الجوال — نفس القناة بالضبط (حقن JS عبر
  // MiracastPresentationPlugin.java)، بدون أي اتصال شبكة جديد.
  | { type: 'file-upload'; name: string; dataUrl: string };
