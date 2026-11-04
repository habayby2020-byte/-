# InstalledAppsPlugin — تركيب الإضافة

ملف Java جاهز بالكامل، لكنه **لم يُبنَ ولم يُختبر هنا** (لا إنترنت ولا Android
Studio بهذه البيئة). خطوات التركيب داخل مشروعك المفتوح بـ Android Studio:

1. انسخ `InstalledAppsPlugin.java` لنفس مجلد الحزمة اللي فيه
   `MiracastPresentationPlugin.java` (مثلاً `android/app/src/main/java/com/yourapp/`).
2. غيّر أول سطر `package com.yourapp;` لنفس اسم حزمتك الحقيقي (انسخه بالضبط من
   `MiracastPresentationPlugin.java` الموجود عندك فعلاً).
3. سجّل الإضافة في `MainActivity.java` (أو `MainActivity.kt`)، بنفس مكان تسجيل
   `MiracastPresentationPlugin`:

   ```java
   import com.yourapp.InstalledAppsPlugin;
   // ...
   registerPlugin(InstalledAppsPlugin.class);
   ```

4. **مهم لأندرويد 11 فأعلى**: أضف هذا داخل `<manifest>` بملف
   `android/app/src/main/AndroidManifest.xml` (خارج `<application>`)، وإلا
   `queryIntentActivities` بيرجع قائمة فاضية بسبب Package Visibility:

   ```xml
   <queries>
       <intent>
           <action android:name="android.intent.action.MAIN" />
           <category android:name="android.intent.category.LAUNCHER" />
       </intent>
   </queries>
   ```

5. ابنِ نسخة APK جديدة من Android Studio (Build → Build Bundle(s)/APK(s)).

بعد التركيب، `src/services/installedAndroidApps.ts` بيكتشف الإضافة تلقائياً
(`isInstalledAppsAvailable()`) وتظهر تطبيقاتك الحقيقية (جوجل، كروم، الألعاب...)
بشاشة "تطبيقات أندرويد" على التلفزيون، مع إمكانية فتح أي واحد منها بالضغط
عليه. قبل التركيب، الشاشة تعرض رسالة توضيحية بدل القائمة — التطبيق يشتغل
عادي بدونها، هذي ميزة إضافية فقط.

لا علاقة لهذه الإضافة بنظام Miracast إطلاقاً — ملف منفصل، تسجيل منفصل،
صفر تعديل على `MiracastPresentationPlugin.java`.
