/**
 * اختيار صورة من معرض الجوال (أو الكاميرا) عبر @capacitor/camera، على
 * جهاز التحكم (الجوال) فقط. يرجع data URL مضغوط (عرض أقصى 1280px،
 * جودة 70%) عشان الحجم يضل معقول لإرساله كأمر Cast واحد. يحتاج إضافة
 * الحزمة فعلياً (`npm install @capacitor/camera && npx cap sync`) —
 * موثّق بـ README.md.
 */

export function isPhotoPickerAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as any).Capacitor;
  return !!(cap?.isNativePlatform?.() && cap?.Plugins?.Camera);
}

export async function pickPhotoDataUrl(): Promise<{ dataUrl: string; name: string } | null> {
  if (typeof window === 'undefined') return null;
  const cap = (window as any).Capacitor;
  const Camera = cap?.Plugins?.Camera;
  if (!Camera) return null;

  try {
    const photo = await Camera.getPhoto({
      resultType: 'dataUrl',
      source: 'PROMPT', // يعطي خيار "الكاميرا" أو "المعرض"
      quality: 70,
      width: 1280,
      allowEditing: false,
    });
    if (!photo?.dataUrl) return null;
    const ext = photo.format ? `.${photo.format}` : '.jpg';
    return { dataUrl: photo.dataUrl, name: `صورة-${Date.now()}${ext}` };
  } catch {
    // المستخدم ألغى الاختيار أو رفض صلاحية الوصول — تجاهل بهدوء.
    return null;
  }
}
