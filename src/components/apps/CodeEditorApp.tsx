import React, { useState, useRef } from 'react';
import { Save, Download, FilePlus, Check, Braces } from 'lucide-react';
import { useWindowManager } from '../../context/WindowManagerContext';

interface CodeEditorAppProps {
  initialData?: { fileId?: string; initialContent?: string; fileName?: string };
}

const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'HTML', 'CSS', 'JSON', 'نص عادي'] as const;

const DEFAULT_CODE = `// رحّب بأول سطر من كودك هنا
function hello() {
  console.log("Astro");
}
`;

export const CodeEditorApp: React.FC<CodeEditorAppProps> = ({ initialData }) => {
  const { updateFile, createFile, PROJECT_FOLDER_ID, projectFolderName } = useWindowManager();
  const [code, setCode] = useState(initialData?.initialContent ?? DEFAULT_CODE);
  const [fileName, setFileName] = useState(initialData?.fileName || 'كود-جديد.js');
  const [fileId, setFileId] = useState<string | null>(initialData?.fileId || null);
  const [lang, setLang] = useState<(typeof LANGUAGES)[number]>('JavaScript');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const taRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const lineCount = code.split('\n').length;

  const syncScroll = () => {
    if (gutterRef.current && taRef.current) gutterRef.current.scrollTop = taRef.current.scrollTop;
  };

  const flashSaved = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(null), 2200);
  };

  const handleSave = () => {
    if (fileId) {
      updateFile(fileId, code);
      flashSaved('تم الحفظ');
    } else {
      // يحفظ تلقائياً داخل مجلد المشروع — بدون ما تختار مكان كل مرة.
      const newFile = createFile(PROJECT_FOLDER_ID, fileName, code);
      setFileId(newFile.id);
      flashSaved(`تم الحفظ داخل "${projectFolderName || 'مشروعي'}"`);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    flashSaved('تم التنزيل لجهازك');
  };

  const handleNew = () => {
    setCode('');
    setFileName('كود-جديد.js');
    setFileId(null);
  };

  // Tab يكتب مسافتين بدل ما ينقل التركيز لعنصر ثاني — سلوك متوقع بأي محرر كود.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart, end = el.selectionEnd;
      const next = code.slice(0, start) + '  ' + code.slice(end);
      setCode(next);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + 2; });
    }
  };

  return (
    <div dir="ltr" className="flex flex-col h-full bg-[#0d1117] text-slate-200 font-mono text-xs select-none">
      <div dir="rtl" className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 bg-[#0d1117] shrink-0">
        <div className="flex items-center gap-1">
          <button onClick={handleSave} className="flex items-center gap-1 px-2.5 py-1 rounded hover:bg-white/10 cursor-pointer font-medium">
            <Save className="w-3.5 h-3.5 text-[var(--astra-accent)]" />
            <span>حفظ</span>
          </button>
          <button onClick={handleDownload} className="flex items-center gap-1 px-2.5 py-1 rounded hover:bg-white/10 cursor-pointer font-medium">
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>تنزيل</span>
          </button>
          <button onClick={handleNew} className="flex items-center gap-1 px-2.5 py-1 rounded hover:bg-white/10 cursor-pointer font-medium">
            <FilePlus className="w-3.5 h-3.5 text-amber-400" />
            <span>جديد</span>
          </button>
          <select
            value={lang}
            onChange={e => setLang(e.target.value as any)}
            className="bg-white/5 border border-white/10 rounded px-1.5 py-1 text-[11px] text-white/70 outline-none cursor-pointer"
          >
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {saveStatus && (
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
            <Check className="w-3.5 h-3.5" />
            <span>{saveStatus}</span>
          </div>
        )}

        <input
          value={fileName}
          onChange={e => setFileName(e.target.value)}
          className="bg-transparent text-[11px] text-white/50 text-left outline-none w-40"
        />
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div ref={gutterRef} className="w-10 shrink-0 overflow-hidden text-right pr-2 pt-3 text-white/25 select-none leading-[1.6] text-[13px]">
          {Array.from({ length: lineCount }, (_, i) => <div key={i}>{i + 1}</div>)}
        </div>
        <textarea
          ref={taRef}
          value={code}
          onChange={e => setCode(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 h-full resize-none p-3 pl-2 leading-[1.6] text-[13px] bg-transparent border-0 outline-none text-slate-200"
        />
      </div>

      <div dir="rtl" className="flex items-center justify-between px-3 py-1 border-t border-white/10 text-[11px] text-white/35">
        <div className="flex items-center gap-1.5"><Braces className="w-3 h-3" />{lang}</div>
        <div>{lineCount} سطر · {code.length} حرف</div>
      </div>
    </div>
  );
};
