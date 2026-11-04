/**
 * جسر JS لإضافة Android أصلية جديدة (DeviceInfoPlugin.java — منفصلة
 * تماماً عن MiracastPresentationPlugin.java، ما تلمس الاتصال إطلاقاً)
 * تقرأ الرام والتخزين الحقيقيين من نظام أندرويد. انظر
 * android-device-info-bridge/README.md.
 */

export interface DeviceInfo {
  totalRamMB: number;
  availRamMB: number;
  isLowRamDevice: boolean;
  totalStorageMB: number;
  freeStorageMB: number;
  androidVersion: string;
  model: string;
}

function getPlugin(): any {
  if (typeof window === 'undefined') return null;
  const cap = (window as any).Capacitor;
  return cap?.Plugins?.DeviceInfo ?? null;
}

/** صحيح بس جوا الـ APK بعد إضافة DeviceInfoPlugin.java وبناء نسخة جديدة. */
export function isDeviceInfoAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as any).Capacitor;
  return !!(cap?.isNativePlatform?.() && cap?.Plugins?.DeviceInfo);
}

export async function getDeviceInfo(): Promise<DeviceInfo | null> {
  const plugin = getPlugin();
  if (!plugin) return null;
  try {
    const res = await plugin.getDeviceInfo();
    return {
      totalRamMB: Number(res?.totalRamMB ?? 0),
      availRamMB: Number(res?.availRamMB ?? 0),
      isLowRamDevice: !!res?.isLowRamDevice,
      totalStorageMB: Number(res?.totalStorageMB ?? 0),
      freeStorageMB: Number(res?.freeStorageMB ?? 0),
      androidVersion: String(res?.androidVersion ?? '؟'),
      model: String(res?.model ?? '؟'),
    };
  } catch {
    return null;
  }
}

/** تقييم بسيط: هل الجهاز مرتاح مع كل التطبيقات المثبتة بالنظام. */
export function compatibilityVerdict(info: DeviceInfo): { ok: boolean; message: string } {
  if (info.isLowRamDevice || info.totalRamMB > 0 && info.totalRamMB < 1500) {
    return { ok: false, message: 'الرام منخفضة على هذا الجهاز — قد تحس ببطء مع فتح عدة تطبيقات بنفس الوقت.' };
  }
  if (info.freeStorageMB > 0 && info.freeStorageMB < 300) {
    return { ok: false, message: 'مساحة التخزين المتبقية قليلة — فضّل تفريغ بعض الملفات قبل إضافة تطبيقات جديدة.' };
  }
  return { ok: true, message: 'جهازك يدعم كل التطبيقات المثبتة بسلاسة.' };
}
