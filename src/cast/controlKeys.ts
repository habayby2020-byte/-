/**
 * ===================== ملف الربط المركزي (عدّل هنا بس) =====================
 *
 * هذا الملف هو "مفتاح الباب" (gate key) لكل نوع تحكم + "مفتاح" مستقل
 * لكل زر جواه. أي رسالة طالعة من الجوال (كيبورد/ماوس/يد تحكم) تحمل:
 *
 *   1) source  — مفتاح البوابة نفسها: 'keyboard' | 'mouse' | 'gamepad'.
 *                يوصل التلفزيون يعرف فوراً أي نوع تحكم أرسل الرسالة،
 *                بغض النظر شنو المفتاح الفعلي جواها.
 *
 *   2) buttonId — مفتاح ثابت لكل زر لحاله (مثلاً 'gamepad.action.top')،
 *                ما يتغيّر حتى لو بدّلت المفتاح الفعلي (key/code) تحته.
 *                يعني تقدر تربط لعبتك بـ buttonId الثابت بدل القيمة
 *                المتغيّرة، وأي تعديل مستقبلي على المفتاح الفعلي ما
 *                يكسر الربط.
 *
 * لو تبي تربط لعبة أو تطبيق جديد: بدّل قيم key/code تحت بس — بدون ما
 * تلمس GameController.tsx ولا VirtualKeyboard.tsx ولا Touchpad.tsx
 * ولا ControllerApp.tsx إطلاقاً. الأربعة كلهم يسحبون من هنا تلقائياً.
 * ============================================================================
 */

/** مفاتيح البوابات الثلاث — كل تحكم له بوابته الخاصة. */
export type ControlGate = 'keyboard' | 'mouse' | 'gamepad';

export const GATE_KEYS: Record<ControlGate, string> = {
  keyboard: 'gate.keyboard',
  mouse: 'gate.mouse',
  gamepad: 'gate.gamepad',
};

export interface KeyBinding {
  /** مفتاح الزر الثابت — هذا اللي تربط عليه، لا يتغيّر. */
  buttonId: string;
  /** القيمتين الفعليتين المُرسلتين كضغطة كيبورد حقيقية على التلفزيون. */
  key: string;
  code: string;
}

/** بوابة الماوس — زرّين بس، مفتاح ثابت لكل وحد. */
export const MOUSE_BUTTONS = {
  left: { buttonId: 'mouse.left' },
  right: { buttonId: 'mouse.right' },
} as const;

/** بوابة الكيبورد — المفاتيح الخاصة (مو الحروف العادية، تلك تتولّد
 * تلقائياً من نفس الحرف). بدّل key/code لو تبي سلوك مختلف. */
export const KEYBOARD_BUTTONS: Record<string, KeyBinding> = {
  enter: { buttonId: 'keyboard.enter', key: 'Enter', code: 'Enter' },
  backspace: { buttonId: 'keyboard.backspace', key: 'Backspace', code: 'Backspace' },
  tab: { buttonId: 'keyboard.tab', key: 'Tab', code: 'Tab' },
  escape: { buttonId: 'keyboard.escape', key: 'Escape', code: 'Escape' },
  arrowUp: { buttonId: 'keyboard.arrow.up', key: 'ArrowUp', code: 'ArrowUp' },
  arrowDown: { buttonId: 'keyboard.arrow.down', key: 'ArrowDown', code: 'ArrowDown' },
  arrowLeft: { buttonId: 'keyboard.arrow.left', key: 'ArrowLeft', code: 'ArrowLeft' },
  arrowRight: { buttonId: 'keyboard.arrow.right', key: 'ArrowRight', code: 'ArrowRight' },
};

/** بوابة يد التحكم — D-pad: اتجاه = مفتاح وحد أو مفتاحين سوا (قطري). */
export const DPAD_BUTTONS: Record<
  'up' | 'down' | 'left' | 'right' | 'up-right' | 'up-left' | 'down-right' | 'down-left',
  { buttonId: string; keys: { key: string; code: string }[] }
> = {
  up: { buttonId: 'gamepad.dpad.up', keys: [{ key: 'ArrowUp', code: 'ArrowUp' }] },
  down: { buttonId: 'gamepad.dpad.down', keys: [{ key: 'ArrowDown', code: 'ArrowDown' }] },
  left: { buttonId: 'gamepad.dpad.left', keys: [{ key: 'ArrowLeft', code: 'ArrowLeft' }] },
  right: { buttonId: 'gamepad.dpad.right', keys: [{ key: 'ArrowRight', code: 'ArrowRight' }] },
  'up-right': { buttonId: 'gamepad.dpad.up-right', keys: [{ key: 'ArrowUp', code: 'ArrowUp' }, { key: 'ArrowRight', code: 'ArrowRight' }] },
  'up-left': { buttonId: 'gamepad.dpad.up-left', keys: [{ key: 'ArrowUp', code: 'ArrowUp' }, { key: 'ArrowLeft', code: 'ArrowLeft' }] },
  'down-right': { buttonId: 'gamepad.dpad.down-right', keys: [{ key: 'ArrowDown', code: 'ArrowDown' }, { key: 'ArrowRight', code: 'ArrowRight' }] },
  'down-left': { buttonId: 'gamepad.dpad.down-left', keys: [{ key: 'ArrowDown', code: 'ArrowDown' }, { key: 'ArrowLeft', code: 'ArrowLeft' }] },
};

/** بوابة يد التحكم — أزرار الحركة الأربعة (ترتيب ماسي: فوق/يمين/تحت/يسار). */
export const GAMEPAD_ACTION_BUTTONS: (KeyBinding & { pos: 'top' | 'right' | 'bottom' | 'left'; color: string })[] = [
  { buttonId: 'gamepad.action.top', key: 'Enter', code: 'Enter', pos: 'top', color: 'text-emerald-400' },
  { buttonId: 'gamepad.action.right', key: 'Control', code: 'ControlLeft', pos: 'right', color: 'text-blue-400' },
  { buttonId: 'gamepad.action.left', key: 'Shift', code: 'ShiftLeft', pos: 'left', color: 'text-pink-400' },
  { buttonId: 'gamepad.action.bottom', key: ' ', code: 'Space', pos: 'bottom', color: 'text-amber-400' },
];

/** بوابة يد التحكم — صف الكتف فوق: L1/R1 (زر) + L2/R2 (زناد) —
 * نفس مكان الكتف بيد تحكم حقيقية بالضبط، بس بأسماء مختلفة. */
export const GAMEPAD_SHOULDER_BUTTONS: (KeyBinding & { label: string })[] = [
  { buttonId: 'gamepad.shoulder.l1', label: 'L1', key: 'q', code: 'KeyQ' },
  { buttonId: 'gamepad.shoulder.r1', label: 'R1', key: 'e', code: 'KeyE' },
];

export const GAMEPAD_TRIGGER_BUTTONS: (KeyBinding & { label: string })[] = [
  { buttonId: 'gamepad.trigger.l2', label: 'L2', key: 'z', code: 'KeyZ' },
  { buttonId: 'gamepad.trigger.r2', label: 'R2', key: 'c', code: 'KeyC' },
];

/** عصا تحكم ثانية (يمين) — زي عصا الكاميرا/النظر بيد تحكم حقيقية.
 * نفس فكرة D-pad تماماً (دائري، إصبع واحد، 8 اتجاهات) بس بمفاتيح
 * افتراضية WASD بدل الأسهم عشان تقدر تفرّق بينها وبين العصا اليسار
 * (D-pad) داخل لعبتك بسهولة. */
export const STICK2_BUTTONS: Record<
  'up' | 'down' | 'left' | 'right' | 'up-right' | 'up-left' | 'down-right' | 'down-left',
  { buttonId: string; keys: { key: string; code: string }[] }
> = {
  up: { buttonId: 'gamepad.stick2.up', keys: [{ key: 'w', code: 'KeyW' }] },
  down: { buttonId: 'gamepad.stick2.down', keys: [{ key: 's', code: 'KeyS' }] },
  left: { buttonId: 'gamepad.stick2.left', keys: [{ key: 'a', code: 'KeyA' }] },
  right: { buttonId: 'gamepad.stick2.right', keys: [{ key: 'd', code: 'KeyD' }] },
  'up-right': { buttonId: 'gamepad.stick2.up-right', keys: [{ key: 'w', code: 'KeyW' }, { key: 'd', code: 'KeyD' }] },
  'up-left': { buttonId: 'gamepad.stick2.up-left', keys: [{ key: 'w', code: 'KeyW' }, { key: 'a', code: 'KeyA' }] },
  'down-right': { buttonId: 'gamepad.stick2.down-right', keys: [{ key: 's', code: 'KeyS' }, { key: 'd', code: 'KeyD' }] },
  'down-left': { buttonId: 'gamepad.stick2.down-left', keys: [{ key: 's', code: 'KeyS' }, { key: 'a', code: 'KeyA' }] },
};

/** صف وسط صغير — Select/Start (بمسميات مختلفة: "اختيار"/"بدء"). */
export const GAMEPAD_MENU_BUTTONS: (KeyBinding & { label: string })[] = [
  { buttonId: 'gamepad.menu.select', label: 'اختيار', key: 'Tab', code: 'Tab' },
  { buttonId: 'gamepad.menu.start', label: 'بدء', key: 'Escape', code: 'Escape' },
];
