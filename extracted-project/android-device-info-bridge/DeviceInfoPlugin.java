package com.yourapp; // ⚠️ غيرها لنفس حزمة باقي المشروع (نفس قيمة MiracastPresentationPlugin.java)

import android.app.ActivityManager;
import android.content.Context;
import android.os.Build;
import android.os.StatFs;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * إضافة Android منفصلة تماماً عن MiracastPresentationPlugin.java — ما
 * تلمس الاتصال إطلاقاً. وظيفتها الوحيدة: قراءة رام وتخزين الجهاز
 * الحقيقيين عشان شاشة الإعدادات (SettingsApp.tsx) تقدر تقول للمستخدم
 * "هل جهازك يتحمل كل التطبيقات المثبتة" بأرقام حقيقية بدل تخمين.
 *
 * الاستدعاء من JS: src/services/deviceInfo.ts (getDeviceInfo()).
 */
@CapacitorPlugin(name = "DeviceInfo")
public class DeviceInfoPlugin extends Plugin {

    @PluginMethod
    public void getDeviceInfo(PluginCall call) {
        Context ctx = getContext();
        JSObject result = new JSObject();

        try {
            ActivityManager am = (ActivityManager) ctx.getSystemService(Context.ACTIVITY_SERVICE);
            ActivityManager.MemoryInfo memInfo = new ActivityManager.MemoryInfo();
            if (am != null) {
                am.getMemoryInfo(memInfo);
                result.put("totalRamMB", memInfo.totalMem / (1024 * 1024));
                result.put("availRamMB", memInfo.availMem / (1024 * 1024));
                result.put("isLowRamDevice", am.isLowRamDevice());
            } else {
                result.put("totalRamMB", 0);
                result.put("availRamMB", 0);
                result.put("isLowRamDevice", false);
            }

            StatFs stat = new StatFs(ctx.getFilesDir().getAbsolutePath());
            long blockSize = stat.getBlockSizeLong();
            long totalBytes = stat.getBlockCountLong() * blockSize;
            long freeBytes = stat.getAvailableBlocksLong() * blockSize;
            result.put("totalStorageMB", totalBytes / (1024 * 1024));
            result.put("freeStorageMB", freeBytes / (1024 * 1024));

            result.put("androidVersion", Build.VERSION.RELEASE);
            result.put("model", Build.MANUFACTURER + " " + Build.MODEL);

            call.resolve(result);
        } catch (Exception e) {
            call.reject("تعذّرت قراءة معلومات الجهاز: " + e.getMessage());
        }
    }
}
