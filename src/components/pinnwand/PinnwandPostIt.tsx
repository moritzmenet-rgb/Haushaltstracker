import React, { useState, useRef, useEffect } from 'react';
import { 
  Pin, 
  MessageSquare, 
  Smile, 
  Trash2, 
  Edit3, 
  Check, 
  Vote, 
  CornerDownRight, 
  MoreVertical,
  CheckCircle2,
  Lock,
  Unlock,
  Move
} from 'lucide-react';
import { PinnwandNote, PostItColor } from '../../types';
import { formatRelativeDate, getInitials } from '../../utils';

interface PinnwandPostItProps {
  note: PinnwandNote;
  activeUserId: string | null;
  activeUserName?: string;
  isAdmin: boolean;
  onReply: (note: PinnwandNote) => void;
  onEdit: (note: PinnwandNote) => void;
  onDelete: (noteId: string) => void;
  onVote: (noteId: string, optionId: string) => void;
  onReact: (noteId: string, emoji: string) => void;
  onTogglePin: (noteId: string) => void;
  onStartDrag?: (e: React.MouseEvent | React.TouchEvent, noteId: string) => void;
  isDragging?: boolean;
  parentNoteSnippet?: string;
  parentAuthorName?: string;
  viewMode?: 'canvas' | 'list';
}

const COMMON_REACTIONS = ['👍', '❤️', '💡', '😂', '🎯', '🔥', '🍕', '👏'];

export const PinnwandPostIt: React.FC<PinnwandPostItProps> = ({
  note,
  activeUserId,
  isAdmin,
  onReply,
  onEdit,
  onDelete,
  onVote,
  onReact,
  onTogglePin,
  onStartDrag,
  isDragging = false,
  parentNoteSnippet,
  parentAuthorName,
  viewMode = 'canvas'
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Post-It Color theme styling
  const getColorClasses = (color: PostItColor) => {
    switch (color) {
      case 'pink':
        return {
          bg: 'bg-[#FDE2EB] text-[#4A1525] border-[#F9A8D4]',
          paperShadow: 'shadow-[0_8px_20px_rgba(219,39,119,0.18)] hover:shadow-[0_12px_28px_rgba(219,39,119,0.26)]',
          headerBg: 'bg-[#FBCFE8]/70',
          accent: 'text-rose-700',
          pollProgress: 'bg-rose-500/25 border-rose-400/40',
          pollActive: 'border-rose-600 bg-rose-500/15',
          pinColor: 'from-rose-600 via-pink-500 to-rose-300'
        };
      case 'blue':
        return {
          bg: 'bg-[#E0F2FE] text-[#0C3547] border-[#93C5FD]',
          paperShadow: 'shadow-[0_8px_20px_rgba(2,132,199,0.18)] hover:shadow-[0_12px_28px_rgba(2,132,199,0.26)]',
          headerBg: 'bg-[#BAE6FD]/70',
          accent: 'text-sky-700',
          pollProgress: 'bg-sky-500/25 border-sky-400/40',
          pollActive: 'border-sky-600 bg-sky-500/15',
          pinColor: 'from-blue-600 via-sky-500 to-sky-300'
        };
      case 'green':
        return {
          bg: 'bg-[#DCFCE7] text-[#144225] border-[#86EFAC]',
          paperShadow: 'shadow-[0_8px_20px_rgba(22,163,74,0.18)] hover:shadow-[0_12px_28px_rgba(22,163,74,0.26)]',
          headerBg: 'bg-[#BBF7D0]/70',
          accent: 'text-emerald-700',
          pollProgress: 'bg-emerald-500/25 border-emerald-400/40',
          pollActive: 'border-emerald-600 bg-emerald-500/15',
          pinColor: 'from-emerald-600 via-green-500 to-emerald-300'
        };
      case 'orange':
        return {
          bg: 'bg-[#FFEDD5] text-[#51230B] border-[#FDBA74]',
          paperShadow: 'shadow-[0_8px_20px_rgba(234,88,12,0.18)] hover:shadow-[0_12px_28px_rgba(234,88,12,0.26)]',
          headerBg: 'bg-[#FED7AA]/70',
          accent: 'text-orange-700',
          pollProgress: 'bg-orange-500/25 border-orange-400/40',
          pollActive: 'border-orange-600 bg-orange-500/15',
          pinColor: 'from-orange-600 via-amber-500 to-orange-300'
        };
      case 'purple':
        return {
          bg: 'bg-[#F3E8FF] text-[#3B1261] border-[#D8B4FE]',
          paperShadow: 'shadow-[0_8px_20px_rgba(147,51,234,0.18)] hover:shadow-[0_12px_28px_rgba(147,51,234,0.26)]',
          headerBg: 'bg-[#E9D5FF]/70',
          accent: 'text-purple-700',
          pollProgress: 'bg-purple-500/25 border-purple-400/40',
          pollActive: 'border-purple-600 bg-purple-500/15',
          pinColor: 'from-purple-600 via-fuchsia-500 to-purple-300'
        };
      case 'yellow':
      default:
        return {
          bg: 'bg-[#FEF9C3] text-[#422006] border-[#FDE047]',
          paperShadow: 'shadow-[0_8px_20px_rgba(202,138,4,0.18)] hover:shadow-[0_12px_28px_rgba(202,138,4,0.26)]',
          headerBg: 'bg-[#FEF08A]/70',
          accent: 'text-amber-800',
          pollProgress: 'bg-amber-500/25 border-amber-400/40',
          pollActive: 'border-amber-600 bg-amber-500/15',
          pinColor: 'from-red-600 via-rose-500 to-rose-300'
        };
    }
  };

  const styleConfig = getColorClasses(note.color);

  // Width & typography based on hierarchy depth
  // depth 0 = Root (standard, 300px), depth 1 = Comment (~260px), depth >= 2 = Comment on Comment (~235px)
  const getHierarchyLayout = (depth: number) => {
    if (depth === 0) {
      return {
        widthClass: 'w-[305px] sm:w-[325px]',
        titleSize: 'text-base font-black',
        textSize: 'text-sm font-medium',
        headerPad: 'pt-5 px-4 pb-2.5',
        bodyPad: 'px-4 pb-3.5',
        badge: 'Hauptthema'
      };
    } else if (depth === 1) {
      return {
        widthClass: 'w-[265px] sm:w-[285px]',
        titleSize: 'text-sm font-black',
        textSize: 'text-xs sm:text-[13px] font-medium leading-relaxed',
        headerPad: 'pt-5 px-3.5 pb-2',
        bodyPad: 'px-3.5 pb-3',
        badge: 'Antwort'
      };
    } else {
      return {
        widthClass: 'w-[235px] sm:w-[255px]',
        titleSize: 'text-xs font-black',
        textSize: 'text-xs font-medium leading-snug',
        headerPad: 'pt-5 px-3 pb-1.5',
        bodyPad: 'px-3 pb-2.5',
        badge: `Antwort Lvl ${depth}`
      };
    }
  };

  const hierarchy = getHierarchyLayout(note.depth);
  const isAuthor = activeUserId && note.authorId === activeUserId;
  const canModify = isAuthor || isAdmin;

  // Poll calculations
  const totalPollVotes = note.poll?.options.reduce((sum, opt) => sum + opt.voterIds.length, 0) || 0;

  return (
    <div
      data-note-id={note.id}
      id={`postit-${note.id}`}
      style={viewMode === 'canvas' ? {
        position: 'absolute',
        left: `${note.position?.x ?? 50}px`,
        top: `${note.position?.y ?? 50}px`,
        transform: `rotate(${note.rotation || 0}deg)`,
        zIndex: isDragging ? 50 : note.isPinned ? 30 : 10 + note.depth
      } : undefined}
      className={`group select-none transition-shadow duration-200 border rounded-2xl relative ${styleConfig.bg} ${styleConfig.paperShadow} ${
        viewMode === 'canvas' ? hierarchy.widthClass : 'w-full'
      } ${isDragging ? 'ring-3 ring-rose-500/60 scale-[1.03] cursor-grabbing shadow-2xl' : ''}`}
    >
      {/* Pushpin (Reißzwecke) with 3D metallic shine and shadow */}
      <div 
        onMouseDown={viewMode === 'canvas' ? (e) => onStartDrag?.(e, note.id) : undefined}
        onTouchStart={viewMode === 'canvas' ? (e) => onStartDrag?.(e, note.id) : undefined}
        title={viewMode === 'canvas' ? 'Gedrückt halten & ziehen, um das Post-it zu verschieben' : undefined}
        className={`absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center ${
          viewMode === 'canvas' ? 'cursor-grab active:cursor-grabbing hover:scale-110 transition-transform' : ''
        }`}
      >
        {/* Needle shadow */}
        <div className="w-1.5 h-2 bg-black/35 rounded-full blur-[0.5px] -mb-1 translate-y-1" />
        
        {/* Pushpin Head */}
        <div className={`w-7 h-7 rounded-full bg-gradient-to-tr ${styleConfig.pinColor} border-2 border-white/80 shadow-md flex items-center justify-center relative`}>
          {/* Inner metallic highlight dot */}
          <div className="w-2 h-2 rounded-full bg-white/70 absolute top-1 left-1.5" />
          
          {/* Subtle icon if pinned */}
          {note.isPinned && (
            <Pin className="w-3 h-3 text-white drop-shadow-sm rotate-45" />
          )}

          {/* Canvas Drag indicator for quick usability */}
          {viewMode === 'canvas' && !note.isPinned && (
            <Move className="w-3 h-3 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>

      {/* Top Header Bar inside Post-It */}
      <div className={`${hierarchy.headerPad} flex items-start justify-between gap-2 border-b border-black/8`}>
        {/* Author details & relative date */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            style={{ backgroundColor: note.authorAvatarColor || '#4F46E5' }}
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0 shadow-xs"
          >
            {getInitials(note.authorName)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-xs font-bold truncate text-current">
                {note.authorName}
              </span>
              {note.category && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-black/8 text-current/80 font-bold shrink-0">
                  {note.category}
                </span>
              )}
            </div>
            <span className="text-[10px] text-current/60 font-medium block mt-0.5">
              {formatRelativeDate(note.createdAt)}
            </span>
          </div>
        </div>

        {/* Action Menu (Pin, Edit, Delete) */}
        <div className="relative shrink-0 flex items-center gap-1" ref={menuRef}>
          {/* Quick Pin Toggle Button */}
          <button
            type="button"
            onClick={() => onTogglePin(note.id)}
            className={`p-1 rounded-lg text-current/60 hover:text-current hover:bg-black/8 transition cursor-pointer ${
              note.isPinned ? 'text-rose-600 bg-black/8' : ''
            }`}
            title={note.isPinned ? 'Festpinnung aufheben' : 'Oben festpinnen'}
          >
            <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
          </button>

          {/* More options menu */}
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-lg text-current/60 hover:text-current hover:bg-black/8 transition cursor-pointer"
            title="Optionen"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-7 z-30 w-36 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-xl shadow-xl py-1 text-xs text-slate-800 dark:text-slate-200">
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onReply(note);
                }}
                className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 font-semibold text-current cursor-pointer"
              >
                <CornerDownRight className="w-3.5 h-3.5 text-rose-500" />
                <span>Antworten</span>
              </button>

              {canModify && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(note);
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 font-medium cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Bearbeiten</span>
                </button>
              )}

              {canModify && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(note.id);
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Löschen</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Parent Context Banner (if this note is a reply) */}
      {note.parentId && parentAuthorName && (
        <div className="mx-3 mt-2 px-2.5 py-1 rounded-lg bg-black/6 flex items-center gap-1.5 text-[11px] text-current/80">
          <CornerDownRight className="w-3 h-3 text-rose-600 shrink-0 stroke-[2.5]" />
          <span className="font-bold shrink-0">Antwort an {parentAuthorName}:</span>
          {parentNoteSnippet && (
            <span className="truncate italic opacity-85">"{parentNoteSnippet}"</span>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className={`${hierarchy.bodyPad} pt-2.5`}>
        {/* Title for Root Topics */}
        {note.title && (
          <h4 className={`${hierarchy.titleSize} text-current mb-1.5 leading-snug tracking-tight`}>
            {note.title}
          </h4>
        )}

        {/* Content Body */}
        <p className={`${hierarchy.textSize} text-current/90 whitespace-pre-wrap break-words leading-relaxed`}>
          {note.content}
        </p>

        {/* Poll Component if attached */}
        {note.poll && (
          <div className="mt-3 pt-2.5 border-t border-black/10">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 font-black text-xs text-current">
                <Vote className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span className="truncate">{note.poll.question || 'Abstimmung'}</span>
              </div>
              <span className="text-[10px] font-bold text-current/70 shrink-0">
                {totalPollVotes} {totalPollVotes === 1 ? 'Stimme' : 'Stimmen'}
              </span>
            </div>

            {/* Poll Options List */}
            <div className="space-y-1.5">
              {note.poll.options.map((opt) => {
                const voteCount = opt.voterIds.length;
                const percentage = totalPollVotes > 0 ? Math.round((voteCount / totalPollVotes) * 100) : 0;
                const hasVoted = activeUserId && opt.voterIds.includes(activeUserId);

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={note.poll?.closed}
                    onClick={() => onVote(note.id, opt.id)}
                    className={`w-full text-left relative overflow-hidden rounded-xl border p-2 text-xs transition-all active:scale-[0.98] cursor-pointer ${
                      hasVoted
                        ? styleConfig.pollActive
                        : 'border-black/10 hover:border-black/20 bg-black/5'
                    }`}
                  >
                    {/* Animated Progress Fill */}
                    <div
                      style={{ width: `${percentage}%` }}
                      className={`absolute inset-y-0 left-0 ${styleConfig.pollProgress} transition-all duration-500 rounded-lg -z-0`}
                    />

                    {/* Option Label + Vote percentage */}
                    <div className="relative z-10 flex items-center justify-between gap-2 font-bold text-current">
                      <div className="flex items-center gap-1.5 truncate">
                        {hasVoted && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        )}
                        <span className="truncate">{opt.text}</span>
                      </div>
                      <span className="text-[11px] font-black shrink-0">
                        {percentage}% <span className="opacity-75 font-normal">({voteCount})</span>
                      </span>
                    </div>

                    {/* Voter Avatars summary */}
                    {voteCount > 0 && (
                      <div className="relative z-10 flex items-center gap-1 mt-1 text-[10px] opacity-75 font-medium">
                        <span>{voteCount} {voteCount === 1 ? 'Person' : 'Personen'} dafür</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Poll status footer */}
            {note.poll.closed && (
              <div className="mt-2 text-center text-[10px] font-bold text-current/60 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Abstimmung beendet</span>
              </div>
            )}
          </div>
        )}

        {/* Reactions Section */}
        <div className="mt-3 pt-2 border-t border-black/8 flex flex-wrap items-center gap-1.5">
          {/* Existing Reaction Badges */}
          {note.reactions && Object.entries(note.reactions).map(([emoji, voters]) => {
            if (!voters || voters.length === 0) return null;
            const hasReacted = activeUserId && voters.includes(activeUserId);
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => onReact(note.id, emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold transition active:scale-95 cursor-pointer ${
                  hasReacted
                    ? 'bg-rose-500/20 border border-rose-500/40 text-rose-950 font-black scale-105'
                    : 'bg-black/6 hover:bg-black/10 border border-black/10 text-current'
                }`}
                title={`${voters.length} Reaktion${voters.length > 1 ? 'en' : ''}`}
              >
                <span>{emoji}</span>
                <span className="text-[10px]">{voters.length}</span>
              </button>
            );
          })}

          {/* Add Reaction Button */}
          <div className="relative" ref={emojiPickerRef}>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="px-2 py-0.5 rounded-full bg-black/6 hover:bg-black/12 text-current/70 hover:text-current text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="Emoji-Reaktion hinzufügen"
            >
              <Smile className="w-3 h-3" />
              <span className="text-[10px]">+</span>
            </button>

            {/* Emoji Quick Picker Popup */}
            {showEmojiPicker && (
              <div className="absolute left-0 bottom-7 z-40 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-2xl shadow-xl p-2 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-150">
                {COMMON_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onReact(note.id, emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="w-8 h-8 rounded-xl hover:bg-black/8 dark:hover:bg-white/10 text-base flex items-center justify-center transition active:scale-125 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer: Prominent "Antworten / Faden weiterführen" Button */}
        <div className="mt-3 pt-2 border-t border-black/8 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onReply(note)}
            className="flex-1 py-1.5 px-3 rounded-xl bg-black/8 hover:bg-black/15 text-current text-xs font-black flex items-center justify-center gap-1.5 transition active:scale-[0.98] cursor-pointer"
            title="Auf dieses Post-It antworten und mit rotem Faden verbinden"
          >
            <CornerDownRight className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />
            <span>Faden anheften</span>
          </button>
        </div>
      </div>
    </div>
  );
};
