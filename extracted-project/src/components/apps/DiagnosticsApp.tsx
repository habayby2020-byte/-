import React, { useState } from 'react';
import { useWindowManager } from '../../context/WindowManagerContext';
import {
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Cpu,
  Terminal,
  Bug
} from 'lucide-react';

export const DiagnosticsApp: React.FC = () => {
  const { diagnosticLogs, reportAndHealError } = useWindowManager();
  const [testSimulating, setTestSimulating] = useState(false);

  const handleSimulateError = () => {
    setTestSimulating(true);
    setTimeout(() => {
      reportAndHealError(
        'AudioOutputService',
        'StateSyncError: Audio buffer latency mismatch in AudioDriver',
        'src/components/tray/QuickSettingsPopup.tsx:48'
      );
      setTestSimulating(false);
    }, 400);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans text-xs select-none">
      {/* Header Banner */}
      <div className="p-4 bg-emerald-600/10 dark:bg-emerald-950/40 border-b border-emerald-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>نظام التشخيص والصيانة الذاتية (Self-Healing)</span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">
                نشط ويعمل
              </span>
            </h2>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              المراقبة المستمرة لمكونات النظام ومعالجة الأخطاء والقلتشات فورياً واستعادة النسخة المستقرة تلقائياً.
            </p>
          </div>
        </div>

        <button
          onClick={handleSimulateError}
          disabled={testSimulating}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50 text-xs shadow-xs"
        >
          <Bug className="w-3.5 h-3.5" />
          <span>{testSimulating ? 'جار الرصد...' : 'اختبار الإصلاح الذاتي'}</span>
        </button>
      </div>

      {/* Status Metrics */}
      <div className="grid grid-cols-3 gap-3 p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <div className="text-slate-500 text-[11px] mb-1">حالة الواجهة</div>
          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>مستقرة وسليمة</span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <div className="text-slate-500 text-[11px] mb-1">عمليات الإصلاح التلقائي</div>
          <div className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">
            {diagnosticLogs.length} عملية ناجحة
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <div className="text-slate-500 text-[11px] mb-1">زمن الاستجابة الذاتي</div>
          <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">
            &lt; 50ms (فوري)
          </div>
        </div>
      </div>

      {/* Log History */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
            سجل رصد الأعطال والإصلاحات الذاتية:
          </span>
          <span className="text-[11px] text-slate-400">
            تحديث فوري
          </span>
        </div>

        {diagnosticLogs.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-slate-400 space-y-2">
            <Activity className="w-8 h-8 opacity-40 text-emerald-500" />
            <span>لم يتم تسجيل أي تعطل. جميع المكونات تعمل بشكل سليم.</span>
            <span className="text-[11px] text-slate-500">يمكنك الضغط على "اختبار الإصلاح الذاتي" بالأعلى لتجربة الرصد والمعالجة.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {diagnosticLogs.map(log => (
              <div
                key={log.id}
                className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded text-[10px] font-mono">
                      {log.component}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white text-xs">
                      {log.error}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-750">
                  <span className="font-mono text-slate-400 dir-ltr text-left">
                    الكود: {log.codeLine}
                  </span>
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{log.remedy}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
