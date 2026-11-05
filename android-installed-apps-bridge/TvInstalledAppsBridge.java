package com.yourapp;

import android.app.Activity;
import android.app.ActivityOptions;
import android.content.ComponentName;
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
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/** Native bridge for listing and launching Android apps from the TV Presentation. */
public final class TvInstalledAppsBridge {
    private final Activity activity;
    private final int displayId;

    public TvInstalledAppsBridge(Activity activity, int displayId) {
        this.activity = activity;
        this.displayId = displayId;
    }

    @JavascriptInterface
    public String list() {
        JSONObject result = new JSONObject();
        JSONArray apps = new JSONArray();
        try {
            PackageManager pm = activity.getPackageManager();
            Intent query = new Intent(Intent.ACTION_MAIN);
            query.addCategory(Intent.CATEGORY_LAUNCHER);
            List<ResolveInfo> matches = pm.queryIntentActivities(query, PackageManager.MATCH_DEFAULT_ONLY);
            Map<String, ResolveInfo> unique = new LinkedHashMap<>();
            for (ResolveInfo info : matches) {
                if (info.activityInfo == null || info.activityInfo.applicationInfo == null) continue;
                String packageName = info.activityInfo.packageName;
                if (packageName == null || packageName.equals(activity.getPackageName())) continue;
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
                    app.put("activityName", info.activityInfo.name);
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

    /**
     * Called from the TV WebView's JS bridge thread. Perform Activity launches
     * on the host Activity's UI thread, using the exact launcher component that
     * was listed. Try the Presentation display first, then the phone display.
     */
    @JavascriptInterface
    public String launch(String packageName, String activityName) {
        if (packageName == null || packageName.trim().isEmpty()
                || activityName == null || activityName.trim().isEmpty()) {
            return launchResult(false, "بيانات التطبيق ناقصة", "none");
        }
        if (activity.isFinishing() || (Build.VERSION.SDK_INT >= 17 && activity.isDestroyed())) {
            return launchResult(false, "واجهة ASTRO غير نشطة حالياً؛ أعد فتح شاشة التلفزيون.", "none");
        }

        final AtomicReference<String> result = new AtomicReference<>(launchResult(false, "لم يبدأ طلب التشغيل", "none"));
        final CountDownLatch latch = new CountDownLatch(1);

        activity.runOnUiThread(() -> {
            try {
                Intent intent = new Intent(Intent.ACTION_MAIN);
                intent.addCategory(Intent.CATEGORY_LAUNCHER);
                intent.setComponent(new ComponentName(packageName, activityName));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);

                boolean launchedOnTv = false;
                String tvFailure = null;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && displayId >= 0) {
                    try {
                        ActivityOptions options = ActivityOptions.makeBasic();
                        options.setLaunchDisplayId(displayId);
                        activity.startActivity(intent, options.toBundle());
                        launchedOnTv = true;
                    } catch (Exception error) {
                        tvFailure = error.getMessage();
                    }
                }

                if (launchedOnTv) {
                    result.set(launchResult(true, "تم إرسال طلب فتح التطبيق على شاشة التلفزيون.", "tv"));
                } else {
                    try {
                        activity.startActivity(intent);
                        String detail = tvFailure == null
                            ? "التطبيق لا يدعم الفتح على الشاشة الثانوية؛ تم فتحه على الجوال."
                            : "تعذّر فتحه على التلفزيون (" + tvFailure + ")؛ تم فتحه على الجوال.";
                        result.set(launchResult(true, detail, "phone"));
                    } catch (Exception phoneError) {
                        String message = phoneError.getMessage() == null ? "رفض أندرويد تشغيل التطبيق" : phoneError.getMessage();
                        result.set(launchResult(false, message, "none"));
                    }
                }
            } catch (Exception error) {
                String message = error.getMessage() == null ? "حدث خطأ أثناء طلب التشغيل" : error.getMessage();
                result.set(launchResult(false, message, "none"));
            } finally {
                latch.countDown();
            }
        });

        try {
            if (!latch.await(4, TimeUnit.SECONDS)) {
                return launchResult(false, "انتهت مهلة انتظار استجابة أندرويد لطلب التشغيل.", "timeout");
            }
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            return launchResult(false, "تم إيقاف طلب التشغيل.", "none");
        }
        return result.get();
    }

    private static String launchResult(boolean ok, String message, String target) {
        JSONObject value = new JSONObject();
        try {
            value.put("ok", ok);
            value.put("message", message);
            value.put("target", target);
            return value.toString();
        } catch (Exception ignored) {
            return "{\"ok\":" + ok + "}";
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
