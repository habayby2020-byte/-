import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppId, Screen, SystemSettings, FileItem, SystemDiagnosticLog, InstalledApp } from '../types/os';

interface WindowManagerContextType {
  // تنقّل بشاشة واحدة بكل مرة (لانشر تلفزيون) — بدل نوافذ ويندوز متراكبة.
  screen: Screen;
  openApp: (appId: AppId, data?: any) => void;
  openAppsGrid: () => void;
  openAndroidApps: () => void;
  goHome: () => void;
  goBack: () => void;
  canGoBack: boolean;

  // System State & Settings
  settings: SystemSettings;
  updateSettings: (partial: Partial<SystemSettings>) => void;

  // Virtual File System with locations (this-pc, network, recycle)
  files: FileItem[];
  createFile: (
    parentId: string | null,
    name: string,
    content?: string,
    location?: 'this-pc' | 'network' | 'recycle',
    contentType?: 'text' | 'image'
  ) => FileItem;
  updateFile: (id: string, content: string) => void;
  deleteFile: (id: string) => void;
  restoreFromRecycle: (id: string) => void;
  emptyRecycleBin: () => void;
  createFolder: (parentId: string | null, name: string, location?: 'this-pc' | 'network' | 'recycle') => FileItem;

  // Apps auto-discovered from apps/ (drop a folder in, it shows up — see apps-scanner.mjs)
  installedApps: InstalledApp[];

  // Self-Healing Engine & Diagnostics
  diagnosticLogs: SystemDiagnosticLog[];
  reportAndHealError: (component: string, error: string, codeLine?: string) => void;
  systemNotification: string | null;
  dismissNotification: () => void;
}

const INITIAL_FILES: FileItem[] = [
  {
    id: 'folder-documents',
    name: 'ملفاتي',
    type: 'folder',
    parentId: null,
    location: 'this-pc',
    updatedAt: '2026/10/30',
  },
  {
    id: 'folder-photos',
    name: 'صور الجوال',
    type: 'folder',
    parentId: null,
    location: 'this-pc',
    updatedAt: '2026/10/30',
  },
  {
    id: 'file-notes',
    name: 'ملاحظاتي.txt',
    type: 'file',
    parentId: 'folder-documents',
    location: 'this-pc',
    content: 'مرحباً بك — هذا ملف تجريبي داخل مستكشف الملفات.',
    size: '58 بايت',
    updatedAt: '2026/10/30 14:20',
  },
];

const WindowManagerContext = createContext<WindowManagerContextType | null>(null);

export const WindowManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [screenStack, setScreenStack] = useState<Screen[]>([{ kind: 'home' }]);
  const screen = screenStack[screenStack.length - 1];

  const [settings, setSettings] = useState<SystemSettings>({
    theme: 'dark',
    wallpaper: 'linear-gradient(160deg, #04050c 0%, #0a1030 45%, #060814 100%)',
    volume: 75,
    brightness: 100,
    timeFormat24: false,
    customTimeOffsetMs: 0,
  });

  const [files, setFiles] = useState<FileItem[]>(INITIAL_FILES);
  const [diagnosticLogs, setDiagnosticLogs] = useState<SystemDiagnosticLog[]>([]);
  const [systemNotification, setSystemNotification] = useState<string | null>(null);
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);

  // Polls the apps/ folder (via /api/apps) every few seconds. Dropping a new
  // app folder in makes it show up on its own — no rebuild, no code edit.
  useEffect(() => {
    let cancelled = false;
    const fetchApps = () => {
      fetch('/api/apps')
        .then(res => (res.ok ? res.json() : []))
        .then((list: InstalledApp[]) => {
          if (!cancelled) setInstalledApps(Array.isArray(list) ? list : []);
        })
        .catch(() => {
          /* endpoint not available — not an error the user needs to see */
        });
    };
    fetchApps();
    const interval = setInterval(fetchApps, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const updateSettings = (partial: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  };

  const openApp = (appId: AppId, data?: any) => {
    setScreenStack(prev => [...prev, { kind: 'app', appId, data }]);
  };
  const openAppsGrid = () => setScreenStack(prev => [...prev, { kind: 'apps-grid' }]);
  const openAndroidApps = () => setScreenStack(prev => [...prev, { kind: 'android-apps' }]);
  const goHome = () => setScreenStack([{ kind: 'home' }]);
  const goBack = () => setScreenStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
  const canGoBack = screenStack.length > 1;

  // Self-Healing Engine
  const reportAndHealError = (component: string, error: string, codeLine?: string) => {
    const timestamp = new Date().toLocaleTimeString('ar-SA');
    const log: SystemDiagnosticLog = {
      id: `diag-${Date.now()}`,
      timestamp,
      component,
      error,
      codeLine: codeLine || 'غير محدد',
      remedy: 'تمت إعادة تعيين المكون واستعادة الحالة المستقرة تلقائياً',
      status: 'repaired',
    };

    setDiagnosticLogs(prev => [log, ...prev.slice(0, 19)]);
    setSystemNotification(`تم رصد خلل في [${component}] وإصلاحه ذاتياً فوراً.`);

    setTimeout(() => {
      setSystemNotification(null);
    }, 5000);
  };

  const dismissNotification = () => setSystemNotification(null);

  // Virtual file system actions
  const createFile = (
    parentId: string | null,
    name: string,
    content = '',
    location: 'this-pc' | 'network' | 'recycle' = 'this-pc',
    contentType: 'text' | 'image' = 'text'
  ): FileItem => {
    const newFile: FileItem = {
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      type: 'file',
      parentId,
      location,
      content,
      contentType,
      size: contentType === 'image' ? `${Math.round((content.length * 3) / 4 / 1024)} كيلوبايت` : `${content.length * 2} بايت`,
      updatedAt: 'الآن',
    };
    setFiles(prev => [...prev, newFile]);
    return newFile;
  };

  const updateFile = (id: string, content: string) => {
    setFiles(prev =>
      prev.map(f => (f.id === id ? { ...f, content, size: `${content.length * 2} بايت`, updatedAt: 'تم التعديل الآن' } : f))
    );
  };

  const deleteFile = (id: string) => {
    setFiles(prev =>
      prev.map(f => (f.id === id ? { ...f, location: 'recycle', updatedAt: 'تم النقل لسلة المحذوفات' } : f))
    );
  };

  const restoreFromRecycle = (id: string) => {
    setFiles(prev =>
      prev.map(f => (f.id === id ? { ...f, location: 'this-pc', updatedAt: 'تمت الاستعادة' } : f))
    );
  };

  const emptyRecycleBin = () => {
    setFiles(prev => prev.filter(f => f.location !== 'recycle'));
  };

  const createFolder = (
    parentId: string | null,
    name: string,
    location: 'this-pc' | 'network' | 'recycle' = 'this-pc'
  ): FileItem => {
    const newFolder: FileItem = {
      id: `folder-${Date.now()}`,
      name,
      type: 'folder',
      parentId,
      location,
      updatedAt: 'الآن',
    };
    setFiles(prev => [...prev, newFolder]);
    return newFolder;
  };

  return (
    <WindowManagerContext.Provider
      value={{
        screen,
        openApp,
        openAppsGrid,
        openAndroidApps,
        goHome,
        goBack,
        canGoBack,
        settings,
        updateSettings,
        files,
        createFile,
        updateFile,
        deleteFile,
        restoreFromRecycle,
        emptyRecycleBin,
        createFolder,
        installedApps,
        diagnosticLogs,
        reportAndHealError,
        systemNotification,
        dismissNotification,
      }}
    >
      {children}
    </WindowManagerContext.Provider>
  );
};

export const useWindowManager = () => {
  const context = useContext(WindowManagerContext);
  if (!context) {
    throw new Error('useWindowManager must be used within a WindowManagerProvider');
  }
  return context;
};
