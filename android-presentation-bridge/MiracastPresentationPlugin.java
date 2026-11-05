package com.yourapp; // ⚠️ غيرها لنفس حزمة باقي المشروع

import android.app.Presentation;
import android.content.Context;
import android.content.Intent;
import android.hardware.display.DisplayManager;
import android.os.Bundle;
import android.util.Log;
import android.view.Display;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebSettings;

import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLConnection;

/**
 * طريق الاتصال الوحيد بالمشروع: Wireless Display (Miracast) الأصلي
 * بنظام أندرويد — نفس قائمة "Cast" اللي بإعدادات الاتصال (بدون جوجل،
 * وبدون أي تطبيق مثبّت على التلفزيون). ما فيه WebSocket، ولا كود PIN،
 * ولا Google Cast SDK، ولا أي مسار ثاني بديل.
 *
 * آلية العمل (نفس سلوك أندرويد الرسمي لهذا النوع من الشاشات):
 * 1) openCastSettings() يفتح شاشة إعدادات أندرويد نفسها، يختار
 *    المستخدم التلفزيون منها (نفس التجربة المألوفة تماماً).
 * 2) بمجرد ما يتصل Miracast، أندرويد يطلّع "شاشة ثانية" حقيقية
 *    (Display) فيها علم FLAG_PRESENTATION — نلتقطها تلقائياً عبر
 *    DisplayManager، بدون أي زر ثاني ولا أي كود يدوي.
 * 3) نفتح عليها Presentation فيها WebView يحمّل نفس حزمة التطبيق
 *    بالضبط بس بـ #tv — فيتوقف انعكاس الشاشة الخام (اللي أندرويد
 *    يسويه افتراضياً) ويبدأ عرض واجهة التطبيق الحقيقية، بنفس اللحظة
 *    يتحول الجوال تلقائياً للوحة تحكم (لأن صفحة الجوال نفسها بدون
 *    #tv أصلاً تفتح ControllerApp — شوف App.tsx).
 * 4) كل أمر تحكم (ماوس/كيبورد) يوصل من JS بالجوال عبر sendCommand()،
 *    وهذا الـ plugin يحقنه مباشرة بجافاسكربت داخل WebView التلفزيون —
 *    نفس العملية، صفر شبكة، صفر زمن استجابة تقريباً (<2ms).
 */
@CapacitorPlugin(name = "MiracastPresentation")
public class MiracastPresentationPlugin extends Plugin {

    private static final String TAG = "MiracastPresentation";

    private DisplayManager displayManager;
    private TvPresentation activePresentation;
    private WebView tvWebView;

    private final DisplayManager.DisplayListener displayListener = new DisplayManager.DisplayListener() {
        @Override
        public void onDisplayAdded(int displayId) {
            Display display = displayManager.getDisplay(displayId);
            if (display == null) return;
            if ((display.getFlags() & Display.FLAG_PRESENTATION) == 0) return;
            showPresentation(display);
        }

        @Override
        public void onDisplayRemoved(int displayId) {
            dismissPresentation();
        }

        @Override
        public void onDisplayChanged(int displayId) {
            // لا شيء — مهتمين فقط بظهور/اختفاء الشاشة الثانية.
        }
    };

    @Override
    public void load() {
        displayManager = (DisplayManager) getContext().getSystemService(Context.DISPLAY_SERVICE);
        displayManager.registerDisplayListener(displayListener, null);

        // لو كان التلفزيون متصل أصلاً قبل ما يفتح التطبيق، نلقطه على طول.
        Display[] existing = displayManager.getDisplays(DisplayManager.DISPLAY_CATEGORY_PRESENTATION);
        if (existing.length > 0) {
            showPresentation(existing[0]);
        }
    }

    /** يفتح شاشة إعدادات أندرويد لاختيار جهاز Cast/Wireless Display — بدون أي تخمين لجهاز واحد، يجرب كل المسارات المعروفة بالترتيب. */
    @PluginMethod
    public void openCastSettings(PluginCall call) {
        String[] actions = new String[] {
            "android.settings.CAST_SETTINGS",
            "android.settings.WIFI_DISPLAY_SETTINGS",
            "com.android.settings.WFD_SETTINGS"
        };
        for (String action : actions) {
            try {
                Intent intent = new Intent(action);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                call.resolve();
                return;
            } catch (Exception ignored) {
                // الإجراء هذا مو مدعوم على هذا الجهاز — جرّب التالي.
            }
        }
        call.reject("ما لقينا شاشة إعدادات Cast على هذا الجهاز.");
    }

    @PluginMethod
    public void isConnected(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("connected", activePresentation != null);
        call.resolve(ret);
    }

    /** يرسل أمر تحكم واحد (JSON) لواجهة التلفزيون المعروضة حالياً — حقن JS مباشر، بدون أي شبكة. */
    @PluginMethod
    public void sendCommand(PluginCall call) {
        String json = call.getString("command");
        WebView target = tvWebView;
        if (json == null || target == null) {
            call.resolve();
            return;
        }
        final String js = "window.onTvControllerInput && window.onTvControllerInput(" + json + ");";
        target.post(() -> target.evaluateJavascript(js, null));
        call.resolve();
    }

    private void showPresentation(Display display) {
        if (activePresentation != null || getActivity() == null) return;
        getActivity().runOnUiThread(() -> {
            if (activePresentation != null) return;
            try {
                activePresentation = new TvPresentation(getContext(), display);
                activePresentation.show();
                JSObject data = new JSObject();
                data.put("displayName", display.getName());
                notifyListeners("tvConnected", data);
            } catch (Exception e) {
                Log.e(TAG, "فشل فتح نافذة العرض على شاشة التلفزيون", e);
                activePresentation = null;
            }
        });
    }

    private void dismissPresentation() {
        if (getActivity() == null) {
            activePresentation = null;
            tvWebView = null;
            return;
        }
        getActivity().runOnUiThread(() -> {
            if (activePresentation != null) {
                activePresentation.dismiss();
                activePresentation = null;
            }
            tvWebView = null;
            notifyListeners("tvDisconnected", new JSObject());
        });
    }

    /**
     * يخدّم ملفات التطبيق المبنية (assets/public/…) مباشرة لـ WebView
     * التلفزيون، بنفس طريقة Capacitor الداخلية بالضبط — عشان تشتغل
     * المسارات المطلقة (/assets/xyz.js) صح، ونتجنب الشاشة البيضاء
     * اللي تصير لو حاولنا نحمّل رابط WebView الجوال (ذاك خاص فيه هو
     * بس، التلفزيون ما يقدر يوصله).
     */
    private WebResourceResponse servePublicAsset(String path) {
        String target = (path == null || path.isEmpty()) ? "index.html" : path;
        try {
            InputStream stream = getContext().getAssets().open("public/" + target);
            return new WebResourceResponse(guessMimeType(target), "UTF-8", stream);
        } catch (IOException e) {
            return null;
        }
    }

    private static String guessMimeType(String path) {
        if ("api/apps".equals(path)) return "application/json";
        if (path.endsWith(".js") || path.endsWith(".mjs")) return "text/javascript";
        if (path.endsWith(".css")) return "text/css";
        if (path.endsWith(".html")) return "text/html";
        if (path.endsWith(".json")) return "application/json";
        if (path.endsWith(".svg")) return "image/svg+xml";
        if (path.endsWith(".png")) return "image/png";
        if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
        if (path.endsWith(".woff2")) return "font/woff2";
        if (path.endsWith(".woff")) return "font/woff";
        String guess = URLConnection.guessContentTypeFromName(path);
        return guess != null ? guess : "application/octet-stream";
    }

    @Override
    protected void handleOnDestroy() {
        if (displayManager != null) {
            displayManager.unregisterDisplayListener(displayListener);
        }
        dismissPresentation();
        super.handleOnDestroy();
    }

    /** نافذة العرض الفعلية على شاشة التلفزيون: WebView كامل يحمّل نفس حزمة التطبيق بوضع #tv. */
    private class TvPresentation extends Presentation {
        TvPresentation(Context context, Display display) {
            super(context, display);
        }

        @Override
        protected void onCreate(Bundle savedInstanceState) {
            super.onCreate(savedInstanceState);

            WebView webView = new WebView(getContext());
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setMediaPlaybackRequiresUserGesture(false);

            // يخدّم assets/public/* مباشرة من جوّا الـ APK على دومين وهمي
            // https://localhost — بالضبط نفس أسلوب Capacitor الداخلي، فتشتغل
            // المسارات المطلقة بالبناء (/assets/...) صح بدون أي شاشة بيضاء.
            WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .setDomain("localhost")
                .addPathHandler("/", MiracastPresentationPlugin.this::servePublicAsset)
                .build();

            webView.setWebViewClient(new WebViewClientCompat() {
                @Override
                public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                    return assetLoader.shouldInterceptRequest(request.getUrl());
                }
            });

            // Separate Android-app bridge for the TV WebView; does not change Miracast connection handling.
            webView.addJavascriptInterface(
                new TvInstalledAppsBridge(getContext(), getDisplay().getDisplayId()),
                "AstroAndroidApps"
            );

            setContentView(webView);
            tvWebView = webView;
            webView.loadUrl("https://localhost/index.html#tv");
        }

        @Override
        public void dismiss() {
            if (tvWebView != null) {
                tvWebView.destroy();
            }
            super.dismiss();
        }
    }
}
