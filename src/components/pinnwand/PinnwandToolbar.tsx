import React, { useState } from 'react';
import { 
  Plus, 
  Vote, 
  Search, 
  User, 
  Sparkles, 
  Trash2, 
  Download, 
  CheckCircle2, 
  Layers
} from 'lucide-react';

interface PinnwandToolbarProps {
  onNewTopic: () => void;
  onNewPoll: () => void;
  onSeedDemo: () => void;
  onClearBoard: () => void;
  onExport: () => void;
  authorName: string;
  onUpdateAuthorName: (name: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalNotes: number;
  isSyncing: boolean;
}

export const PinnwandToolbar: React.FC<PinnwandToolbarProps> = ({
  onNewTopic,
  onNewPoll,
  onSeedDemo,
  onClearBoard,
  onExport,
  authorName,
  onUpdateAuthorName,
  searchQuery,
  onSearchChange,
  totalNotes,
  isSyncing
}) => {
  const [isEditingAuthor, setIsEditingAuthor] = useState(false);
  const [tempAuthor, setTempAuthor] = useState(authorName);

  const handleSaveAuthor = () => {
    if (tempAuthor.trim()) {
      onUpdateAuthorName(tempAuthor.trim());
    }
    setIsEditingAuthor(false);
  };

  return (
    <header className="fixed top-4 inset-x-4 max-w-6xl mx-auto z-40 select-none">
      <div className="m3-glass-surface rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 border border-white/5">
        {/* Brand & Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-600/20 relative">
              <span className="text-base">📌</span>
              {/* Little red thread loop dot */}
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-white" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-neutral-900 dark:text-white leading-none">
                Pinnwand
              </h1>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
                Padlet & Mindmap mit rotem Faden
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span>{totalNotes} Zettel</span>
          </div>

          {/* Realtime Live Sync indicator */}
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800/40"
            title="Echtzeit-Synchronisierung über Firebase Firestore aktiv"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline">Live-Sync</span>
          </div>
        </div>

        {/* Center: Search / Filter */}
        <div className="hidden lg:flex items-center flex-1 max-w-xs relative">
          <Search className="w-3.5 h-3.5 absolute left-3 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Zettel & Notizen suchen..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-neutral-100 dark:bg-neutral-800 border-none text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>

        {/* Right Side: Actions & Author */}
        <div className="flex items-center gap-2">
          {/* Author Name Chip */}
          {isEditingAuthor ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={tempAuthor}
                onChange={(e) => setTempAuthor(e.target.value)}
                className="w-24 px-2 py-1 text-xs rounded-lg border border-amber-500 bg-white dark:bg-neutral-800 focus:outline-none"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveAuthor()}
                onBlur={handleSaveAuthor}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setTempAuthor(authorName);
                setIsEditingAuthor(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 transition cursor-pointer"
              title="Klicken, um deinen Namen zu ändern"
            >
              <User className="w-3.5 h-3.5 text-amber-600" />
              <span className="max-w-20 truncate">{authorName}</span>
              <span className="text-[10px] opacity-60">✎</span>
            </button>
          )}

          {/* "+ Notiz / Haupt-Thema" Primary Button */}
          <button
            type="button"
            onClick={onNewTopic}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-md shadow-amber-600/20 flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Neues Thema</span>
          </button>

          {/* "+ Umfrage" Button */}
          <button
            type="button"
            onClick={onNewPoll}
            className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition active:scale-95 cursor-pointer shrink-0 flex items-center gap-1.5"
            title="Umfrage erstellen"
          >
            <Vote className="w-4 h-4 text-indigo-500" />
            <span className="hidden md:inline">Umfrage</span>
          </button>

          {/* Secondary Actions Menu */}
          <div className="flex items-center gap-1 pl-1 border-l border-neutral-200 dark:border-neutral-800">
            {/* Seed Demo Board */}
            <button
              type="button"
              onClick={onSeedDemo}
              className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition cursor-pointer"
              title="Beispiel-Mindmap mit rotem Wollfaden laden"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
            </button>

            {/* Clear Board */}
            <button
              type="button"
              onClick={onClearBoard}
              className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 transition cursor-pointer"
              title="Pinnwand leeren"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Export */}
            <button
              type="button"
              onClick={onExport}
              className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition cursor-pointer"
              title="Als JSON sichern"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
