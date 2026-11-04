import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Lock,
  Search,
  Bookmark,
  Globe
} from 'lucide-react';
import { BrowserIcon } from '../icons/WinIcons';

export const BrowserApp: React.FC = () => {
  const [url, setUrl] = useState('https://www.google.com');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const TABS = [
    { title: 'علامة تبويب جديدة', url: 'about:blank' },
    { title: 'محرك البحث', url: 'https://www.google.com' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setUrl(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans text-xs select-none">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-2 pt-2 bg-slate-100/90 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-t-lg border-t border-x border-slate-200 dark:border-slate-800 text-xs font-medium max-w-xs shadow-xs">
          <BrowserIcon className="w-3.5 h-3.5" />
          <span className="truncate">{TABS[activeTab].title}</span>
        </div>
      </div>

      {/* Address & Navigation Bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-1">
          <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" title="السابق">
            <ArrowRight className="w-4 h-4" />
          </button>
          <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" title="التالي">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" title="تحديث">
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" title="الرئيسية">
            <Home className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Address Input */}
        <div className="flex-1 flex items-center gap-2 px-3 py-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-full border border-slate-200 dark:border-slate-700">
          <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="w-full bg-transparent text-[11px] font-mono focus:outline-none select-text text-left dir-ltr"
          />
        </div>

        <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
          <Bookmark className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Browser Viewport */}
      <div className="flex-1 bg-gradient-to-b from-blue-50/30 via-white to-slate-50 dark:from-slate-900 dark:to-slate-950 p-6 overflow-y-auto flex flex-col items-center justify-center text-center">
        <div className="max-w-md w-full space-y-5">
          <div className="flex justify-center mb-2">
            <BrowserIcon className="w-16 h-16 drop-shadow-md" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">متصفح الويب</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              متصفح النظام لتصفح الويب والبحث والوصول إلى المواقع
            </p>
          </div>

          {/* Search box in new tab */}
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              placeholder="ابحث في الويب أو اكتب عنوان URL..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 pr-10 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-full shadow-sm text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 select-text"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
          </form>

          {/* Clean Quick links */}
          <div className="grid grid-cols-4 gap-3 pt-2">
            {[
              { name: 'Google', icon: '🌐', url: 'https://google.com' },
              { name: 'GitHub', icon: '🐙', url: 'https://github.com' },
              { name: 'Wikipedia', icon: '📚', url: 'https://wikipedia.org' },
              { name: 'Archive', icon: '🏛️', url: 'https://archive.org' },
            ].map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors group cursor-pointer"
              >
                <span className="text-xl mb-1">{link.icon}</span>
                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 truncate">{link.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
