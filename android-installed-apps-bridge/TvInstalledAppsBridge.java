package com.yourapp;

import android.app.ActivityOptions;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.util.Base64;
import android.webkit.JavascriptInterface;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Read/launch Android launcher apps from the TV Presentation WebView.
 * This is an additive bridge; it does not manage or alter Miracast connection state.
 */
public final class TvInstalledAppsBridge {
    private final Context context;
    private final int displayId;

    public TvInstalledAppsBridge(Context context, int displayId) {
        this.context = context;
        this.displayId = displayId;
    }

    @JavascriptInterface
    public String list() {
        JSONObject result = new JSONObject();
        JSONArray apps = new JSONArray();
        try {
            PackageManager pm = context.getPackageManager();
            Intent query = new Intent(Intent.ACTION_MAIN);
            query.addCategory(Intent.CATEGORY_LAUNCHER);
            List<ResolveInfo> matches = pm.queryIntentActivities(query, 0);
            Map<String, ResolveInfo> unique = new LinkedHashMap<>();

            for (ResolveInfo info : matches) {
                if (info.activityInfo == null || info.activityInfo.applicationInfo == null) continue;
                String packageName = info.activityInfo.packageName;
                if (packageName == null || packageName.equals(context.getPackageName())) continue;
                if (!unique.containsKey(packageName)) unique.put(packageName, info);
            }

            for (Map.Entry<String, ResolveInfo> entry : unique.entrySet()) {
                try {
                    ResolveInfo info = entry.getValue();
                    String packageName = entry.getKey();
                    String label = String.valueOf(pm.getApplicationLabel(info.activityInfo.applicationInfo));
                    String iconDataUrl = null;
                    try {
                        Drawable drawable = pm.getApplicationIcon(info.activityInfo.applicationInfo);
                        iconDataUrl = drawableToDataUrl(drawable);
                    } catch (Exception ignored) { }

                    JSONObject app = new JSONObject();
                    app.put("packageName", packageName);
                    app.put("name", label);
                    app.put("iconDataUrl", iconDataUrl == null ? JSONObject.NULL : iconDataUrl);
                    apps.put(app);
                } catch (Exception ignored) { }
            }
            result.put("apps", apps);
        } catch (Exception error) {
            try {
                result.put("apps", apps);
                result.put("error", error.getMessage() == null ? "تعذّرت قراءة التطبيقات" : error.getMessage());
            } catch (Exception ignored) { }
        }
        return result.toString();
    }

    @JavascriptInterface
    public boolean launch(String packageName) {
        if (packageName == null || packageName.trim().isEmpty()) return false;
        try {
            Intent intent = context.getPackageManager().getLaunchIntentForPackage(packageName);
            if (intent == null) return false;
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && displayId >= 0) {
                ActivityOptions options = ActivityOptions.makeBasic();
                options.setLaunchDisplayId(displayId);
                context.startActivity(intent, options.toBundle());
            } else {
                context.startActivity(intent);
            }
            return true;
        } catch (Exception error) {
            android.util.Log.e("TvInstalledAppsBridge", "Unable to launch " + packageName + " on display " + displayId, error);
            return false;
        }
    }

    private static String drawableToDataUrl(Drawable drawable) {
        final int size = 80;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        drawable.setBounds(0, 0, size, size);
        drawable.draw(canvas);
        ByteArrayOutputStream stream = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.PNG, 88, stream);
        return "data:image/png;base64," + Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP);
    }
}
