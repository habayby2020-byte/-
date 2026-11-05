/**
 * Android app access in the TV Presentation WebView.
 * The TV WebView is separate from Capacitor's phone WebView, so it must use
 * the native JavascriptInterface bridge registered on the Presentation.
 */
export interface InstalledAndroidApp {
  packageName: string;
  activityName: string;
  name: string;
  iconDataUrl: string | null;
}

export interface AndroidLaunchResult {
  ok: boolean;
  message: string;
  target: 'tv' | 'phone' | 'none' | 'timeout';
}

declare global {
  interface Window {
    AstroAndroidApps?: {
      list: () => string;
      launch: (packageName: string, activityName: string) => string;
    };
  }
}

function getCapacitorPlugin(): any {
  if (typeof window === 'undefined') return null;
  return (window as any).Capacitor?.Plugins?.InstalledApps ?? null;
}

function getTvBridge() {
  if (typeof window === 'undefined') return null;
  return window.AstroAndroidApps ?? null;
}

function normalizeApps(raw: any): InstalledAndroidApp[] {
  const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (payload?.error) throw new Error(String(payload.error));
  const apps = Array.isArray(payload?.apps) ? payload.apps : [];
  const unique = new Map<string, InstalledAndroidApp>();
  for (const app of apps) {
    const packageName = String(app?.packageName ?? '').trim();
    if (!packageName || unique.has(packageName)) continue;
    unique.set(packageName, {
      packageName,
      activityName: String(app?.activityName ?? ''),
      name: String(app?.name ?? packageName),
      iconDataUrl: typeof app?.iconDataUrl === 'string' ? app.iconDataUrl : null,
    });
  }
  return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function isInstalledAppsAvailable(): boolean {
  return !!(getTvBridge() || getCapacitorPlugin());
}

export async function listInstalledAndroidApps(): Promise<InstalledAndroidApp[] | null> {
  const tvBridge = getTvBridge();
  const plugin = getCapacitorPlugin();
  try {
    if (tvBridge?.list) return normalizeApps(tvBridge.list());
    if (plugin?.list) return normalizeApps(await plugin.list());
    return null;
  } catch (error) {
    console.error('[ASTRO] Failed to list Android apps:', error);
    return null;
  }
}

function normalizeLaunchResult(raw: any): AndroidLaunchResult {
  const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return {
    ok: value?.ok === true,
    message: String(value?.message ?? (value?.ok ? 'تم إرسال طلب التشغيل.' : 'تعذّر تشغيل التطبيق.')),
    target: ['tv', 'phone', 'timeout'].includes(value?.target) ? value.target : 'none',
  };
}

export async function launchInstalledAndroidApp(app: InstalledAndroidApp): Promise<AndroidLaunchResult> {
  const tvBridge = getTvBridge();
  const plugin = getCapacitorPlugin();
  try {
    if (tvBridge?.launch) {
      return normalizeLaunchResult(tvBridge.launch(app.packageName, app.activityName));
    }
    if (plugin?.launch) {
      await plugin.launch({ packageName: app.packageName });
      return { ok: true, message: 'تم إرسال طلب فتح التطبيق على الجوال.', target: 'phone' };
    }
    return { ok: false, message: 'جسر تشغيل تطبيقات أندرويد غير متصل.', target: 'none' };
  } catch (error) {
    console.error('[ASTRO] Failed to launch Android app:', error);
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'تعذّر تشغيل التطبيق.',
      target: 'none',
    };
  }
}
