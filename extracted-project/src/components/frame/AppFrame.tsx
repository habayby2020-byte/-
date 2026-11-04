import React, { Component, ReactNode, ErrorInfo, useState } from 'react';
import { ArrowRight, AlertTriangle, Copy, Check, RotateCcw, Package } from 'lucide-react';
import { useWindowManager } from '../../context/WindowManagerContext';
import { AppId } from '../../types/os';
import { ExplorerIcon, BrowserIcon, SettingsIcon, NotepadIcon, CalculatorIcon, DiagnosticsIcon } from '../icons/WinIcons';
import { SettingsApp } from '../apps/SettingsApp';
import { FileExplorerApp } from '../apps/FileExplorerApp';
import { NotepadApp } from '../apps/NotepadApp';
import { CalculatorApp } from '../apps/CalculatorApp';
import { BrowserApp } from '../apps/BrowserApp';
import { DiagnosticsApp } from '../apps/DiagnosticsApp';
import { ImageViewerApp } from '../apps/ImageViewerApp';

const APP_TITLES: Record<AppId, string> = {
  settings: 'الإعدادات',
  explorer: 'الملفات',
  notepad: 'المفكرة',
  calculator: 'الحاسبة',
  browser: 'المتصفح',
  diagnostics: 'الإصلاح الذاتي',
  installed: 'تطبيق',
  imageviewer: 'عارض الصور',
};

function appIcon(appId: AppId, data?: any) {
  switch (appId) {
    case 'settings': return <SettingsIcon className="w-4 h-4" />;
    case 'explorer': return <ExplorerIcon className="w-4 h-4" />;
    case 'notepad': return <NotepadIcon className="w-4 h-4" />;
    case 'calculator': return <CalculatorIcon className="w-4 h-4" />;
    case 'browser': return <BrowserIcon className="w-4 h-4" />;
    case 'diagnostics': return <DiagnosticsIcon className="w-4 h-4" />;
    case 'installed':
      return data?.icon ? <img src={data.icon} className="w-4 h-4 rounded-sm object-contain" alt="" /> : <Package className="w-4 h-4" />;
    default: return <Package className="w-4 h-4" />;
  }
}

function generateErrorCode(message: string): string {
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    hash = (hash * 31 + message.charCodeAt(i)) >>> 0;
  }
  return `ASTRA-${hash.toString(16).toUpperCase().padStart(6, '0').slice(0, 6)}`;
}

/**
 * نافذة خطأ بأسلوب نظيف فخم (مو تحذير ويندوز الأزرق) — زر "نسخ كود
 * الخطأ" الصريح اللي طلبه المستخدم، يولّد كود قصير ثابت لنفس رسالة
 * الخطأ (نفس الخطأ = نفس الكود دايماً، يسهّل تتبعه).
 */
class AppErrorBoundary extends Component<
  { appTitle: string; onCatch: (error: Error, info: ErrorInfo) => void; children: ReactNode },
  { hasError: boolean; message: string; stackLine: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, message: '', stackLine: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message || 'خطأ غير معروف' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ stackLine: info.componentStack?.split('\n')[1]?.trim() ?? '' });
    this.props.onCatch(error, info);
  }

  handleRetry = () => this.setState({ hasError: false, message: '', stackLine: '' });

  render() {
    if (this.state.hasError) {
      return <ErrorDialog appTitle={this.props.appTitle} message={this.state.message} stackLine={this.state.stackLine} onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

const ErrorDialog: React.FC<{ appTitle: string; message: string; stackLine: string; onRetry: () => void }> = ({
  appTitle,
  message,
  stackLine,
  onRetry,
}) => {
  const [copied, setCopied] = useState(false);
  const code = generateErrorCode(message + stackLine);

  const handleCopy = () => {
    const text = `${code}\n${appTitle}: ${message}\n${stackLine}`;
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div dir="rtl" className="flex flex-col items-center justify-center h-full p-8 text-center astra-bg">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-white mb-1">حدث خلل في {appTitle}</h3>
      <p className="text-xs text-white/50 mb-4 max-w-sm">تم إيقاف هذا التطبيق مؤقتاً لحماية باقي النظام.</p>

      <div className="astra-glass rounded-xl p-3 mb-4 max-w-md w-full text-left dir-ltr">
        <div className="text-[10px] text-white/40 mb-1">كود الخطأ</div>
        <div className="font-mono text-sm text-[var(--astra-accent)] font-bold mb-2">{code}</div>
        <div className="text-[10px] text-white/30 font-mono break-all">{message}</div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-4 py-2 astra-glass hover:border-[var(--astra-accent)]/50 rounded-lg text-xs font-semibold cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'تم النسخ' : 'نسخ كود الخطأ'}</span>
        </button>
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-l from-[var(--astra-accent)] to-[var(--astra-accent-2)] text-slate-950 rounded-lg text-xs font-bold cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>إعادة المحاولة</span>
        </button>
      </div>
    </div>
  );
};

export const AppFrame: React.FC<{ appId: AppId; data?: any }> = ({ appId, data }) => {
  const { goBack, reportAndHealError } = useWindowManager();
  const title = appId === 'installed' && data?.title ? data.title : APP_TITLES[appId];

  const renderContent = () => {
    switch (appId) {
      case 'settings': return <SettingsApp />;
      case 'explorer': return <FileExplorerApp initialData={data} />;
      case 'notepad': return <NotepadApp initialData={data} />;
      case 'calculator': return <CalculatorApp />;
      case 'browser': return <BrowserApp />;
      case 'diagnostics': return <DiagnosticsApp />;
      case 'imageviewer': return <ImageViewerApp initialData={data} />;
      case 'installed':
        return data?.entry ? (
          <iframe src={data.entry} title={title} className="w-full h-full border-0 bg-white" />
        ) : (
          <div className="p-4 text-white/60">تعذّر العثور على ملفات هذا التطبيق</div>
        );
      default:
        return null;
    }
  };

  return (
    <div dir="rtl" className="fixed inset-0 astra-bg flex flex-col overflow-hidden astra-fade-up" style={{ animationDuration: '180ms' }}>
      <div className="flex items-center gap-3 px-5 h-14 shrink-0 astra-glass border-x-0 border-t-0">
        <button
          onClick={goBack}
          className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white cursor-pointer"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-white">
          {appIcon(appId, data)}
          <span className="text-sm font-semibold">{title}</span>
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative bg-white dark:bg-slate-900">
        <AppErrorBoundary
          appTitle={title}
          onCatch={(error, info) =>
            reportAndHealError(title, error.message, info.componentStack?.split('\n')[1]?.trim())
          }
        >
          {renderContent()}
        </AppErrorBoundary>
      </div>
    </div>
  );
};
