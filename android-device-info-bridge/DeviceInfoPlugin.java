package com.yourapp; // ⚠️ غيرها لنفس حزمة باقي المشروع (نفس قيمة MiracastPresentationPlugin.java)

import android.app.ActivityManager;
import android.bluetooth.BluetoothAdapter;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.wifi.WifiManager;
import android.os.BatteryManager;
import android.os.Build;
import android.os.StatFs;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedReader;
import java.io.FileReader;

/**
 * إضافة Android منفصلة تماماً عن MiracastPresentationPlugin.java — ما
 * تلمس الاتصال إطلاقاً. تقرأ حالة الجهاز الحقيقية: رام، تخزين،
 * بطارية/شحن، حرارة المعالج (أفضل محاولة — مو كل الأجهزة تعرضها)،
 * وحالة الواي فاي والبلوتوث — عشان شاشة "أسترو" الرئيسية تعرض أرقام
 * حقيقية بدل تخمين.
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

            // --- البطارية والشحن — لا تحتاج أي صلاحية خاصة ---
            try {
                IntentFilter ifilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
                Intent batteryStatus = ctx.registerReceiver(null, ifilter);
                if (batteryStatus != null) {
                    int level = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
                    int scale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
                    int status = batteryStatus.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
                    int percent = (level >= 0 && scale > 0) ? Math.round(level * 100f / scale) : -1;
                    boolean charging = status == BatteryManager.BATTERY_STATUS_CHARGING
                            || status == BatteryManager.BATTERY_STATUS_FULL;
                    result.put("batteryPercent", percent);
                    result.put("isCharging", charging);
                } else {
                    result.put("batteryPercent", -1);
                    result.put("isCharging", false);
                }
            } catch (Exception e) {
                result.put("batteryPercent", -1);
                result.put("isCharging", false);
            }

            // --- حرارة المعالج — أفضل محاولة بس؛ مو كل الأجهزة تعرّضها،
            // فلو فشلت نرجّع null بدون ما نفشل الطلب كامل ---
            Double cpuTemp = readCpuTemperature();
            if (cpuTemp != null) result.put("cpuTempCelsius", cpuTemp);
            else result.put("cpuTempCelsius", (Object) null);

            // --- الواي فاي — يحتاج ACCESS_WIFI_STATE (مضافة بالـ manifest) ---
            try {
                WifiManager wifi = (WifiManager) ctx.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
                result.put("wifiEnabled", wifi != null && wifi.isWifiEnabled());
            } catch (Exception e) {
                result.put("wifiEnabled", (Object) null);
            }

            // --- البلوتوث — على أندرويد ١٢+ تحتاج BLUETOOTH_CONNECT
            // runtime permission؛ لو ما كانت ممنوحة نرجّع null بهدوء ---
            try {
                BluetoothAdapter bt = BluetoothAdapter.getDefaultAdapter();
                result.put("bluetoothEnabled", bt != null && bt.isEnabled());
            } catch (SecurityException se) {
                result.put("bluetoothEnabled", (Object) null);
            } catch (Exception e) {
                result.put("bluetoothEnabled", (Object) null);
            }

            call.resolve(result);
        } catch (Exception e) {
            call.reject("تعذّرت قراءة معلومات الجهاز: " + e.getMessage());
        }
    }

    /** يقرأ من أول thermal_zone يعطي رقم منطقي (معظمها CPU بالأجهزة
     * الرخيصة/المتوسطة). يرجّع null لو ما قدر يقرأ شي — بدون ما يفشل
     * باقي البيانات. */
    private Double readCpuTemperature() {
        for (int i = 0; i < 12; i++) {
            String path = "/sys/class/thermal/thermal_zone" + i + "/temp";
            try (BufferedReader reader = new BufferedReader(new FileReader(path))) {
                String line = reader.readLine();
                if (line == null) continue;
                long raw = Long.parseLong(line.trim());
                double celsius = raw > 1000 ? raw / 1000.0 : raw;
                if (celsius > 0 && celsius < 150) return celsius;
            } catch (Exception ignored) {
                // zone مو موجودة أو ما نقدر نقرأها — نجرب التالية
            }
        }
        return null;
    }
}
