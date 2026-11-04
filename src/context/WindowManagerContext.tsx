import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppId, Screen, SystemSettings, FileItem, SystemDiagnosticLog, InstalledApp } from '../types/os';
import { isMiracastAvailable } from '../cast/miracastBridge';

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

  // مجلد المشروع — "البيت" الافتراضي لكل شي تسويه بتطبيقات زي كاتب
  // الأكواد. معرّف ثابت (folder-project) عبر الجلسات، والاسم نفسه
  // يتحفظ محلياً بالجهاز (localStorage) — أول مرة بس تُسأل عن الاسم.
  readonly PROJECT_FOLDER_ID: string;
  projectFolderName: string;
  setupProjectFolder: (name: string) => void;

  // Apps auto-discovered from apps/ (drop a folder in, it shows up — see apps-scanner.mjs)
  installedApps: InstalledApp[];

  // تشخيص حقيقي — كل فحص يشتغل فعلياً على حالة النظام الحالية ويرجّع
  // نتيجة حقيقية (نجح/فشل)، مو رسالة ثابتة. runDiagnostics يشغّلهم
  // كلهم؛ reportAndHealError يبقى بس لعزل انهيارات الواجهة الحقيقية
  // (React error boundary) بدون أي ادّعاء "إصلاح تلقائي" كاذب.
  diagnosticLogs: SystemDiagnosticLog[];
  runDiagnostics: () => void;
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

const PROJECT_FOLDER_ID = 'folder-project';
const PROJECT_FOLDER_NAME_KEY = 'astro-project-folder-name';

export const WindowManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [screenStack, setScreenStack] = useState<Screen[]>([{ kind: 'home' }]);
  const screen = screenStack[screenStack.length - 1];

  // اسم مجلد المشروع — يرجع من localStorage لو سبق واتسوّى (عشان
  // folder-project يرجع يظهر بنفس الاسم كل جلسة، حتى إن نظام الملفات
  // نفسه بالذاكرة فقط ويصفر عند إعادة فتح التطبيق).
  const [projectFolderName, setProjectFolderName] = useState<string>(
    () => localStorage.getItem(PROJECT_FOLDER_NAME_KEY) || ''
  );

  const [settings, setSettings] = useState<SystemSettings>({
    theme: 'dark',
    wallpaper: 'linear-gradient(160deg, #04050c 0%, #0a1030 45%, #060814 100%)',
    volume: 75,
    brightness: 100,
    timeFormat24: false,
    customTimeOffsetMs: 0,
  });

  const [files, setFiles] = useState<FileItem[]>(() => {
    const savedName = localStorage.getItem(PROJECT_FOLDER_NAME_KEY);
    if (!savedName) return INITIAL_FILES;
    return [
      {
        id: PROJECT_FOLDER_ID,
        name: savedName,
        type: 'folder',
        parentId: null,
        location: 'this-pc',
        updatedAt: '2026/10/30',
      },
      ...INITIAL_FILES,
    ];
  });
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

  const pushDiagnosticLog = (log: Omit<SystemDiagnosticLog, 'id' | 'timestamp'>) => {
    setDiagnosticLogs(prev => [
      { ...log, id: `diag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: new Date().toLocaleTimeString('ar-SA') },
      ...prev.slice(0, 29),
    ]);
  };

  // خطأ واجهة حقيقي صار (React error boundary بـ AppFrame.tsx) —
  // التطبيق المعطوب يتعزل عن باقي النظام فعلياً (هذا سلوك React
  // الحقيقي، مو ادّعاء)، بس بدون أي زعم إنه "انصلح تلقائياً" —
  // ما صار أي إصلاح، بس عُزل الضرر.
  const reportAndHealError = (component: string, error: string, codeLine?: string) => {
    pushDiagnosticLog({
      component,
      error,
      codeLine: codeLine || 'غير معروف — افتح الكونسول لمزيد من التفاصيل',
      remedy: 'تم عزل الخطأ داخل هذا التطبيق فقط — باقي النظام ما تأثر، بدون أي إصلاح تلقائي حقيقي',
      status: 'monitoring',
    });
    setSystemNotification(`حدث خلل بتطبيق [${component}] وتم عزله عن باقي النظام.`);
    setTimeout(() => setSystemNotification(null), 5000);
  };

  // تشخيص حقيقي — كل عنصر هنا يشغّل فحص فعلي على حالة النظام الحالية
  // ويرجع نتيجة صادقة (نجح/فشل) مع سطر الخطأ الحقيقي لو فشل، بدل
  // رسالة "إصلاح ذاتي" ثابتة ما تتغيّر.
  const runDiagnostics = () => {
    const results: Omit<SystemDiagnosticLog, 'id' | 'timestamp'>[] = [];

    // ١) التخزين المحلي — كتابة وقراءة فعلية، مو افتراض.
    try {
      const probeKey = '__astro_diag_probe__';
      localStorage.setItem(probeKey, '1');
      const ok = localStorage.getItem(probeKey) === '1';
      localStorage.removeItem(probeKey);
      results.push({
        component: 'التخزين المحلي (localStorage)',
        error: ok ? 'لا توجد مشكلة' : 'القراءة رجعت قيمة مختلفة عن المكتوبة',
        codeLine: 'لا يوجد',
        remedy: ok ? 'يقرأ ويكتب بشكل سليم' : 'تحقق من إعدادات الخصوصية بالمتصفح/التطبيق',
        status: ok ? 'ok' : 'fail',
      });
    } catch (e) {
      const err = e as Error;
      results.push({
        component: 'التخزين المحلي (localStorage)',
        error: err.message || 'استثناء غير معروف',
        codeLine: err.stack?.split('\n')[1]?.trim() || 'غير متاح',
        remedy: 'غير متاح بهذا المتصفح/السياق الحالي',
        status: 'fail',
      });
    }

    // ٢) تكامل نظام الملفات الداخلي — كل ملف parentId له لازم يشاور
    // لمجلد موجود فعلاً، وإلا هذا عطب حقيقي بالبيانات.
    try {
      const folderIds = new Set(files.filter(f => f.type === 'folder').map(f => f.id));
      const orphan = files.find(f => f.parentId && !folderIds.has(f.parentId));
      results.push({
        component: 'نظام الملفات الداخلي',
        error: orphan ? `ملف "${orphan.name}" يشاور لمجلد غير موجود (${orphan.parentId})` : 'لا توجد مشكلة',
        codeLine: orphan ? 'src/context/WindowManagerContext.tsx → runDiagnostics' : 'لا يوجد',
        remedy: orphan ? 'احذف الملف اليتيم أو أعد ربطه من مستكشف الملفات' : `${files.length} عنصر، كلهم مرتبطين بشكل صحيح`,
        status: orphan ? 'fail' : 'ok',
      });
    } catch (e) {
      const err = e as Error;
      results.push({
        component: 'نظام الملفات الداخلي',
        error: err.message,
        codeLine: err.stack?.split('\n')[1]?.trim() || 'غير متاح',
        remedy: 'تعذّر فحص نظام الملفات',
        status: 'fail',
      });
    }

    // ٣) خدمة Cast/Miracast — حالة فعلية من الـ plugin نفسه، مو تخمين.
    const miracastOk = isMiracastAvailable();
    results.push({
      component: 'خدمة البث (Miracast)',
      error: miracastOk ? 'متاحة على هذا الجهاز' : 'غير متاحة (طبيعي لو تفتح هذا خارج تطبيق APK على التلفزيون)',
      codeLine: 'لا يوجد',
      remedy: miracastOk ? 'جاهزة للاستخدام' : 'شغّل الصفحة من داخل تطبيق Astro (APK) على التلفزيون عشان تتفعّل',
      status: 'ok',
    });

    // ٤) تطبيقات أندرويد المثبّتة — عدد حقيقي من آخر استجابة فعلية.
    results.push({
      component: 'تطبيقات أندرويد المثبّتة',
      error: `${installedApps.length} تطبيق مكتشف حالياً`,
      codeLine: 'لا يوجد',
      remedy: installedApps.length > 0 ? 'القائمة وصلت وتحدّثت بنجاح' : 'لو تتوقع تطبيقات ولا تظهر، تأكد إنك بنيت APK جديد بعد ربط الإضافة',
      status: 'ok',
    });

    // ٥) صحة إعدادات النظام — قيم فعلية خارج المدى المسموح = عطب حقيقي.
    const settingsOk = settings.volume >= 0 && settings.volume <= 100 && settings.brightness >= 0 && settings.brightness <= 100;
    results.push({
      component: 'إعدادات النظام',
      error: settingsOk ? 'لا توجد مشكلة' : `قيمة خارج المدى المسموح (volume=${settings.volume}, brightness=${settings.brightness})`,
      codeLine: settingsOk ? 'لا يوجد' : 'src/context/WindowManagerContext.tsx → SystemSettings',
      remedy: settingsOk ? 'كل القيم ضمن المدى الطبيعي (0-100)' : 'أعد ضبط الصوت/السطوع من الإعدادات',
      status: settingsOk ? 'ok' : 'fail',
    });

    results.forEach(pushDiagnosticLog);
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

  /** يصير يتنفّذ مرة وحدة بس — شاشة الإعداد الأولى (ProjectFolderSetup)
   * تستدعيه بعد ما المستخدم يكتب اسم مجلده. أي تطبيق بعدها (كاتب
   * الأكواد مثلاً) يحفظ تلقائياً جوا PROJECT_FOLDER_ID. */
  const setupProjectFolder = (name: string) => {
    const trimmed = name.trim() || 'مشروعي';
    localStorage.setItem(PROJECT_FOLDER_NAME_KEY, trimmed);
    setProjectFolderName(trimmed);
    setFiles(prev => {
      if (prev.some(f => f.id === PROJECT_FOLDER_ID)) {
        return prev.map(f => (f.id === PROJECT_FOLDER_ID ? { ...f, name: trimmed } : f));
      }
      return [
        { id: PROJECT_FOLDER_ID, name: trimmed, type: 'folder', parentId: null, location: 'this-pc', updatedAt: 'الآن' },
        ...prev,
      ];
    });
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
        PROJECT_FOLDER_ID,
        projectFolderName,
        setupProjectFolder,
        installedApps,
        diagnosticLogs,
        runDiagnostics,
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
