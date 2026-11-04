/**
 * جسر JS لإضافة Android أصلية جديدة (InstalledAppsPlugin.java — منفصلة
 * تماماً عن اتصال Miracast) تقرأ قائمة تطبيقات أندرويد المثبتة فعلياً
 * على جوالك (نفس الشيء اللي يطلع بمشغّل التطبيقات العادي: جوجل،
 * كروم، الألعاب...) مع أيقونة كل تطبيق. انظر
 * android-installed-apps-bridge/README.md.
 */

export interface InstalledAndroidApp {
  packageName: string;
  name: string;
  /** data URL (PNG) لأيقونة التطبيق، جاهزة للعرض مباشرة بـ <img>. */
  iconDataUrl: string | null;
}

function getPlugin(): any {
  if (typeof window === 'undefined') return null;
  const cap = (window as any).Capacitor;
  return cap?.Plugins?.InstalledApps ?? null;
}

export function isInstalledAppsAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as any).Capacitor;
  return !!(cap?.isNativePlatform?.() && cap?.Plugins?.InstalledApps);
}

export async function listInstalledAndroidApps(): Promise<InstalledAndroidApp[] | null> {
  const plugin = getPlugin();
  if (!plugin) return null;
  try {
    const res = await plugin.list();
    const apps = Array.isArray(res?.apps) ? res.apps : [];
    return apps.map((a: any) => ({
      packageName: String(a.packageName ?? ''),
      name: String(a.name ?? a.packageName ?? 'تطبيق'),
      iconDataUrl: a.iconDataUrl ?? null,
    }));
  } catch {
    return null;
  }
}

/** يفتح تطبيق أندرويد مثبّت فعلياً (نفس أي لانشر) عبر حزمته. */
export async function launchInstalledAndroidApp(packageName: string): Promise<boolean> {
  const plugin = getPlugin();
  if (!plugin) return false;
  try {
    await plugin.launch({ packageName });
    return true;
  } catch {
    return false;
  }
}
