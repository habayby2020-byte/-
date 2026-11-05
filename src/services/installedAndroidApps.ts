/**
 * Android app access for both WebViews:
 * - Phone Capacitor WebView: Capacitor.Plugins.InstalledApps
 * - TV Presentation WebView: window.AstroAndroidApps (JavascriptInterface)
 * The TV bridge launches apps on the secondary display when Android permits it.
 */
export interface InstalledAndroidApp {
  packageName: string;
  name: string;
  iconDataUrl: string | null;
}

declare global {
  interface Window {
    AstroAndroidApps?: {
      list: () => string;
      launch: (packageName: string) => boolean;
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

/** Launch on the TV's secondary display when called from the Presentation WebView. */
export async function launchInstalledAndroidApp(packageName: string): Promise<boolean> {
  const tvBridge = getTvBridge();
  const plugin = getCapacitorPlugin();
  try {
    if (tvBridge?.launch) return tvBridge.launch(packageName) === true;
    if (plugin?.launch) {
      await plugin.launch({ packageName });
      return true;
    }
    return false;
  } catch (error) {
    console.error('[ASTRO] Failed to launch Android app:', error);
    return false;
  }
}
