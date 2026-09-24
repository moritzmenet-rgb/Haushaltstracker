import React, { useState, useRef } from 'react';
import { 
  CornerDownRight, 
  Trash2, 
  Palette, 
  Edit3, 
  Check, 
  Plus, 
  Vote, 
  Smile, 
  X
} from 'lucide-react';
import type { PostIt, PostItColor } from '../../types/pinnwand';
import { PushPin } from './PushPin';
import { getPostItWidth } from './YarnConnections';

interface PostItNodeProps {
  postIt: PostIt;
  currentUserId: string;
  hasChildren: boolean;
  onDragStart: (id: string, startX: number, startY: number, clientX: number, clientY: number) => void;
  onReply: (parent: PostIt) => void;
  onDelete: (id: string) => void;
  onUpdate: (updated: PostIt) => void;
  onVote: (postItId: string, optionId: string) => void;
  onReact: (postItId: string, emoji: string) => void;
  isDragging?: boolean;
}

const COLOR_CLASSES: Record<PostItColor, { bg: string; border: string; accent: string; text: string }> = {
  yellow: {
    bg: 'bg-[#fef9c3]',
    border: 'border-[#fef08a]',
    accent: '#eab308',
    text: 'text-amber-950'
  },
  pink: {
    bg: 'bg-[#ffe4e6]',
    border: 'border-[#fecdd3]',
    accent: '#f43f5e',
    text: 'text-rose-950'
  },
  green: {
    bg: 'bg-[#dcfce7]',
    border: 'border-[#bbf7d0]',
    accent: '#22c55e',
    text: 'text-emerald-950'
  },
  blue: {
    bg: 'bg-[#e0f2fe]',
    border: 'border-[#bae6fd]',
    accent: '#0ea5e9',
    text: 'text-sky-950'
  },
  purple: {
    bg: 'bg-[#f3e8ff]',
    border: 'border-[#e9d5ff]',
    accent: '#a855f7',
    text: 'text-purple-950'
  },
  orange: {
    bg: 'bg-[#ffedd5]',
    border: 'border-[#fed7aa]',
    accent: '#f97316',
    text: 'text-orange-950'
  },
  white: {
    bg: 'bg-[#fafafa]',
    border: 'border-[#e5e5e5]',
    accent: '#737373',
    text: 'text-neutral-900'
  }
};

const AVAILABLE_COLORS: PostItColor[] = ['yellow', 'pink', 'green', 'blue', 'purple', 'orange', 'white'];
const QUICK_EMOJIS = ['👍', '❤️', '🔥', '💡', '🎉', '😂'];

export const PostItNode: React.FC<PostItNodeProps> = ({
  postIt,
  currentUserId,
  hasChildren,
  onDragStart,
  onReply,
  onDelete,
  onUpdate,
  onVote,
  onReact,
  isDragging = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(postIt.title || '');
  const [editContent, setEditContent] = useState(postIt.content || '');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [newOptionText, setNewOptionText] = useState('');
  const [showAddOption, setShowAddOption] = useState(false);

  const width = getPostItWidth(postIt.level);
  const colorStyle = COLOR_CLASSES[postIt.color] || COLOR_CLASSES.yellow;

  // Handle pointer down for drag
  const handlePointerDown = (e: React.PointerEvent) => {
    // Prevent dragging if clicking inside button, input, textarea or clickable elements
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('.no-drag')
    ) {
      return;
    }

    e.preventDefault();
    onDragStart(postIt.id, postIt.x, postIt.y, e.clientX, e.clientY);
  };

  const handleSaveEdit = () => {
    onUpdate({
      ...postIt,
      title: editTitle.trim(),
      content: editContent.trim(),
      updatedAt: Date.now()
    });
    setIsEditing(false);
  };

  const handleAddPollOption = () => {
    if (!newOptionText.trim()) return;
    const newOption = {
      id: `opt-${Date.now()}`,
      text: newOptionText.trim(),
      votes: 0,
      voterIds: []
    };
    onUpdate({
      ...postIt,
      pollOptions: [...(postIt.pollOptions || []), newOption],
      updatedAt: Date.now()
    });
    setNewOptionText('');
    setShowAddOption(false);
  };

  // Calculate poll votes total
  const totalVotes = (postIt.pollOptions || []).reduce((sum, opt) => sum + (opt.votes || 0), 0);

  // Time formatting
  const timeFormatted = React.useMemo(() => {
    const diff = Date.now() - postIt.createdAt;
    if (diff < 60000) return 'gerade eben';
    if (diff < 3600000) return `vor ${Math.floor(diff / 60000)} Min`;
    if (diff < 86400000) return `vor ${Math.floor(diff / 3600000)} Std`;
    return new Date(postIt.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  }, [postIt.createdAt]);

  const hasYarn = !!postIt.parentId || hasChildren;

  return (
    <div
      onPointerDown={handlePointerDown}
      style={{
        transform: `translate3d(${postIt.x}px, ${postIt.y}px, 0) rotate(${postIt.rotation || 0}deg) scale(${isDragging ? 1.04 : 1})`,
        width: `${width}px`,
        touchAction: 'none'
      }}
      className={`absolute top-0 left-0 transition-shadow select-none group ${
        isDragging 
          ? 'z-50 postit-shadow-drag cursor-grabbing' 
          : 'z-20 postit-shadow cursor-grab hover:z-30'
      }`}
    >
      {/* 3D Pushpin on top center */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <PushPin 
          color={postIt.pinColor || (postIt.level === 0 ? 'red' : 'wood')} 
          hasYarn={hasYarn} 
        />
      </div>

      {/* Main Post-it Paper Card */}
      <div 
        className={`relative rounded-sm border ${colorStyle.bg} ${colorStyle.border} ${colorStyle.text} p-3.5 pt-4 transition-all overflow-hidden flex flex-col justify-between`}
      >
        {/* Subtle curled corner paper effect at bottom right */}
        <div 
          className="absolute bottom-0 right-0 w-4 h-4 bg-black/5 pointer-events-none"
          style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }}
        />

        {/* Header: Level Badge & Action Controls */}
        <div className="flex items-center justify-between gap-1 mb-2">
          {/* Hierarchy Indicator Tag */}
          <div className="flex items-center gap-1.5 overflow-hidden">
            {postIt.level === 0 ? (
              <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/10 text-neutral-800">
                ★ Haupt-Thema
              </span>
            ) : postIt.level === 1 ? (
              <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-black/5 flex items-center gap-0.5 opacity-80">
                <CornerDownRight className="w-2.5 h-2.5" />
                <span>Antwort</span>
              </span>
            ) : (
              <span className="text-[8px] font-semibold px-1 py-0.2 rounded bg-black/5 flex items-center gap-0.5 opacity-70">
                <CornerDownRight className="w-2 h-2" />
                <span>Ebene {postIt.level}</span>
              </span>
            )}
          </div>

          {/* Quick Note Tool Icons */}
          <div className="flex items-center gap-0.5 no-drag opacity-60 group-hover:opacity-100 transition-opacity">
            {/* Color Palette Toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-1 rounded hover:bg-black/10 text-neutral-700 transition"
                title="Farbe ändern"
              >
                <Palette className="w-3.5 h-3.5" />
              </button>

              {showColorPicker && (
                <div className="absolute right-0 top-6 z-50 p-1.5 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-neutral-200 flex gap-1 items-center animate-in fade-in zoom-in-95">
                  {AVAILABLE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        onUpdate({ ...postIt, color: c, updatedAt: Date.now() });
                        setShowColorPicker(false);
                      }}
                      className={`w-5 h-5 rounded-full border border-black/20 ${COLOR_CLASSES[c].bg} hover:scale-110 transition ${postIt.color === c ? 'ring-2 ring-indigo-500 scale-105' : ''}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Edit Button */}
            <button
              type="button"
              onClick={() => {
                setEditTitle(postIt.title || '');
                setEditContent(postIt.content || '');
                setIsEditing(!isEditing);
              }}
              className="p-1 rounded hover:bg-black/10 text-neutral-700 transition"
              title="Bearbeiten"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            {/* Delete Button */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Dieses Post-it wirklich von der Pinnwand entfernen?')) {
                  onDelete(postIt.id);
                }
              }}
              className="p-1 rounded hover:bg-rose-500/20 text-rose-800 transition"
              title="Löschen"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {isEditing ? (
          <div className="space-y-2 no-drag my-1">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Titel (optional)..."
              className="w-full px-2 py-1 text-xs font-bold rounded bg-white/70 border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <textarea
              rows={3}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Notizinhalt..."
              className="w-full px-2 py-1 text-xs rounded bg-white/70 border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
            />
            <div className="flex justify-end gap-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-2 py-0.5 text-[11px] rounded bg-neutral-200 hover:bg-neutral-300 text-neutral-700"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-2 py-0.5 text-[11px] font-bold rounded bg-neutral-900 hover:bg-black text-white flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                <span>Speichern</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 my-0.5">
            {postIt.title && (
              <h3 className={`font-bold tracking-tight leading-snug break-words ${
                postIt.level === 0 ? 'text-sm' : postIt.level === 1 ? 'text-xs font-extrabold' : 'text-[11px]'
              }`}>
                {postIt.title}
              </h3>
            )}
            
            {postIt.content && (
              <p className={`whitespace-pre-wrap leading-relaxed break-words font-medium opacity-90 ${
                postIt.level === 0 ? 'text-xs' : 'text-[11px]'
              }`}>
                {postIt.content}
              </p>
            )}

            {/* Poll Component (if type is poll) */}
            {postIt.type === 'poll' && (
              <div className="mt-2 pt-2 border-t border-black/10 no-drag space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold opacity-80">
                  <span className="flex items-center gap-1">
                    <Vote className="w-3.5 h-3.5" />
                    <span>{postIt.pollQuestion || 'Umfrage'}</span>
                  </span>
                  <span className="text-[10px] opacity-75">{totalVotes} Stimmen</span>
                </div>

                {/* Poll Options List */}
                <div className="space-y-1.5">
                  {(postIt.pollOptions || []).map((opt) => {
                    const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                    const hasVoted = (opt.voterIds || []).includes(currentUserId);

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onVote(postIt.id, opt.id)}
                        className={`w-full text-left relative overflow-hidden rounded-md border p-1.5 transition text-xs font-semibold cursor-pointer ${
                          hasVoted 
                            ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold shadow-2xs' 
                            : 'border-black/10 bg-white/50 hover:bg-white/80 text-neutral-800'
                        }`}
                      >
                        {/* Progress Fill Bar */}
                        <div 
                          className="absolute inset-y-0 left-0 bg-indigo-500/20 transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />

                        <div className="relative flex items-center justify-between gap-2 z-10">
                          <span className="truncate pr-1">{opt.text}</span>
                          <span className="text-[10px] font-mono shrink-0 opacity-80">
                            {percentage}% ({opt.votes})
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Add new option */}
                {showAddOption ? (
                  <div className="flex items-center gap-1 pt-1">
                    <input
                      type="text"
                      value={newOptionText}
                      onChange={(e) => setNewOptionText(e.target.value)}
                      placeholder="Neue Option..."
                      className="flex-1 px-1.5 py-0.5 text-[11px] rounded bg-white/80 border border-neutral-300 focus:outline-none"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddPollOption()}
                    />
                    <button
                      type="button"
                      onClick={handleAddPollOption}
                      className="p-1 rounded bg-neutral-800 text-white hover:bg-black text-[10px]"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddOption(false)}
                      className="p-1 rounded bg-neutral-200 hover:bg-neutral-300 text-neutral-700 text-[10px]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddOption(true)}
                    className="text-[10px] font-bold text-neutral-700 hover:text-black flex items-center gap-1 opacity-75 hover:opacity-100 transition pt-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Option hinzufügen</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer: Author, Timestamp, Reactions & Reply Button */}
        <div className="mt-3 pt-2 border-t border-black/10 flex flex-col gap-2">
          {/* Author & Timestamp */}
          <div className="flex items-center justify-between text-[10px] opacity-75 font-medium">
            <div className="flex items-center gap-1 truncate">
              <span className="w-3.5 h-3.5 rounded-full bg-black/15 flex items-center justify-center font-bold text-[8px] uppercase shrink-0">
                {postIt.author ? postIt.author.charAt(0) : '?'}
              </span>
              <span className="truncate">{postIt.author || 'Anonym'}</span>
            </div>
            <span className="shrink-0">{timeFormatted}</span>
          </div>

          {/* Reactions Row & Reply Action */}
          <div className="flex items-center justify-between gap-1 no-drag">
            {/* Quick Emoji Reaction Badges */}
            <div className="flex items-center gap-1 flex-wrap">
              {/* Active Reactions */}
              {Object.entries(postIt.reactions || {}).map(([emoji, count]) => {
                if (count <= 0) return null;
                const hasReacted = ((postIt.votedReactions || {})[emoji] || []).includes(currentUserId);
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => onReact(postIt.id, emoji)}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-bold transition ${
                      hasReacted 
                        ? 'bg-amber-400/40 text-amber-950 border border-amber-500/40 scale-105' 
                        : 'bg-black/5 hover:bg-black/10 text-neutral-800'
                    }`}
                  >
                    <span>{emoji}</span>
                    <span className="text-[9px]">{count}</span>
                  </button>
                );
              })}

              {/* Emoji Picker Popover Toggle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-1 rounded-full hover:bg-black/10 text-neutral-600 transition"
                  title="Reaktion hinzufügen"
                >
                  <Smile className="w-3.5 h-3.5" />
                </button>

                {showEmojiPicker && (
                  <div className="absolute left-0 bottom-7 z-50 p-1.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-neutral-200 flex gap-1 items-center animate-in fade-in slide-in-from-bottom-2">
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          onReact(postIt.id, emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="text-base p-1 hover:scale-125 transition active:scale-95"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* "+ Antworten" Button (Hierarchische Verzweigung mit Wollfaden) */}
            <button
              type="button"
              onClick={() => onReply(postIt)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-black/10 hover:bg-black/20 text-neutral-900 text-[10px] font-bold transition shrink-0 cursor-pointer"
              title="Kommentar oder Antwort anheften"
            >
              <CornerDownRight className="w-3 h-3 text-red-600" />
              <span>Antworten</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
