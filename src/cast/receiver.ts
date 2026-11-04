/**
 * جهة التلفاز (نفس صفحة الديسكتوب العادية، تُفتح تلقائياً بوضع #tv
 * داخل نافذة Presentation اللي يصنعها MiracastPresentationPlugin.java).
 * طريق وحيد: Miracast الأصلي — شوف android-presentation-bridge/README.md.
 *
 * ما فيه أي اتصال شبكة هنا: الإضافة الأصلية تحقن أوامر التحكم مباشرة
 * بجافاسكربت عبر window.onTvControllerInput — هذا الملف بس يستمع لها
 * ويحوّلها لنفس شكل CastMessage اللي تتوقعه بقية الواجهة.
 */
import { CastMessage } from './types';

export type ReceiverStatus = 'waiting' | 'paired';

export type ReceiverState = {
  status: ReceiverStatus;
};

type Listener = (state: ReceiverState) => void;

let state: ReceiverState = { status: 'waiting' };
const listeners = new Set<Listener>();
let messageHandler: ((message: CastMessage) => void) | null = null;

declare global {
  interface Window {
    onTvControllerInput?: (cmd: any) => void;
  }
}

function emit() {
  listeners.forEach(l => l(state));
}

export function subscribeCastReceiver(listener: Listener): () => void {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
}

export function getCastReceiverState(): ReceiverState {
  return state;
}

/** Call once when the TV/desktop view mounts (#tv route). */
export function startCastReceiver(onMessage: (message: CastMessage) => void): void {
  messageHandler = onMessage;
  state = { status: 'waiting' };
  emit();

  // المسار الوحيد: الإضافة الأصلية تستدعي هذي الدالة مباشرة بحقن
  // JS، بدون أي شبكة (<2ms تقريباً).
  window.onTvControllerInput = (cmd: any) => {
    if (state.status !== 'paired') {
      state = { status: 'paired' };
      emit();
    }
    if (cmd && typeof cmd === 'object' && cmd.type) {
      messageHandler?.(cmd as CastMessage);
    }
  };
}

/** Call when the TV/desktop view unmounts. */
export function stopCastReceiver(): void {
  delete window.onTvControllerInput;
  messageHandler = null;
  state = { status: 'waiting' };
  emit();
}
