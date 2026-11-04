import { Capacitor, registerPlugin } from '@capacitor/core';

export interface InstalledAndroidApp {
  packageName: string;
  name: string;
  /** PNG data URL for the Android app icon. */
  iconDataUrl: string | null;
}

interface InstalledAppsNativePlugin {
  list(): Promise<{ apps?: Array<{
    packageName?: string;
    name?: string;
    iconDataUrl?: string | null;
  }> }>;
  launch(options: { packageName: string }): Promise<void>;
}

// registerPlugin is required for custom Capacitor plugins. Reading
// window.Capacitor.Plugins directly does not reliably expose manually
// registered plugins in Capacitor 6.
const InstalledApps = registerPlugin<InstalledAppsNativePlugin>('InstalledApps');

export function isInstalledAppsAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

export async function listInstalledAndroidApps(): Promise<InstalledAndroidApp[] | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const result = await InstalledApps.list();
    const apps = Array.isArray(result?.apps) ? result.apps : [];
    return apps
      .filter((app) => !!app.packageName)
      .map((app) => ({
        packageName: String(app.packageName),
        name: String(app.name ?? app.packageName),
        iconDataUrl: app.iconDataUrl ?? null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  } catch (error) {
    console.error('[InstalledApps] Failed to read Android launcher apps:', error);
    throw error;
  }
}

export async function launchInstalledAndroidApp(packageName: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    await InstalledApps.launch({ packageName });
    return true;
  } catch (error) {
    console.error('[InstalledApps] Failed to launch app:', packageName, error);
    return false;
  }
}
