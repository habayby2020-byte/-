import React from 'react';
import { Image as ImageIcon, Wallpaper } from 'lucide-react';
import { useWindowManager } from '../../context/WindowManagerContext';

interface Props {
  initialData?: { fileId?: string; content?: string; fileName?: string };
}

/**
 * عارض بسيط للصور اللي توصل من الجوال (رفع صورة) أو أي صورة بالملفات
 * الافتراضية — بدون أي اعتماد على مكتبات خارجية، فقط <img> ملء
 * الشاشة + زر اختياري "اجعلها خلفية".
 */
export const ImageViewerApp: React.FC<Props> = ({ initialData }) => {
  const { updateSettings } = useWindowManager();
  const src = initialData?.content;

  if (!src) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
        <ImageIcon className="w-10 h-10 opacity-40" />
        <span className="text-xs">ما فيه صورة لعرضها</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-xs text-slate-300">
        <span className="truncate">{initialData?.fileName ?? 'صورة'}</span>
        <button
          onClick={() => updateSettings({ wallpaper: src })}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
        >
          <Wallpaper className="w-3.5 h-3.5" />
          <span>اجعلها خلفية</span>
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center overflow-hidden p-3">
        <img src={src} alt={initialData?.fileName ?? ''} className="max-w-full max-h-full object-contain rounded-lg" />
      </div>
    </div>
  );
};
