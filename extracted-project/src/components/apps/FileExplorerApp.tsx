import React, { useState, useEffect } from 'react';
import { useWindowManager } from '../../context/WindowManagerContext';
import { FileItem } from '../../types/os';
import {
  Folder,
  FileText,
  HardDrive,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  Search,
  Plus,
  Trash2,
  FilePlus,
  FolderPlus,
  RotateCcw,
  Monitor,
  Network,
  RotateCw
} from 'lucide-react';

interface FileExplorerAppProps {
  initialData?: {
    location?: 'this-pc' | 'network' | 'recycle' | 'documents';
    folderId?: string;
  };
}

export const FileExplorerApp: React.FC<FileExplorerAppProps> = ({ initialData }) => {
  const {
    files,
    createFile,
    createFolder,
    deleteFile,
    restoreFromRecycle,
    emptyRecycleBin,
    openApp
  } = useWindowManager();

  const [currentLocation, setCurrentLocation] = useState<'this-pc' | 'network' | 'recycle'>(
    initialData?.location === 'network'
      ? 'network'
      : initialData?.location === 'recycle'
      ? 'recycle'
      : 'this-pc'
  );

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialData?.folderId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  // Same double-tap fix as the Desktop icons: onDoubleClick never fires from two
  // finger taps on mobile browsers, so opening a folder/file by touch was broken.
  const lastItemTapRef = React.useRef<{ id: string; time: number } | null>(null);
  const ITEM_DOUBLE_TAP_MS = 350;
  const [newDialogType, setNewDialogType] = useState<'file' | 'folder' | null>(null);
  const [newItemName, setNewItemName] = useState('');

  // History stack for back/forward
  const [history, setHistory] = useState<{ loc: 'this-pc' | 'network' | 'recycle'; folderId: string | null }[]>([
    { loc: currentLocation, folderId: null }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    if (initialData?.location) {
      const loc = initialData.location === 'network' ? 'network' : initialData.location === 'recycle' ? 'recycle' : 'this-pc';
      setCurrentLocation(loc);
      setCurrentFolderId(initialData.folderId || null);
    }
  }, [initialData]);

  const navigateTo = (loc: 'this-pc' | 'network' | 'recycle', folderId: string | null) => {
    const newHist = history.slice(0, historyIndex + 1);
    newHist.push({ loc, folderId });
    setHistory(newHist);
    setHistoryIndex(newHist.length - 1);
    setCurrentLocation(loc);
    setCurrentFolderId(folderId);
    setSelectedItemId(null);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      setCurrentLocation(history[newIdx].loc);
      setCurrentFolderId(history[newIdx].folderId);
      setSelectedItemId(null);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      setCurrentLocation(history[newIdx].loc);
      setCurrentFolderId(history[newIdx].folderId);
      setSelectedItemId(null);
    }
  };

  const handleUp = () => {
    if (currentFolderId) {
      const currentFolder = files.find(f => f.id === currentFolderId);
      navigateTo(currentLocation, currentFolder ? currentFolder.parentId : null);
    }
  };

  // Filter items in current view
  const currentItems = files.filter(f => {
    // Location filter
    if (currentLocation === 'recycle') {
      if (f.location !== 'recycle') return false;
    } else if (currentLocation === 'network') {
      if (f.location !== 'network') return false;
    } else {
      if (f.location === 'recycle' || f.location === 'network') return false;
    }

    if (searchQuery.trim()) {
      return f.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return f.parentId === currentFolderId;
  });

  const currentFolder = files.find(f => f.id === currentFolderId);
  const locationTitles = {
    'this-pc': 'هذا الكمبيوتر الشخصي',
    'network': 'الشبكة المحلية',
    'recycle': 'سلة المحذوفات',
  };
  const folderTitle = currentFolder ? currentFolder.name : locationTitles[currentLocation];

  const handleItemDoubleClick = (item: FileItem) => {
    if (item.type === 'folder') {
      navigateTo(currentLocation, item.id);
    } else {
      if (currentLocation === 'recycle') {
        restoreFromRecycle(item.id);
      } else if (item.contentType === 'image') {
        openApp('imageviewer', { fileId: item.id, content: item.content, fileName: item.name });
      } else {
        openApp('notepad', { fileId: item.id, initialContent: item.content, fileName: item.name });
      }
    }
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    if (newDialogType === 'file') {
      const fileName = newItemName.endsWith('.txt') ? newItemName : `${newItemName}.txt`;
      createFile(currentFolderId, fileName, 'مستند نصي جديد.', currentLocation);
    } else if (newDialogType === 'folder') {
      createFolder(currentFolderId, newItemName, currentLocation);
    }
    setNewDialogType(null);
    setNewItemName('');
  };

  const handleDeleteSelected = () => {
    if (selectedItemId) {
      deleteFile(selectedItemId);
      setSelectedItemId(null);
    }
  };

  const handleRestoreSelected = () => {
    if (selectedItemId) {
      restoreFromRecycle(selectedItemId);
      setSelectedItemId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans text-xs select-none">
      {/* Top Command Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
        <div className="flex items-center gap-1.5">
          {currentLocation !== 'recycle' ? (
            <>
              <button
                onClick={() => {
                  setNewDialogType('file');
                  setNewItemName('مستند جديد.txt');
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded hover:bg-slate-200/70 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <FilePlus className="w-3.5 h-3.5 text-blue-600" />
                <span>ملف جديد</span>
              </button>

              <button
                onClick={() => {
                  setNewDialogType('folder');
                  setNewItemName('مجلد جديد');
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded hover:bg-slate-200/70 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
                <span>مجلد جديد</span>
              </button>

              <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

              <button
                onClick={handleDeleteSelected}
                disabled={!selectedItemId}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>حذف</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleRestoreSelected}
                disabled={!selectedItemId}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-300 disabled:opacity-40 font-medium cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                <span>استعادة العنصر المحدد</span>
              </button>

              <button
                onClick={emptyRecycleBin}
                disabled={currentItems.length === 0}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 disabled:opacity-40 font-medium cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>إفراغ سلة المحذوفات</span>
              </button>
            </>
          )}
        </div>

        <div className="text-[11px] text-slate-400">
          {currentItems.length} عنصر
        </div>
      </div>

      {/* Address and Navigation Bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-1">
          <button
            onClick={handleBack}
            disabled={historyIndex <= 0}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
            title="رجوع"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleForward}
            disabled={historyIndex >= history.length - 1}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
            title="إلى الأمام"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleUp}
            disabled={!currentFolderId}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
            title="المجلد الأعلى"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>

        {/* Address Bar Breadcrumbs */}
        <div className="flex-1 flex items-center gap-1.5 px-3 py-1 bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 rounded-md">
          {currentLocation === 'network' ? (
            <Network className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          ) : currentLocation === 'recycle' ? (
            <Trash2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          ) : (
            <HardDrive className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          )}
          <span className="text-slate-500">{locationTitles[currentLocation]}</span>
          {currentFolder && (
            <>
              <span className="text-slate-400">/</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{currentFolder.name}</span>
            </>
          )}
        </div>

        {/* Search Bar */}
        <div className="w-48 relative flex items-center">
          <input
            type="text"
            placeholder={`بحث في ${folderTitle}...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 rounded-md pr-7 pl-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
        </div>
      </div>

      {/* Main Split: Navigation Sidebar (RTL Right) + Content View (Left) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Right Navigation Tree */}
        <div className="w-52 border-l border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-2 overflow-y-auto space-y-1 shrink-0">
          <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
            المواقع
          </div>

          <button
            onClick={() => navigateTo('this-pc', null)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-right transition-colors ${
              currentLocation === 'this-pc' && currentFolderId === null
                ? 'bg-blue-100/70 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-semibold'
                : 'hover:bg-slate-200/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Monitor className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">هذا الكمبيوتر الشخصي</span>
          </button>

          <button
            onClick={() => navigateTo('network', null)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-right transition-colors ${
              currentLocation === 'network' && currentFolderId === null
                ? 'bg-blue-100/70 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-semibold'
                : 'hover:bg-slate-200/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">الشبكة المحلية</span>
          </button>

          <button
            onClick={() => navigateTo('recycle', null)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-right transition-colors ${
              currentLocation === 'recycle' && currentFolderId === null
                ? 'bg-blue-100/70 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-semibold'
                : 'hover:bg-slate-200/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">سلة المحذوفات</span>
          </button>

          <div className="h-px bg-slate-200 dark:bg-slate-800 my-1.5" />

          <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
            المجلدات
          </div>

          {files
            .filter(f => f.type === 'folder' && f.parentId === null && (f.location || 'this-pc') === currentLocation)
            .map(folder => (
              <button
                key={folder.id}
                onClick={() => navigateTo(currentLocation, folder.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-right transition-colors ${
                  currentFolderId === folder.id
                    ? 'bg-blue-100/70 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-semibold'
                    : 'hover:bg-slate-200/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">{folder.name}</span>
              </button>
            ))}
        </div>

        {/* File and Folder Items Viewport */}
        <div
          onClick={() => setSelectedItemId(null)}
          className="flex-1 p-4 overflow-y-auto bg-white dark:bg-slate-900"
        >
          {/* Create Modal Dialog if active */}
          {newDialogType && (
            <div className="mb-4 p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg max-w-sm">
              <form onSubmit={handleCreateNew} className="space-y-2">
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {newDialogType === 'file' ? 'اسم الملف النصي الجديد:' : 'اسم المجلد الجديد:'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    autoFocus
                    className="flex-1 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium cursor-pointer"
                  >
                    إنشاء
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewDialogType(null)}
                    className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-xs cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          )}

          {currentItems.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Folder className="w-10 h-10 opacity-30" />
              <span>
                {currentLocation === 'recycle'
                  ? 'سلة المحذوفات فارغة'
                  : currentLocation === 'network'
                  ? 'لا توجد أجهزة أو مجلدات شبكة أخرى متصلة حالياً'
                  : 'هذا المجلد فارغ'}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {currentItems.map(item => {
                const isSelected = selectedItemId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedItemId(item.id);
                    }}
                    onDoubleClick={() => handleItemDoubleClick(item)}
                    onTouchEnd={() => {
                      const now = Date.now();
                      const last = lastItemTapRef.current;
                      setSelectedItemId(item.id);
                      if (last && last.id === item.id && now - last.time < ITEM_DOUBLE_TAP_MS) {
                        lastItemTapRef.current = null;
                        handleItemDoubleClick(item);
                      } else {
                        lastItemTapRef.current = { id: item.id, time: now };
                      }
                    }}
                    className={`flex flex-col items-center p-3 rounded-lg border transition-all cursor-pointer text-center group ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600'
                        : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {item.type === 'folder' ? (
                      <div className="w-12 h-12 flex items-center justify-center mb-1.5">
                        <Folder className="w-10 h-10 text-amber-500 fill-amber-400 drop-shadow-sm" />
                      </div>
                    ) : item.contentType === 'image' && item.content ? (
                      <div className="w-12 h-12 flex items-center justify-center mb-1.5 overflow-hidden rounded-md border border-slate-200 dark:border-slate-700">
                        <img src={item.content} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center mb-1.5">
                        <FileText className="w-10 h-10 text-blue-500 fill-blue-50 dark:fill-blue-950/40 drop-shadow-sm" />
                      </div>
                    )}
                    <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200 line-clamp-2 break-all group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {item.name}
                    </span>
                    {item.size && (
                      <span className="text-[10px] text-slate-400 mt-0.5">{item.size}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
