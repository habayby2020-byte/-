import React, { useEffect, useState } from 'react';
import { useWindowManager } from '../../context/WindowManagerContext';
import { getSavedAccount, clearAccount } from '../../services/auth';
import {
  Laptop,
  Palette,
  Layers,
  User,
  Clock,
  Sun,
  Moon,
  Check,
  Cpu,
  MemoryStick,
  HardDrive,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { getDeviceInfo, isDeviceInfoAvailable, compatibilityVerdict, DeviceInfo } from '../../services/deviceInfo';

const WALLPAPERS = [
  {
    id: 'astra-night',
    name: 'عالم آخر (الافتراضية)',
    url: 'linear-gradient(160deg, #04050c 0%, #0a1030 45%, #060814 100%)',
    isGradient: true,
  },
  {
    id: 'astra-violet',
    name: 'توهج بنفسجي',
    url: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #0f172a 100%)',
    isGradient: true,
  },
  {
    id: 'astra-teal',
    name: 'أورورا فيروزية',
    url: 'linear-gradient(135deg, #022c22 0%, #0e7490 50%, #0f172a 100%)',
    isGradient: true,
  },
  {
    id: 'astra-rose',
    name: 'شفق وردي',
    url: 'linear-gradient(135deg, #1e293b 0%, #4c0519 60%, #0f172a 100%)',
    isGradient: true,
  },
];

export const SettingsApp: React.FC = () => {
  const { settings, updateSettings, installedApps } = useWindowManager();
  const [activeTab, setActiveTab] = useState<'system' | 'personalization' | 'apps' | 'account' | 'time'>('personalization');
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const account = getSavedAccount();

  useEffect(() => {
    if (activeTab === 'system' && isDeviceInfoAvailable() && !deviceInfo) {
      getDeviceInfo().then(setDeviceInfo);
    }
  }, [activeTab, deviceInfo]);

  const verdict = deviceInfo ? compatibilityVerdict(deviceInfo) : null;

  return (
    <div dir="rtl" className="flex h-full astra-bg text-white font-sans overflow-hidden select-text text-sm">
      {/* Sidebar Navigation */}
      <div className="w-56 border-l border-white/10 bg-black/20 p-3 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 p-2 mb-4 astra-glass rounded-lg">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--astra-accent)] to-[var(--astra-accent-2)] text-slate-950 font-bold flex items-center justify-center shrink-0 text-sm">
              {(account?.name ?? 'أ').trim().charAt(0)}
            </div>
            <div className="truncate">
              <div className="font-semibold text-xs text-white truncate">{account?.name ?? 'المستخدم'}</div>
              <div className="text-[11px] text-white/40">حساب محلي على هذا الجوال</div>
            </div>
          </div>

          <div className="space-y-1">
            {([
              { id: 'personalization', label: 'التخصيص', icon: Palette },
              { id: 'system', label: 'النظام والجهاز', icon: Laptop },
              { id: 'apps', label: 'التطبيقات', icon: Layers },
              { id: 'account', label: 'الحساب', icon: User },
              { id: 'time', label: 'الوقت واللغة', icon: Clock },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-right cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-l from-[var(--astra-accent)] to-[var(--astra-accent-2)] text-slate-950 font-bold'
                    : 'text-white/60 hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="text-[11px] text-white/30 p-2 text-center">ASTRO OS</div>
      </div>

      {/* Main Content Viewport */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Personalization Tab */}
        {activeTab === 'personalization' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">التخصيص</h2>
              <p className="text-xs text-white/40">تخصيص المظهر والخلفيات والوضع الليلي للنظام.</p>
            </div>

            <div className="relative h-44 rounded-xl overflow-hidden border border-white/10 shadow-md">
              {settings.wallpaper.startsWith('linear-gradient') ? (
                <div style={{ background: settings.wallpaper }} className="w-full h-full" />
              ) : (
                <img src={settings.wallpaper} alt="خلفية سطح المكتب" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <div className="text-white">
                  <div className="text-sm font-semibold">الخلفية النشطة</div>
                </div>
              </div>
            </div>

            <div className="astra-glass p-4 rounded-xl space-y-3">
              <h3 className="text-sm font-semibold text-white">اختر خلفية</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {WALLPAPERS.map(wp => (
                  <button
                    key={wp.id}
                    onClick={() => updateSettings({ wallpaper: wp.url })}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all p-0.5 text-right cursor-pointer ${
                      settings.wallpaper === wp.url ? 'border-[var(--astra-accent)]' : 'border-transparent hover:border-white/20'
                    }`}
                  >
                    <div className="h-20 w-full rounded overflow-hidden bg-slate-800">
                      <div style={{ background: wp.url }} className="w-full h-full" />
                    </div>
                    <div className="p-1.5 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-white/70 truncate">{wp.name}</span>
                      {settings.wallpaper === wp.url && <Check className="w-3.5 h-3.5 text-[var(--astra-accent)] shrink-0" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="astra-glass p-4 rounded-xl flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">المظهر</h3>
                <p className="text-xs text-white/40">التبديل بين السمة الفاتحة والداكنة.</p>
              </div>
              <div className="flex items-center gap-1 bg-black/30 p-1 rounded-lg">
                <button
                  onClick={() => updateSettings({ theme: 'light' })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    settings.theme === 'light' ? 'bg-white text-slate-900' : 'text-white/50'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>فاتح</span>
                </button>
                <button
                  onClick={() => updateSettings({ theme: 'dark' })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    settings.theme === 'dark' ? 'bg-white/10 text-white' : 'text-white/50'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>داكن</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* System / Device Tab — real RAM + storage check from the phone */}
        {activeTab === 'system' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">النظام والجهاز</h2>
              <p className="text-xs text-white/40">مواصفات الجوال الفعلية اللي شغّال عليه ASTRO.</p>
            </div>

            <div className="astra-glass p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-white">سطوع الشاشة</span>
                </div>
                <span className="text-xs font-mono text-white/50">{settings.brightness}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={settings.brightness}
                onChange={e => updateSettings({ brightness: Number(e.target.value) })}
                className="w-full accent-[var(--astra-accent)] cursor-pointer"
              />
            </div>

            {!isDeviceInfoAvailable() && (
              <div className="astra-glass p-4 rounded-xl text-xs text-white/50 leading-relaxed">
                قراءة الرام والتخزين الحقيقية تحتاج إضافة Java جديدة (DeviceInfoPlugin) ضمن
                نسخة APK مبنية بـ Android Studio — الكود جاهز، شوف
                android-device-info-bridge/README.md.
              </div>
            )}

            {isDeviceInfoAvailable() && !deviceInfo && (
              <div className="astra-glass p-4 rounded-xl text-xs text-white/40 text-center">جارٍ القراءة من النظام...</div>
            )}

            {deviceInfo && (
              <div className="astra-glass p-5 rounded-xl space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[var(--astra-accent)]" />
                  <span>مواصفات الجهاز الحقيقية</span>
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-black/20 rounded-lg">
                    <span className="text-white/40 block mb-1 flex items-center gap-1">
                      <MemoryStick className="w-3 h-3" /> الذاكرة (RAM)
                    </span>
                    <span className="font-semibold text-white font-mono">
                      {(deviceInfo.totalRamMB / 1024).toFixed(1)} GB
                    </span>
                  </div>
                  <div className="p-2.5 bg-black/20 rounded-lg">
                    <span className="text-white/40 block mb-1 flex items-center gap-1">
                      <HardDrive className="w-3 h-3" /> مساحة متاحة
                    </span>
                    <span className="font-semibold text-white font-mono">
                      {(deviceInfo.freeStorageMB / 1024).toFixed(1)} GB
                    </span>
                  </div>
                  <div className="p-2.5 bg-black/20 rounded-lg">
                    <span className="text-white/40 block mb-1">موديل الجهاز</span>
                    <span className="font-semibold text-white">{deviceInfo.model}</span>
                  </div>
                  <div className="p-2.5 bg-black/20 rounded-lg">
                    <span className="text-white/40 block mb-1">إصدار أندرويد</span>
                    <span className="font-semibold text-white">{deviceInfo.androidVersion}</span>
                  </div>
                </div>

                {verdict && (
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                      verdict.ok ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-300' : 'bg-amber-950/50 border border-amber-800 text-amber-300'
                    }`}
                  >
                    {verdict.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    <span>{verdict.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Apps Tab — the REAL apps dropped in apps-inbox/apps, not a fake list */}
        {activeTab === 'apps' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">التطبيقات المثبتة</h2>
              <p className="text-xs text-white/40">كل تطبيق تحطه بمجلد apps-inbox يظهر هنا تلقائياً.</p>
            </div>

            {installedApps.length === 0 ? (
              <div className="astra-glass rounded-xl p-6 text-center space-y-2">
                <Package className="w-8 h-8 mx-auto text-white/30" />
                <p className="text-xs text-white/40">ما فيه تطبيقات مضافة بعد. ضيف ملف في apps-inbox وشغّل الأداة.</p>
              </div>
            ) : (
              <div className="astra-glass rounded-xl divide-y divide-white/10 text-xs">
                {installedApps.map(app => (
                  <div key={app.id} className="p-3.5 flex items-center gap-3">
                    {app.icon ? (
                      <img src={app.icon} className="w-8 h-8 rounded-lg object-contain" alt="" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-black/30 flex items-center justify-center">
                        <Package className="w-4 h-4 text-white/40" />
                      </div>
                    )}
                    <div className="font-semibold text-white flex-1">{app.name}</div>
                    <span className="px-2.5 py-1 bg-[var(--astra-accent)]/10 text-[var(--astra-accent)] rounded text-[11px] font-medium">
                      apps-inbox
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">الحساب</h2>
              <p className="text-xs text-white/40">حساب محلي بسيط محفوظ على هذا الجوال فقط (بدون تشفير حقيقي).</p>
            </div>

            <div className="astra-glass p-5 rounded-xl flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--astra-accent)] to-[var(--astra-accent-2)] text-slate-950 font-bold text-2xl flex items-center justify-center shrink-0">
                {(account?.name ?? 'أ').trim().charAt(0)}
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="text-base font-bold text-white">{account?.name ?? 'المستخدم'}</h3>
                <p className="text-xs text-white/40">حساب محلي · محفوظ في تخزين الجوال</p>
              </div>
              <button
                onClick={() => {
                  clearAccount();
                  window.location.reload();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs font-semibold cursor-pointer hover:bg-rose-950/80"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>تسجيل خروج</span>
              </button>
            </div>
          </div>
        )}

        {/* Time and Language Tab */}
        {activeTab === 'time' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">الوقت واللغة</h2>
              <p className="text-xs text-white/40">إعدادات المنطقة الزمنية واللغة والاتجاه.</p>
            </div>

            <div className="astra-glass p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">لغة العرض</span>
                <span className="font-semibold text-[var(--astra-accent)]">العربية</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">اتجاه الواجهة</span>
                <span className="text-white/60">من اليمين إلى اليسار (RTL)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">صيغة الوقت</span>
                <div className="flex items-center gap-1 bg-black/30 p-1 rounded-lg">
                  <button
                    onClick={() => updateSettings({ timeFormat24: true })}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer ${
                      settings.timeFormat24 ? 'bg-white/10 text-white' : 'text-white/40'
                    }`}
                  >
                    24 ساعة
                  </button>
                  <button
                    onClick={() => updateSettings({ timeFormat24: false })}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer ${
                      !settings.timeFormat24 ? 'bg-white/10 text-white' : 'text-white/40'
                    }`}
                  >
                    12 ساعة
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
