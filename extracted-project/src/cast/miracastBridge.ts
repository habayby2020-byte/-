/**
 * واجهة الجافاسكربت لإضافة Android الأصلية (MiracastPresentationPlugin.java
 * — انظر android-presentation-bridge/README.md). هذا هو طريق الاتصال
 * الوحيد بالمشروع: Wireless Display (Miracast) الأصلي بنظام أندرويد.
 */
import { CastMessage } from './types';

function getPlugin(): any {
  if (typeof window !== 'undefined') {
    const cap = (window as any).Capacitor;
    if (cap?.Plugins?.MiracastPresentation) {
      return cap.Plugins.MiracastPresentation;
    }
  }
  return null;
}

/** صحيح بس داخل الـ APK (خارج APK — معاينة متصفح — ما فيه Miracast API). */
export function isMiracastAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as any).Capacitor;
  return !!(cap?.isNativePlatform?.() && cap?.Plugins?.MiracastPresentation);
}

/** يفتح شاشة إعدادات أندرويد لاختيار التلفزيون (نفس قائمة Cast المعتادة). */
export async function openCastSettings(): Promise<string | null> {
  const plugin = getPlugin();
  if (!plugin) return 'Miracast غير متوفر في هذا التطبيق.';
  try {
    await plugin.openCastSettings();
    return null;
  } catch (err: any) {
    return err?.message ?? String(err ?? 'تعذّر فتح إعدادات Cast');
  }
}

/** يرجع حالة الاتصال الحالية فوراً (ما يرمي أخطاء). */
export async function getMiracastStatus(): Promise<boolean> {
  const plugin = getPlugin();
  if (!plugin) return false;
  try {
    const res = await plugin.isConnected();
    return !!res?.connected;
  } catch {
    return false;
  }
}

/** يشترك بتحديثات حالة الاتصال لحظياً (اتصال/قطع). يرجع دالة لإلغاء الاشتراك. */
export function subscribeMiracastStatus(
  onChange: (connected: boolean, displayName?: string) => void
): () => void {
  const plugin = getPlugin();
  if (!plugin?.addListener) return () => {};
  let connectedHandle: any;
  let disconnectedHandle: any;
  let cancelled = false;

  Promise.resolve(
    plugin.addListener('tvConnected', (data: any) => onChange(true, data?.displayName))
  ).then((h: any) => (cancelled ? h?.remove?.() : (connectedHandle = h)));

  Promise.resolve(plugin.addListener('tvDisconnected', () => onChange(false))).then(
    (h: any) => (cancelled ? h?.remove?.() : (disconnectedHandle = h))
  );

  return () => {
    cancelled = true;
    connectedHandle?.remove?.();
    disconnectedHandle?.remove?.();
  };
}

/** يرسل أمر تحكم واحد لواجهة التلفزيون المعروضة حالياً — حقن JS مباشر، بدون أي شبكة. */
export async function sendMiracastCommand(command: CastMessage): Promise<void> {
  const plugin = getPlugin();
  if (!plugin) return;
  try {
    await plugin.sendCommand({ command: JSON.stringify(command) });
  } catch {
    // التلفزيون مو متصل حالياً — تجاهل بهدوء، الحالة تنعرض من الأحداث فوق.
  }
}
