/**
 * جهة الجوال (شاشة لوحة التحكم). طريق وحيد: Miracast الأصلي بنظام
 * أندرويد، عبر MiracastPresentationPlugin.java — شوف
 * android-presentation-bridge/README.md للتفاصيل الكاملة.
 */
import { CastMessage } from './types';
import { isMiracastAvailable, openCastSettings, subscribeMiracastStatus, sendMiracastCommand } from './miracastBridge';

export type SenderState = {
  available: boolean;
  connecting: boolean;
  connected: boolean;
  displayName: string | null;
  error: string | null;
};

type Listener = (state: SenderState) => void;

let state: SenderState = {
  available: isMiracastAvailable(),
  connecting: false,
  connected: false,
  displayName: null,
  error: null,
};
const listeners = new Set<Listener>();
let unsubscribeStatus: (() => void) | null = null;

function emit() {
  listeners.forEach(l => l(state));
}

export function subscribeCastSender(listener: Listener): () => void {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
}

export function getCastSenderState(): SenderState {
  return state;
}

/** Call this once, early (e.g. when the controller screen mounts). */
export function initCastSender(): void {
  state = { ...state, available: isMiracastAvailable() };
  emit();

  if (unsubscribeStatus || !state.available) return;
  unsubscribeStatus = subscribeMiracastStatus((connected, displayName) => {
    state = { ...state, connecting: false, connected, displayName: displayName ?? null, error: null };
    emit();
  });
}

/** يفتح شاشة إعدادات أندرويد لاختيار التلفزيون. الاتصال الفعلي يصير تلقائياً بعدها (شوف subscribeMiracastStatus). */
export async function requestCastSession(): Promise<void> {
  state = { ...state, connecting: true, error: null };
  emit();

  const err = await openCastSettings();
  if (err) {
    state = { ...state, connecting: false, error: err };
    emit();
    throw new Error(err);
  }
  // الاتصال الفعلي (tvConnected) يوصل لاحقاً عبر الحدث — ما فيه
  // ضمان توقيت ثابت لأنه يعتمد على اختيار المستخدم بشاشة أندرويد.
  state = { ...state, connecting: false };
  emit();
}

export function endCastSession(): void {
  // قطع الاتصال نفسه يصير من شاشة إعدادات أندرويد (نفس مكان الاختيار) —
  // هذا فقط يصفّر الحالة محلياً لو التطبيق فقد تتبعه لأي سبب.
  state = { ...state, connected: false, connecting: false, displayName: null, error: null };
  emit();
}

/** Sends one control message to the paired TV — حقن JS مباشر عبر الإضافة الأصلية، بدون أي شبكة. */
export function sendCastMessage(message: CastMessage): void {
  if (!state.connected) return;
  void sendMiracastCommand(message);
}
