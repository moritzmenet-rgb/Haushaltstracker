import React, { useState } from 'react';
import { X, Plus, Trash2, Vote, FileText, Check } from 'lucide-react';
import type { PostIt, PostItColor, PinColor, PostItType } from '../../types/pinnwand';

interface CreatePostItModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (postIt: Partial<PostIt>) => void;
  parentPostIt?: PostIt | null;
  defaultAuthor: string;
}

const AVAILABLE_COLORS: PostItColor[] = ['yellow', 'pink', 'green', 'blue', 'purple', 'orange', 'white'];
const PIN_COLORS: PinColor[] = ['red', 'wood', 'gold', 'blue', 'black'];

export const CreatePostItModal: React.FC<CreatePostItModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  parentPostIt = null,
  defaultAuthor
}) => {
  const [type, setType] = useState<PostItType>('standard');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState(defaultAuthor);
  const [color, setColor] = useState<PostItColor>('yellow');
  const [pinColor, setPinColor] = useState<PinColor>('red');
  
  // Poll state
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['Option 1', 'Option 2']);

  if (!isOpen) return null;

  const handleAddPollOption = () => {
    setPollOptions([...pollOptions, `Option ${pollOptions.length + 1}`]);
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length <= 2) return;
    setPollOptions(pollOptions.filter((_, i) => i !== index));
  };

  const handlePollOptionChange = (index: number, val: string) => {
    const updated = [...pollOptions];
    updated[index] = val;
    setPollOptions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !title.trim() && type !== 'poll') return;

    onCreate({
      type,
      title: title.trim(),
      content: content.trim(),
      author: author.trim() || 'Anonym',
      color,
      pinColor,
      pollQuestion: type === 'poll' ? (pollQuestion.trim() || title.trim() || 'Umfrage') : undefined,
      pollOptions: type === 'poll' ? pollOptions.filter(o => o.trim()).map((opt, i) => ({
        id: `opt-${Date.now()}-${i}`,
        text: opt.trim(),
        votes: 0,
        voterIds: []
      })) : undefined
    });

    onClose();
    // Reset form
    setTitle('');
    setContent('');
    setPollQuestion('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              {parentPostIt ? (
                <>
                  <span className="w-3 h-3 rounded-full bg-red-600 inline-block animate-pulse" />
                  <span>Antwort anheften</span>
                </>
              ) : (
                <>
                  <span>📌 Neues Post-it anheften</span>
                </>
              )}
            </h2>
            {parentPostIt && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Wird mit einem roten Wollfaden an &ldquo;{parentPostIt.title || parentPostIt.content.slice(0, 30)}...&rdquo; geknüpft
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto py-4 space-y-4 flex-1 pr-1">
          {/* Post-it Type Selector */}
          <div className="flex items-center gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
            <button
              type="button"
              onClick={() => setType('standard')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                type === 'standard' 
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Standard Notiz</span>
            </button>

            <button
              type="button"
              onClick={() => setType('poll')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                type === 'poll' 
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Vote className="w-4 h-4" />
              <span>Abstimmung / Umfrage</span>
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Titel {type === 'standard' ? '(optional)' : 'oder Thema'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={parentPostIt ? 'z. B. Meine Idee dazu...' : 'z. B. Neues Haupt-Thema...'}
              className="w-full px-3 py-2 text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Standard Content Text */}
          {type === 'standard' ? (
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Inhalt / Beschreibung
              </label>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Schreibe deine Gedanken auf diesen Zettel..."
                className="w-full px-3 py-2 text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                required
              />
            </div>
          ) : (
            /* Poll Form Fields */
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Abstimmungs-Frage
                </label>
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="z. B. Welches Datum passt euch am besten?"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Auswahl-Optionen
                </label>
                <div className="space-y-2">
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handlePollOptionChange(i, e.target.value)}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePollOption(i)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddPollOption}
                  className="mt-2 text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Option hinzufügen</span>
                </button>
              </div>
            </div>
          )}

          {/* Color Selection */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">
              Post-it Farbe
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {AVAILABLE_COLORS.map((c) => {
                const colorHex = {
                  yellow: '#fef08a',
                  pink: '#fecdd3',
                  green: '#bbf7d0',
                  blue: '#bae6fd',
                  purple: '#e9d5ff',
                  orange: '#fed7aa',
                  white: '#f5f5f5'
                }[c];

                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: colorHex }}
                    className={`w-7 h-7 rounded-xl border border-black/20 flex items-center justify-center transition cursor-pointer ${
                      color === c ? 'ring-2 ring-indigo-600 ring-offset-2 scale-110' : 'hover:scale-105'
                    }`}
                  >
                    {color === c && <Check className="w-3.5 h-3.5 text-neutral-800" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Author Name */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Dein Name
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Dein Name"
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition cursor-pointer"
            >
              Abbrechen
            </button>

            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <span>{parentPostIt ? 'Antwort anheften' : 'Post-it anheften'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
