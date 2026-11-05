package com.yourapp; // ⚠️ غيرها لنفس حزمة باقي المشروع (نفس قيمة MiracastPresentationPlugin.java)

import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.util.Base64;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.util.List;

/**
 * إضافة Android منفصلة تماماً عن MiracastPresentationPlugin.java — ما
 * تلمس الاتصال إطلاقاً. وظيفتها: إرجاع قائمة تطبيقات أندرويد الحقيقية
 * المثبتة على الجوال (جوجل، كروم، الألعاب...) مع أيقوناتها، وفتح أي
 * واحد منها — هذا هو "تطبيقات أندرويد" في AndroidAppsScreen.tsx.
 *
 * الاستدعاء من JS: src/services/installedAndroidApps.ts.
 */
@CapacitorPlugin(name = "InstalledApps")
public class InstalledAppsPlugin extends Plugin {

    private static final String TAG = "InstalledApps";

    @PluginMethod
    public void list(PluginCall call) {
        try {
            PackageManager pm = getContext().getPackageManager();

            Intent launcherIntent = new Intent(Intent.ACTION_MAIN);
            launcherIntent.addCategory(Intent.CATEGORY_LAUNCHER);
            List<ResolveInfo> resolveInfos = pm.queryIntentActivities(launcherIntent, 0);

            JSArray apps = new JSArray();
            for (ResolveInfo info : resolveInfos) {
                try {
                    ApplicationInfo appInfo = info.activityInfo.applicationInfo;
                    String packageName = appInfo.packageName;
                    // نتجاهل تطبيقنا نفسه عشان ما يظهر بقائمته الخاصة.
                    if (packageName.equals(getContext().getPackageName())) continue;

                    String label = String.valueOf(pm.getApplicationLabel(appInfo));
                    String iconDataUrl = null;
                    try {
                        Drawable icon = pm.getApplicationIcon(appInfo);
                        iconDataUrl = drawableToDataUrl(icon);
                    } catch (Exception ignored) {
                        // أيقونة فشلت — نكمل بدونها، الواجهة تعرض بديل افتراضي.
                    }

                    JSObject app = new JSObject();
                    app.put("packageName", packageName);
                    app.put("name", label);
                    app.put("iconDataUrl", iconDataUrl);
                    apps.put(app);
                } catch (Exception inner) {
                    Log.w(TAG, "تعذّرت قراءة أحد التطبيقات، تم تجاوزه", inner);
                }
            }

            JSObject result = new JSObject();
            result.put("apps", apps);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("تعذّرت قراءة قائمة التطبيقات: " + e.getMessage());
        }
    }

    @PluginMethod
    public void launch(PluginCall call) {
        String packageName = call.getString("packageName");
        if (packageName == null || packageName.isEmpty()) {
            call.reject("packageName مفقود");
            return;
        }
        try {
            PackageManager pm = getContext().getPackageManager();
            Intent launchIntent = pm.getLaunchIntentForPackage(packageName);
            if (launchIntent == null) {
                call.reject("ما قدرنا نفتح هذا التطبيق");
                return;
            }
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(launchIntent);
            call.resolve();
        } catch (Exception e) {
            call.reject("تعذّر فتح التطبيق: " + e.getMessage());
        }
    }

    private String drawableToDataUrl(Drawable drawable) {
        int size = 96; // أيقونة صغيرة تكفي للعرض، تخلي الاستجابة خفيفة.
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        drawable.setBounds(0, 0, size, size);
        drawable.draw(canvas);

        ByteArrayOutputStream stream = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.PNG, 90, stream);
        String base64 = Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP);
        return "data:image/png;base64," + base64;
    }
}
