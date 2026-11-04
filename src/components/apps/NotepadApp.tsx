import React, { useState, useEffect } from 'react';
import { useWindowManager } from '../../context/WindowManagerContext';
import { Save, Download, FilePlus, Check } from 'lucide-react';

interface NotepadAppProps {
  initialData?: {
    fileId?: string;
    initialContent?: string;
    fileName?: string;
  };
}

export const NotepadApp: React.FC<NotepadAppProps> = ({ initialData }) => {
  const { updateFile, createFile } = useWindowManager();
  const [content, setContent] = useState(initialData?.initialContent || 'أهلاً بك في المفكرة.\nاكتب ما تشاء هنا...');
  const [fileName, setFileName] = useState(initialData?.fileName || 'مستند بدون عنوان.txt');
  const [fileId, setFileId] = useState<string | null>(initialData?.fileId || null);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    if (initialData?.initialContent !== undefined) {
      setContent(initialData.initialContent);
    }
    if (initialData?.fileName) {
      setFileName(initialData.fileName);
    }
    if (initialData?.fileId) {
      setFileId(initialData.fileId);
    }
  }, [initialData]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    updateCursor(e.target);
  };

  const updateCursor = (textarea: HTMLTextAreaElement) => {
    const textBeforeCursor = textarea.value.substring(0, textarea.selectionStart);
    const lines = textBeforeCursor.split('\n');
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1,
    });
  };

  const handleSave = () => {
    if (fileId) {
      updateFile(fileId, content);
      setSaveStatus('تم الحفظ في مستكشف الملفات');
    } else {
      const newFile = createFile(null, fileName, content);
      setFileId(newFile.id);
      setSaveStatus('تم إنشاء الملف وحفظه بنجاح');
    }
    setTimeout(() => setSaveStatus(null), 2500);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.txt') ? fileName : `${fileName}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setSaveStatus('تم تحميل الملف إلى جهازك');
    setTimeout(() => setSaveStatus(null), 2500);
  };

  const handleNewFile = () => {
    setContent('');
    setFileName('مستند جديد.txt');
    setFileId(null);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans text-xs select-none">
      {/* Notepad Menu Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-2.5 py-1 rounded hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer font-medium"
            title="حفظ في النظام"
          >
            <Save className="w-3.5 h-3.5 text-blue-600" />
            <span>حفظ</span>
          </button>

          <button
            onClick={handleDownloadTxt}
            className="flex items-center gap-1 px-2.5 py-1 rounded hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer font-medium"
            title="تنزيل كملف نصي حقيقي على جهازك"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>تنزيل TXT</span>
          </button>

          <button
            onClick={handleNewFile}
            className="flex items-center gap-1 px-2.5 py-1 rounded hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer font-medium"
          >
            <FilePlus className="w-3.5 h-3.5 text-amber-500" />
            <span>جديد</span>
          </button>
        </div>

        {saveStatus && (
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <Check className="w-3.5 h-3.5" />
            <span>{saveStatus}</span>
          </div>
        )}

        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          {fileName}
        </div>
      </div>

      {/* Editor Textarea */}
      <div className="flex-1 p-2 bg-white dark:bg-slate-900 overflow-hidden flex">
        <textarea
          value={content}
          onChange={handleTextChange}
          onKeyUp={e => updateCursor(e.currentTarget)}
          onClick={e => updateCursor(e.currentTarget)}
          className="w-full h-full resize-none p-3 font-mono text-sm leading-relaxed text-slate-900 dark:text-slate-100 bg-transparent border-0 focus:outline-none select-text"
          placeholder="اكتب هنا..."
          dir="rtl"
        />
      </div>

      {/* شريط حالة المفكرة */}
      <div className="flex items-center justify-between px-4 py-1 border-t border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-850 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
        <div>
          السطر {cursorPos.line}، العمود {cursorPos.col} · {content.length} حرف
        </div>
        <div className="flex items-center gap-4">
          <span>100%</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
};
