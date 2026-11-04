export type AppId =
  | 'settings'
  | 'explorer'
  | 'notepad'
  | 'calculator'
  | 'browser'
  | 'diagnostics'
  | 'installed'
  | 'imageviewer'
  | 'codeeditor';

/** One app auto-discovered from the apps/ folder — no code edit needed to add one. */
/** تطبيق مثبّت بالصفحة الرئيسية — يختاره المستخدم بنفسه من "كل
 * التطبيقات" أو "تطبيقات أندرويد"، بكل المعلومات اللازمة لعرضه
 * وفتحه مباشرة من الصفحة الرئيسية بدون أي بحث إضافي. */
export interface PinnedHomeApp {
  id: string;
  name: string;
  icon: string | null;
  kind: 'core' | 'discovered' | 'android';
  // discovered: رابط الملف (entry). android: اسم الحزمة (packageName).
  entry?: string;
  packageName?: string;
}

export interface InstalledApp {
  id: string;
  name: string;
  icon: string | null;
  entry: string;
}

/**
 * واجهة واحدة في كل مرة (زي أي لانشر تلفزيون) بدل نوافذ ويندوز
 * متراكبة — screenStack في WindowManagerContext هو مصدر الحقيقة،
 * وهذا النوع يوصف عنصر واحد فيه.
 */
export type Screen =
  | { kind: 'home' }
  | { kind: 'apps-grid' }
  | { kind: 'android-apps' }
  | { kind: 'app'; appId: AppId; data?: any };

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  location?: 'this-pc' | 'network' | 'recycle' | 'documents';
  /** 'image' = content هو data URL لصورة (مثلاً وصلت من رفع صورة بالجوال). افتراضي 'text'. */
  contentType?: 'text' | 'image';
  content?: string;
  size?: string;
  updatedAt: string;
}

export interface SystemSettings {
  theme: 'light' | 'dark';
  wallpaper: string;
  volume: number;
  brightness: number;
  timeFormat24: boolean;
  customTimeOffsetMs: number;
}

export interface SystemDiagnosticLog {
  id: string;
  timestamp: string;
  component: string;
  error: string;
  codeLine?: string;
  remedy: string;
  // ok = فحص حقيقي اجتاز بنجاح · fail = فحص حقيقي اكتشف مشكلة فعلية ·
  // monitoring = خطأ واجهة حقيقي انعزل داخل تطبيقه (بدون أي ادّعاء "إصلاح تلقائي" غير حقيقي).
  status: 'ok' | 'fail' | 'monitoring';
}
