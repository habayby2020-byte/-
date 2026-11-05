# DeviceInfoPlugin — تركيب الإضافة

ملف Java جاهز بالكامل، لكنه **لم يُبنَ ولم يُختبر هنا** (لا إنترنت ولا Android Studio
بهذه البيئة). خطوات التركيب داخل مشروعك المفتوح بـ Android Studio:

1. انسخ `DeviceInfoPlugin.java` لنفس مجلد الحزمة اللي فيه
   `MiracastPresentationPlugin.java` (مثلاً `android/app/src/main/java/com/yourapp/`).
2. غيّر أول سطر `package com.yourapp;` لنفس اسم حزمتك الحقيقي (انسخه بالضبط من
   `MiracastPresentationPlugin.java` الموجود عندك فعلاً).
3. سجّل الإضافة في `MainActivity.java` (أو `MainActivity.kt`)، بنفس مكان تسجيل
   `MiracastPresentationPlugin`:

   ```java
   import com.yourapp.DeviceInfoPlugin;
   // ...
   registerPlugin(DeviceInfoPlugin.class);
   ```

4. ابنِ نسخة APK جديدة من Android Studio (Build → Build Bundle(s)/APK(s)).

بعد التركيب، `src/services/deviceInfo.ts` بيكتشف الإضافة تلقائياً
(`isDeviceInfoAvailable()`) وتظهر الأرقام الحقيقية (الرام/التخزين) في تبويب
"النظام والجهاز" بشاشة الإعدادات. قبل التركيب، الشاشة تعرض رسالة توضيحية
بدل الأرقام — التطبيق يشتغل عادي بدونها، هذي ميزة إضافية فقط.

لا علاقة لهذه الإضافة بنظام Miracast إطلاقاً — ملف منفصل، تسجيل منفصل،
صفر تعديل على `MiracastPresentationPlugin.java`.
