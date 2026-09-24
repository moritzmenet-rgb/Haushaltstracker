import React, { useState, useEffect } from 'react';
import { 
  X, 
  Pin, 
  CornerDownRight, 
  Vote, 
  Plus, 
  Trash2, 
  Sparkles, 
  Check,
  Tag
} from 'lucide-react';
import { PinnwandNote, PinnwandPoll, PostItColor } from '../../types';

interface PinnwandNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentNote?: PinnwandNote | null;
  noteToEdit?: PinnwandNote | null;
  categories: string[];
  onSubmit: (data: {
    title?: string;
    content: string;
    color: PostItColor;
    category?: string;
    poll?: PinnwandPoll;
    parentId?: string | null;
    rootId?: string;
  }) => Promise<any>;
}

const COLOR_OPTIONS: Array<{ id: PostItColor; label: string; bg: string; border: string }> = [
  { id: 'yellow', label: 'Gelb', bg: 'bg-[#FEF08A]', border: 'border-yellow-400' },
  { id: 'pink', label: 'Rosa', bg: 'bg-[#FBCFE8]', border: 'border-pink-400' },
  { id: 'blue', label: 'Blau', bg: 'bg-[#BAE6FD]', border: 'border-sky-400' },
  { id: 'green', label: 'Grün', bg: 'bg-[#BBF7D0]', border: 'border-emerald-400' },
  { id: 'orange', label: 'Orange', bg: 'bg-[#FED7AA]', border: 'border-orange-400' },
  { id: 'purple', label: 'Lila', bg: 'bg-[#E9D5FF]', border: 'border-purple-400' },
];

export const PinnwandNoteModal: React.FC<PinnwandNoteModalProps> = ({
  isOpen,
  onClose,
  parentNote,
  noteToEdit,
  categories,
  onSubmit
}) => {
  const isReply = Boolean(parentNote);
  const isEditing = Boolean(noteToEdit);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState<PostItColor>('yellow');
  const [category, setCategory] = useState('Allgemein');
  
  // Poll state
  const [hasPoll, setHasPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (noteToEdit) {
      setTitle(noteToEdit.title || '');
      setContent(noteToEdit.content || '');
      setColor(noteToEdit.color || 'yellow');
      setCategory(noteToEdit.category || 'Allgemein');
      if (noteToEdit.poll) {
        setHasPoll(true);
        setPollQuestion(noteToEdit.poll.question || '');
        setPollOptions(noteToEdit.poll.options.map(o => o.text));
        setAllowMultiple(Boolean(noteToEdit.poll.allowMultiple));
      } else {
        setHasPoll(false);
        setPollQuestion('');
        setPollOptions(['', '']);
        setAllowMultiple(false);
      }
    } else if (parentNote) {
      // Replying
      setTitle('');
      setContent('');
      // Alternate color from parent note for contrast
      const colors: PostItColor[] = ['pink', 'blue', 'green', 'orange', 'yellow', 'purple'];
      const nextColor = colors.find(c => c !== parentNote.color) || 'pink';
      setColor(nextColor);
      setCategory(parentNote.category || 'Allgemein');
      setHasPoll(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setAllowMultiple(false);
    } else {
      // Fresh new root topic
      setTitle('');
      setContent('');
      setColor('yellow');
      setCategory(categories[0] || 'Allgemein');
      setHasPoll(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setAllowMultiple(false);
    }
    setError(null);
  }, [isOpen, parentNote, noteToEdit, categories]);

  if (!isOpen) return null;

  const handleAddPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemovePollOption = (idx: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
    }
  };

  const handlePollOptionChange = (idx: number, val: string) => {
    const next = [...pollOptions];
    next[idx] = val;
    setPollOptions(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Bitte schreibe einen Text für dein Post-It.');
      return;
    }

    if (!isReply && !isEditing && !title.trim()) {
      setError('Bitte gib dem Thema einen kurzen Titel.');
      return;
    }

    let pollPayload: PinnwandPoll | undefined = undefined;
    if (hasPoll) {
      const validOptions = pollOptions.map(o => o.trim()).filter(Boolean);
      if (!pollQuestion.trim()) {
        setError('Bitte gib der Abstimmung eine Frage oder Überschrift.');
        return;
      }
      if (validOptions.length < 2) {
        setError('Eine Abstimmung benötigt mindestens 2 Optionen.');
        return;
      }

      // Preserve existing voter IDs if editing
      const existingOptions = noteToEdit?.poll?.options || [];
      pollPayload = {
        question: pollQuestion.trim(),
        options: validOptions.map((text, idx) => ({
          id: existingOptions[idx]?.id || `opt_${idx + 1}_${Date.now()}`,
          text,
          voterIds: existingOptions[idx]?.voterIds || []
        })),
        allowMultiple,
        closed: noteToEdit?.poll?.closed || false
      };
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        title: title.trim() || undefined,
        content: content.trim(),
        color,
        category: category.trim() || 'Allgemein',
        poll: pollPayload,
        parentId: isReply && parentNote ? parentNote.id : (noteToEdit?.parentId || null),
        rootId: isReply && parentNote ? (parentNote.rootId || parentNote.id) : (noteToEdit?.rootId)
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Fehler beim Speichern der Notiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="w-full max-w-lg m3-dialog overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[var(--m3-outline-variant)]/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600">
              {isReply ? (
                <CornerDownRight className="w-5 h-5 stroke-[2.5]" />
              ) : (
                <Pin className="w-5 h-5 fill-current" />
              )}
            </div>
            <div>
              <h3 className="text-base font-black text-[var(--m3-on-surface)] leading-tight">
                {isEditing 
                  ? 'Post-it bearbeiten' 
                  : isReply 
                  ? 'Faden spinnen & antworten' 
                  : 'Neues Thema anheften'}
              </h3>
              <p className="text-xs text-[var(--m3-on-surface-variant)]">
                {isReply 
                  ? 'Antwort wird mit einem roten Faden angeheftet' 
                  : 'Startet ein neues Post-It Thema auf der Pinnwand'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--m3-on-surface-variant)] hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Parent Note Preview if Replying */}
        {isReply && parentNote && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-black/4 dark:bg-white/4 border border-black/8 dark:border-white/8 flex items-start gap-2.5">
            <CornerDownRight className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[var(--m3-on-surface)]">
                <span>Antwort auf {parentNote.authorName}</span>
                {parentNote.title && (
                  <span className="text-slate-500 truncate">({parentNote.title})</span>
                )}
              </div>
              <p className="text-[var(--m3-on-surface-variant)] italic line-clamp-2 mt-0.5">
                "{parentNote.content}"
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold">
              {error}
            </div>
          )}

          {/* Color Selector */}
          <div>
            <label className="block text-xs font-bold text-[var(--m3-on-surface)] mb-2">
              Post-It Farbe wählen:
            </label>
            <div className="flex items-center gap-2.5">
              {COLOR_OPTIONS.map((c) => {
                const isSelected = color === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    className={`w-9 h-9 rounded-2xl ${c.bg} border-2 ${
                      isSelected ? 'border-zinc-900 dark:border-white scale-110 shadow-md ring-2 ring-rose-500/50' : 'border-black/15 hover:scale-105'
                    } flex items-center justify-center transition-all cursor-pointer`}
                    title={c.label}
                  >
                    {isSelected && <Check className="w-4 h-4 text-zinc-900 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title (Mandatory for Root, Optional for replies) */}
          <div>
            <label className="block text-xs font-bold text-[var(--m3-on-surface)] mb-1.5">
              {isReply ? 'Titel / Kicker (optional)' : 'Thema / Titel *'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isReply ? 'z. B. Meine Idee dazu...' : 'z. B. Was kochen wir am Wochenende?'}
              maxLength={150}
              className="w-full px-4 py-2.5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] text-xs font-bold text-[var(--m3-on-surface)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Content Body */}
          <div>
            <label className="block text-xs font-bold text-[var(--m3-on-surface)] mb-1.5">
              Notiztext *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isReply ? 'Schreibe deine Antwort...' : 'Schreibe Gedanken, Details oder Anweisungen...'}
              rows={4}
              maxLength={3000}
              required
              className="w-full px-4 py-3 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] text-xs font-medium text-[var(--m3-on-surface)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none leading-relaxed"
            />
            <div className="flex justify-end mt-1 text-[10px] text-[var(--m3-on-surface-variant)]">
              {content.length} / 3000 Zeichen
            </div>
          </div>

          {/* Category Tag Picker */}
          <div>
            <label className="block text-xs font-bold text-[var(--m3-on-surface)] mb-1.5">
              Kategorie / Tag:
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {['Allgemein', 'Essen & Kochen', 'Haushalt', 'Idee', 'Freizeit', 'Wichtig'].map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--m3-primary)] text-[var(--m3-on-primary)] shadow-xs'
                        : 'bg-[var(--m3-surface)] hover:bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface-variant)] border border-[var(--m3-outline-variant)]/60'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Poll Accordion Toggle */}
          <div className="pt-2 border-t border-[var(--m3-outline-variant)]/40">
            <button
              type="button"
              onClick={() => setHasPoll(!hasPoll)}
              className={`w-full py-2.5 px-4 rounded-2xl border transition flex items-center justify-between gap-3 text-xs font-black cursor-pointer ${
                hasPoll
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-300'
                  : 'bg-[var(--m3-surface)] hover:bg-[var(--m3-surface-container-high)] border-[var(--m3-outline-variant)] text-[var(--m3-on-surface)]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Vote className="w-4 h-4 text-rose-600" />
                <span>{hasPoll ? 'Abstimmung aktiv ✓' : 'Abstimmung zu diesem Post-it hinzufügen'}</span>
              </div>
              <span className="text-[11px] underline">
                {hasPoll ? 'Entfernen' : '+ Hinzufügen'}
              </span>
            </button>

            {/* Poll Builder Inputs */}
            {hasPoll && (
              <div className="mt-3 p-4 rounded-2xl bg-black/4 dark:bg-white/4 border border-black/8 dark:border-white/8 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--m3-on-surface)] mb-1">
                    Frage der Abstimmung:
                  </label>
                  <input
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="z. B. Was wollen wir kochen?"
                    maxLength={120}
                    className="w-full px-3.5 py-2 rounded-xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] text-xs font-bold text-[var(--m3-on-surface)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--m3-on-surface)] mb-1.5">
                    Antwort-Optionen (mindestens 2):
                  </label>
                  <div className="space-y-2">
                    {pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-5 text-center text-xs font-black text-slate-400">
                          {idx + 1}.
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                          placeholder={`Option ${idx + 1}`}
                          maxLength={80}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] text-xs font-bold text-[var(--m3-on-surface)] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                        {pollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePollOption(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                            title="Option entfernen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {pollOptions.length < 6 && (
                    <button
                      type="button"
                      onClick={handleAddPollOption}
                      className="mt-2 text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Weitere Option hinzufügen</span>
                    </button>
                  )}
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allowMultiplePoll"
                    checked={allowMultiple}
                    onChange={(e) => setAllowMultiple(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <label htmlFor="allowMultiplePoll" className="text-xs font-bold text-[var(--m3-on-surface)] cursor-pointer">
                    Mehrfachauswahl erlauben
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl border border-[var(--m3-outline-variant)] hover:bg-black/5 dark:hover:bg-white/5 text-xs font-bold text-[var(--m3-on-surface-variant)] transition cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-lg shadow-rose-600/20 transition active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isReply ? (
                <>
                  <CornerDownRight className="w-4 h-4 stroke-[2.5]" />
                  <span>Antwort anheften</span>
                </>
              ) : (
                <>
                  <Pin className="w-4 h-4 fill-current" />
                  <span>Thema anpinnen</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
