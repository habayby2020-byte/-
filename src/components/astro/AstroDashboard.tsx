import React, { useEffect, useState } from 'react';
import { ArrowRight, Battery, BatteryCharging, Bluetooth, Cpu, HardDrive, Package, Sun, Wifi, WifiOff } from 'lucide-react';
import { useWindowManager } from '../../context/WindowManagerContext';
import { launchInstalledAndroidApp } from '../../services/installedAndroidApps';
import { getDeviceInfo, isDeviceInfoAvailable, DeviceInfo } from '../../services/deviceInfo';

/**
 * شاشة "أسترو" — شاشة مستقلة لحالها تُفتح بالضغط على السداسي بالصفحة
 * الرئيسية. منفصلة كلياً عن "متجر التطبيقات" (لا بالاسم، لا بالشكل،
 * لا بالتصرف): هذي فخمة، فيها الوقت، الشحن، السطوع، وتطبيقاتك
 * المثبّتة بالنجمة — وما فيها بحث إطلاقاً.
 */
function StatTile({ icon, label, value, dim }: { icon: React.ReactNode; label: string; value: string; dim?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl astra-glass min-w-[84px]">
      <div className={dim ? 'text-white/25' : 'text-[var(--astra-accent)]'}>{icon}</div>
      <div className={`text-sm font-mono font-bold ${dim ? 'text-white/25' : 'text-white/90'}`}>{value}</div>
      <div className="text-[9px] text-white/35">{label}</div>
    </div>
  );
}

export const AstroDashboard: React.FC = () => {
  const { goBack, pinnedHomeApps, openApp, settings } = useWindowManager();
  const [now, setNow] = useState(new Date());
  const [info, setInfo] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);

  // كل ١٠ ثواني بس — بدون أي أنيميشن مستمر حولها.
  useEffect(() => {
    if (!isDeviceInfoAvailable()) return;
    let cancelled = false;
    const poll = () => getDeviceInfo().then(d => { if (!cancelled) setInfo(d); });
    poll();
    const t = setInterval(poll, 10000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' });

  const openPinned = (app: (typeof pinnedHomeApps)[number]) => {
    if (app.kind === 'core') openApp(app.id as any);
    else if (app.kind === 'discovered') openApp('installed', { title: app.name, icon: app.icon, entry: app.entry });
    else if (app.kind === 'android' && app.packageName) launchInstalledAndroidApp(app.packageName);
  };

  return (
    <div dir="rtl" className="fixed inset-0 astra-bg text-white overflow-hidden flex flex-col">
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(var(--astra-accent) 1px, transparent 1px), linear-gradient(90deg, var(--astra-accent) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />
      <div className="absolute inset-3 rounded-[28px] border border-white/[0.06] pointer-events-none" />

      {/* شريط علوي — رجوع فقط، بدون بحث إطلاقاً */}
      <div className="relative flex items-center gap-3 px-6 pt-6 pb-2 astra-fade-up">
        <button onClick={goBack} className="w-10 h-10 rounded-full astra-glass flex items-center justify-center hover:border-[var(--astra-accent)]/50 cursor-pointer">
          <ArrowRight className="w-5 h-5" />
        </button>
        <span className="text-sm font-bold text-[var(--astra-accent)] tracking-[0.2em]">ASTRO</span>
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center gap-8 px-6">
        {/* الوقت */}
        <div className="text-center astra-fade-up" style={{ animationDelay: '40ms' }}>
          <div className="text-6xl font-extrabold font-mono tracking-wide astra-glow-text leading-none">{timeStr}</div>
          <div className="text-sm text-white/40 mt-2">{dateStr}</div>
        </div>

        {/* الحالة — شحن/بطارية، سطوع، حرارة المعالج، رام/تخزين، واي فاي، بلوتوث */}
        <div className="flex flex-wrap items-center justify-center gap-3 astra-fade-up" style={{ animationDelay: '80ms' }}>
          <StatTile
            icon={info?.isCharging ? <BatteryCharging className="w-5 h-5" /> : <Battery className="w-5 h-5" />}
            label="الشحن"
            value={info && info.batteryPercent >= 0 ? `${info.batteryPercent}%` : '—'}
            dim={!info}
          />
          <StatTile icon={<Sun className="w-5 h-5" />} label="السطوع" value={`${settings.brightness}%`} />
          <StatTile icon={<Cpu className="w-5 h-5" />} label="حرارة المعالج" value={info?.cpuTempCelsius != null ? `${info.cpuTempCelsius.toFixed(0)}°` : '—'} dim={!info?.cpuTempCelsius} />
          <StatTile
            icon={<HardDrive className="w-5 h-5" />}
            label="الرام"
            value={info && info.totalRamMB > 0 ? `${Math.round(((info.totalRamMB - info.availRamMB) / info.totalRamMB) * 100)}%` : '—'}
            dim={!info}
          />
          <StatTile
            icon={info?.wifiEnabled ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            label="واي فاي"
            value={info?.wifiEnabled == null ? '—' : info.wifiEnabled ? 'متصل' : 'مطفي'}
            dim={info?.wifiEnabled == null}
          />
          <StatTile icon={<Bluetooth className="w-5 h-5" />} label="بلوتوث" value={info?.bluetoothEnabled == null ? '—' : info.bluetoothEnabled ? 'شغّال' : 'مطفي'} dim={info?.bluetoothEnabled == null} />
        </div>

        {/* تطبيقاتك المثبّتة هنا بالنجمة — بدون أي بحث */}
        <div className="w-full max-w-2xl astra-fade-up" style={{ animationDelay: '120ms' }}>
          {pinnedHomeApps.length > 0 ? (
            <div className="flex flex-wrap items-start justify-center gap-5">
              {pinnedHomeApps.map(app => (
                <button key={app.id} onClick={() => openPinned(app)} className="group flex flex-col items-center gap-2 cursor-pointer">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center group-hover:-translate-y-1.5 group-hover:border-[var(--astra-accent)]/50 transition-[transform,border-color] duration-150">
                    {app.icon ? <img src={app.icon} className="w-9 h-9 object-contain" alt="" /> : <Package className="w-7 h-7 text-[var(--astra-accent)]" />}
                  </div>
                  <span className="text-[10px] text-white/45 group-hover:text-white/80 max-w-[70px] truncate">{app.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center text-[11px] text-white/25">
              افتح متجر التطبيقات أو أندرويد واضغط ⭐ على أي تطبيق لتثبيته هنا
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
