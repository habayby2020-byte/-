import React, { useState } from 'react';
import { FolderPlus } from 'lucide-react';
import { useWindowManager } from '../../context/WindowManagerContext';

/**
 * شاشة تظهر مرة وحدة بس (أول دخول للنظام) — تطلب اسم مجلد المشروع،
 * وتسويه. من بعدها كل شي ينحفظ منه (كاتب الأكواد مثلاً) يروح له
 * تلقائياً، بدون ما تُسأل عنه مرة ثانية.
 */
export const ProjectFolderSetup: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { setupProjectFolder } = useWindowManager();
  const [name, setName] = useState('مشروعي');

  const confirm = () => {
    setupProjectFolder(name);
    onDone();
  };

  return (
    <div dir="rtl" className="fixed inset-0 astra-bg text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm astra-fade-up text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[var(--astra-accent)]/15 border border-[var(--astra-accent)]/40 flex items-center justify-center text-[var(--astra-accent)]">
          <FolderPlus className="w-8 h-8" />
        </div>
        <h1 className="text-lg font-bold mb-2">أنشئ مجلد مشروعك</h1>
        <p className="text-xs text-white/45 mb-6 leading-relaxed">
          كل شي تسويه بعدين — ملفات، أكواد، مشاريع — ينحفظ تلقائياً هنا.
          تسمّيه مرة وحدة بس، وتقدر تغيّره بعدين من الإعدادات.
        </p>

        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') confirm(); }}
          autoFocus
          className="w-full px-4 py-3 rounded-xl astra-glass text-center text-sm font-semibold text-white outline-none focus:border-[var(--astra-accent)]/60 transition-colors mb-4"
          placeholder="اسم المجلد"
        />

        <button
          onClick={confirm}
          className="w-full py-3 rounded-xl bg-gradient-to-l from-[var(--astra-accent)] to-[var(--astra-accent-2)] text-slate-950 text-sm font-bold cursor-pointer"
        >
          إنشاء والمتابعة
        </button>
      </div>
    </div>
  );
};
