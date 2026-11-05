/**
 * كشف تلقائي: هل الجهاز اللي فتح الصفحة تلفاز أو جوال/كمبيوتر عادي.
 * نفس المنطق اللي ذكره المطوّر بالرسالة، منقول هنا حرفياً.
 */
export function detectIsSmartTv(): boolean {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') === 'tv' || params.get('device') === 'tv' || params.get('tv') === '1') {
    return true;
  }
  if (window.location.hash === '#tv') {
    return true;
  }

  if ((window as any).TvNativeBridge || (window as any).isAndroidTv) {
    return true;
  }

  const ua = (navigator.userAgent || navigator.vendor || (window as any).opera || '').toLowerCase();
  const tvPatterns = [
    'smart-tv', 'smarttv', 'googletv', 'google tv', 'android tv', 'androidtv',
    'tizen', 'webos', 'web0s', 'netcast', 'apple tv', 'appletv', 'firetv', 'fire tv',
    'aftt', 'aftm', 'aftb', 'afts', 'aftu', 'roku', 'viera', 'bravia', 'hisense',
    'philips', 'mitv', 'xiaomi tv', 'mi-box', 'crkey'
  ];

  for (const pattern of tvPatterns) {
    if (ua.includes(pattern)) {
      return true;
    }
  }

  return false;
}
