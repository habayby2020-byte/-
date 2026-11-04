/**
 * دخول محلي بسيط: اسم + رمز سري يُحفظ على نفس الجهاز (localStorage)
 * بدون أي تشفير حقيقي وبدون حساب أونلاين — بوابة دخول محلية بس، مستخدم
 * واحد (أنت). هذا مقصود وبسيط بناءً على طلبك — مو نظام حماية حقيقي.
 *
 * ملاحظة مهمة عن مكان الحفظ: شاشة التلفزيون (#tv) وشاشة تحكم الجوال
 * يشتغلون من نفس تطبيق أندرويد (نفس الـ APK) على نفس جهازك — التلفزيون
 * بس "عرض" (Presentation) يرسمه نفس الجهاز، مو جهاز منفصل له تخزينه
 * الخاص. فـ localStorage هنا فعلياً محفوظ بذاكرة جوالك (ملفات التطبيق
 * المحلية)، ويضل موجود حتى لو انقطع الاتصال بالتلفزيون أو انسكرت
 * الشاشة الثانية وأُعيد فتحها.
 */

const KEY = 'astra-auth-v1';

export interface AstroAccount {
  name: string;
  pin: string;
}

export function getSavedAccount(): AstroAccount | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.name === 'string' && typeof parsed.pin === 'string') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveAccount(account: AstroAccount): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(account));
  } catch {
    // تخزين غير متاح (وضع خاص مثلاً) — نتجاهل بهدوء، تسجيل الدخول يضل
    // يشتغل لهذه الجلسة، بس ما يُحفظ للمرة الجاية.
  }
}

export function clearAccount(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // تجاهل
  }
}
