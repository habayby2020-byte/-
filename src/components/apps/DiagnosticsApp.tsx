import React, { useState } from 'react';
import { useWindowManager } from '../../context/WindowManagerContext';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  PlayCircle,
  SatelliteDish,
  XCircle,
} from 'lucide-react';

/**
 * تشخيص حقيقي — مو "إصلاح ذاتي" وهمي. زر "تشغيل التشخيص" يشغّل فحوصات
 * فعلية على حالة النظام الحالية (runDiagnostics بـ WindowManagerContext)
 * وتطلع النتيجة الحقيقية لكل فحص، بدون أي رسالة ثابتة مكررة.
 */
export const DiagnosticsApp: React.FC = () => {
  const { diagnosticLogs, runDiagnostics } = useWindowManager();
  const [running, setRunning] = useState(false);

  const handleRun = () => {
    setRunning(true);
    // تأخير بسيط فقط عشان يبين إنه "يشتغل" — الفحوصات نفسها حقيقية ومتزامنة.
    setTimeout(() => {
      runDiagnostics();
      setRunning(false);
    }, 250);
  };

  const passCount = diagnosticLogs.filter(l => l.status === 'ok').length;
  const failCount = diagnosticLogs.filter(l => l.status === 'fail').length;

  const StatusIcon = ({ status }: { status: 'ok' | 'fail' | 'monitoring' }) => {
    if (status === 'ok') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (status === 'fail') return <XCircle className="w-4 h-4 text-rose-500" />;
    return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans text-xs select-none">
      {/* Header Banner */}
      <div className="p-4 bg-blue-600/10 dark:bg-blue-950/40 border-b border-blue-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <SatelliteDish className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">تشخيص النظام</h2>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              فحوصات حقيقية على حالة النظام الحالية — تخزين، ملفات، بث،
              تطبيقات، إعدادات. كل نتيجة فعلية، مو رسالة ثابتة.
            </p>
          </div>
        </div>

        <button
          onClick={handleRun}
          disabled={running}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50 text-xs shadow-xs"
        >
          <PlayCircle className="w-3.5 h-3.5" />
          <span>{running ? 'جار الفحص...' : 'تشغيل التشخيص'}</span>
        </button>
      </div>

      {/* Status Metrics — أرقام حقيقية من آخر تشغيل */}
      <div className="grid grid-cols-3 gap-3 p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <div className="text-slate-500 text-[11px] mb-1">فحوصات ناجحة</div>
          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">{passCount}</div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <div className="text-slate-500 text-[11px] mb-1">مشاكل حقيقية مكتشفة</div>
          <div className="text-sm font-bold text-rose-600 dark:text-rose-400 font-mono">{failCount}</div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <div className="text-slate-500 text-[11px] mb-1">إجمالي السجلات</div>
          <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">{diagnosticLogs.length}</div>
        </div>
      </div>

      {/* Log History */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">سجل التشخيص:</span>
          <span className="text-[11px] text-slate-400">الأحدث فوق</span>
        </div>

        {diagnosticLogs.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-slate-400 space-y-2">
            <Activity className="w-8 h-8 opacity-40 text-blue-500" />
            <span>ما فيه أي فحص اتسوى بعد.</span>
            <span className="text-[11px] text-slate-500">اضغط "تشغيل التشخيص" بالأعلى عشان تشوف حالة النظام الحقيقية.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {diagnosticLogs.map(log => (
              <div
                key={log.id}
                className={`p-3 bg-white dark:bg-slate-800 rounded-xl border shadow-xs space-y-1.5 ${
                  log.status === 'fail' ? 'border-rose-300 dark:border-rose-900' : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={log.status} />
                    <span className="font-semibold text-slate-900 dark:text-white text-xs">{log.component}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300">{log.error}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-750">
                  <span className="font-mono text-slate-400 dir-ltr text-left truncate max-w-[55%]">{log.codeLine}</span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium truncate max-w-[45%] text-left">{log.remedy}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
