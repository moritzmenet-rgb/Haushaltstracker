import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  Clock, 
  Sparkles, 
  X, 
  Award, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  UserCheck, 
  AlertTriangle,
  Minus,
  Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { calculatePoints } from '../utils';
import { ChoreLog } from '../types';

interface LogChoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedTaskId?: string | null;
  logToEdit?: ChoreLog | null;
}

export const LogChoreModal: React.FC<LogChoreModalProps> = ({
  isOpen,
  onClose,
  preselectedTaskId,
  logToEdit
}) => {
  const { data, activeUser, isAdmin, logChore, updateLog, deleteLog } = useApp();
  const tasksList = Object.values(data.tasks);
  const membersList = Object.values(data.members);

  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [stars, setStars] = useState<1 | 2 | 3>(3);
  const [actualDuration, setActualDuration] = useState<number>(15);
  const [notes, setNotes] = useState<string>('');

  // Required justifications
  const [star2Reason, setStar2Reason] = useState<string>('');
  const [star3Highlight1, setStar3Highlight1] = useState<string>('');
  const [star3Highlight2, setStar3Highlight2] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const prevOpenRef = useRef(false);

  // Initialize on modal open transition
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setShowDeleteConfirm(false);
      setErrorMsg(null);

      if (logToEdit) {
        // EDIT MODE: Populate from existing log
        setSelectedTaskId(logToEdit.task_id);
        setSelectedUserId(logToEdit.user_id);
        setStars(logToEdit.stars);
        setActualDuration(logToEdit.actual_duration || 15);

        // Parse structured justifications out of notes if present
        let rawNote = logToEdit.notes || '';
        let s2 = '';
        let s3h1 = '';
        let s3h2 = '';

        if (rawNote.includes('[2 Sterne] Begründung:')) {
          const match = rawNote.match(/\[2 Sterne\] Begründung:\s*([^|]+)/);
          if (match) s2 = match[1].trim();
        }
        if (rawNote.includes('[3 Sterne] Highlights:')) {
          const match = rawNote.match(/\[3 Sterne\] Highlights:\s*1\)\s*([^•]+)•\s*2\)\s*([^|]+)/);
          if (match) {
            s3h1 = match[1].trim();
            s3h2 = match[2].trim();
          }
        }
        if (rawNote.includes('| Notiz:')) {
          const parts = rawNote.split('| Notiz:');
          rawNote = parts[1]?.trim() || '';
        } else if (rawNote.startsWith('[2 Sterne]') || rawNote.startsWith('[3 Sterne]')) {
          rawNote = '';
        }

        setStar2Reason(s2);
        setStar3Highlight1(s3h1);
        setStar3Highlight2(s3h2);
        setNotes(rawNote);
      } else {
        // NEW LOG MODE: Fresh defaults
        const initialTaskId = (preselectedTaskId && data.tasks[preselectedTaskId])
          ? preselectedTaskId
          : (tasksList[0]?.id || '');
        setSelectedTaskId(initialTaskId);
        setSelectedUserId(activeUser?.id || membersList[0]?.id || '');
        const est = initialTaskId && data.tasks[initialTaskId]
          ? data.tasks[initialTaskId].estimated_duration
          : 15;
        setActualDuration(est || 15);
        setStars(3);
        setNotes('');
        setStar2Reason('');
        setStar3Highlight1('');
        setStar3Highlight2('');
      }
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, logToEdit, preselectedTaskId, data.tasks, tasksList, activeUser, membersList]);

  if (!isOpen) return null;

  const currentTask = data.tasks[selectedTaskId];
  const mult1 = data.settings.star_multiplier_1 ?? 50;
  const mult2 = data.settings.star_multiplier_2 ?? 75;
  const mult3 = data.settings.star_multiplier_3 ?? 100;

  // Calculate live preview points
  const pointsPreview = currentTask
    ? calculatePoints(
        currentTask.base_points,
        stars,
        {
          star_multiplier_1: mult1,
          star_multiplier_2: mult2,
          star_multiplier_3: mult3
        }
      )
    : 0;

  const handleTaskChange = (taskId: string) => {
    setSelectedTaskId(taskId);
    if (!logToEdit) {
      const task = data.tasks[taskId];
      if (task) {
        setActualDuration(task.estimated_duration);
      }
    }
  };

  const handleAdjustDuration = (delta: number) => {
    setActualDuration(prev => Math.max(1, Math.min(180, prev + delta)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTaskId) {
      setErrorMsg('Bitte wähle eine Aufgabe aus.');
      return;
    }

    // Validation for justifications based on star count
    if (stars === 2) {
      if (!star2Reason.trim()) {
        setErrorMsg('Bitte beschreibe kurz, was du besser als nur "okay" bzw. besonders gut gemacht hast.');
        return;
      }
    } else if (stars === 3) {
      if (!star3Highlight1.trim() || !star3Highlight2.trim()) {
        setErrorMsg('Für 3 Sterne: Bitte nenne, was besonders gut war (wie 2★) UND was du zusätzlich MEHR als nötig erledigt hast.');
        return;
      }
    }

    setErrorMsg(null);

    // Format note including structured self-assessment arguments
    let finalNote = '';
    if (stars === 2) {
      finalNote = `[2★ Besonders gut] ${star2Reason.trim()}`;
    } else if (stars === 3) {
      finalNote = `[3★ Extrameile] Besonders gut: ${star3Highlight1.trim()} • Mehr als gemusst: ${star3Highlight2.trim()}`;
    }

    if (notes.trim()) {
      finalNote = finalNote ? `${finalNote} | Notiz: ${notes.trim()}` : notes.trim();
    }

    try {
      if (logToEdit) {
        // UPDATE EXISTING LOG
        await updateLog(logToEdit.log_id, {
          task_id: selectedTaskId,
          user_id: isAdmin && selectedUserId ? selectedUserId : logToEdit.user_id,
          stars,
          actual_duration: Number(actualDuration) || 10,
          notes: finalNote || undefined
        });
      } else {
        // CREATE NEW LOG
        await logChore(selectedTaskId, stars, Number(actualDuration) || 10, finalNote || undefined);
      }
      // ONLY CLOSE AFTER SUCCESS
      onClose();
    } catch (err) {
      setErrorMsg('Fehler beim Speichern. Bitte Internetverbindung prüfen.');
    }
  };

  const loggedMember = data.members[selectedUserId] || activeUser;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="w-full max-w-lg rounded-[28px] bg-[var(--m3-surface-container-high)] border border-[var(--m3-outline-variant)] shadow-2xl overflow-hidden my-12"
        >
          {/* M3 Dialog Header */}
          <div className="p-6 border-b border-[var(--m3-outline-variant)]/60 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] flex items-center justify-center shadow-xs">
                {logToEdit ? <Edit3 className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-xl font-black text-[var(--m3-on-surface)] leading-tight">
                  {logToEdit ? 'Eintrag bearbeiten' : 'Arbeit erfassen'}
                </h2>
                <div className="flex items-center gap-2 text-xs text-[var(--m3-on-surface-variant)] mt-0.5">
                  <span>Person:</span>
                  <span className="font-bold text-[var(--m3-on-surface)]">
                    {loggedMember?.name || 'Gast'}
                  </span>
                  {logToEdit && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--m3-secondary-container)] text-[var(--m3-on-secondary-container)] font-black">
                      Bearbeitungsmodus
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-highest)] transition"
              aria-label="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* If Admin in Edit Mode: Option to Reassign User */}
            {isAdmin && logToEdit && (
              <div className="p-4 rounded-2xl bg-[var(--m3-secondary-container)] text-[var(--m3-on-secondary-container)]">
                <label className="block text-xs font-black uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[var(--m3-primary)]" />
                  Zugewiesene Person (Admin-Recht)
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-xs font-bold text-[var(--m3-on-surface)] focus:ring-2 focus:ring-[var(--m3-primary)]"
                >
                  {membersList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role === 'admin' ? 'Admin' : 'Mitglied'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Task Selection */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-2">
                Aufgabe auswählen
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => handleTaskChange(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-sm font-bold text-[var(--m3-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--m3-primary)] shadow-xs transition"
              >
                {tasksList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.category} • {t.base_points} Pkt. Basis)
                  </option>
                ))}
              </select>
            </div>

            {/* Continuous Duration Slider (Stufenlos 1 Min bis 180 Min) */}
            <div className="p-4 rounded-2xl bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[var(--m3-primary)]" />
                  Tatsächliche Ausführungsdauer (stufenlos)
                </label>
                <div className="flex items-center gap-1.5 bg-[var(--m3-surface)] px-3 py-1 rounded-xl border border-[var(--m3-outline-variant)]">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={actualDuration}
                    onChange={(e) => setActualDuration(Math.max(1, Math.min(180, Number(e.target.value) || 1)))}
                    className="w-12 text-center text-sm font-black text-[var(--m3-on-surface)] bg-transparent focus:outline-none"
                  />
                  <span className="text-xs font-bold text-[var(--m3-outline)]">Minuten</span>
                </div>
              </div>

              {/* Expressive M3 Slider */}
              <div className="pt-2 px-1">
                <input
                  type="range"
                  min="1"
                  max="180"
                  step="1"
                  value={actualDuration}
                  onChange={(e) => setActualDuration(Number(e.target.value))}
                  className="w-full m3-slider cursor-pointer"
                />
              </div>

              {/* Quick +/- 5 min Buttons */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdjustDuration(-5)}
                    className="h-8 px-3 rounded-lg bg-[var(--m3-surface)] hover:bg-[var(--m3-surface-container-highest)] border border-[var(--m3-outline-variant)] text-xs font-bold text-[var(--m3-on-surface)] flex items-center gap-1 transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>-5 Min</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustDuration(5)}
                    className="h-8 px-3 rounded-lg bg-[var(--m3-surface)] hover:bg-[var(--m3-surface-container-highest)] border border-[var(--m3-outline-variant)] text-xs font-bold text-[var(--m3-on-surface)] flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+5 Min</span>
                  </button>
                </div>
                <div className="text-[11px] text-[var(--m3-outline)] font-medium">
                  Richtwert: {currentTask?.estimated_duration || 15} Min.
                </div>
              </div>
            </div>

            {/* Material 3 Expressive Segmented Buttons for Star Rating */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-2 flex items-center justify-between">
                <span>Selbsteinschätzung & Qualität</span>
                <span className="text-[11px] font-bold text-[var(--m3-primary)]">
                  {stars === 3 ? '100% Bonus (2★ + Extrameile)' : stars === 2 ? '75% Besonders gut' : '50% Basis (Standard)'}
                </span>
              </label>

              <div className="grid grid-cols-3 gap-2.5">
                {/* 1 Star */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  type="button"
                  onClick={() => setStars(1)}
                  className={`p-3.5 rounded-2xl border text-center transition-all ${
                    stars === 1
                      ? 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 shadow-xs ring-2 ring-rose-500/30'
                      : 'bg-[var(--m3-surface)] border-[var(--m3-outline-variant)] text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-high)]'
                  }`}
                >
                  <motion.div 
                    animate={stars === 1 ? { scale: [1, 1.45, 0.95, 1.15, 1], rotate: [0, -18, 18, -6, 0] } : {}}
                    transition={{ duration: 0.45 }}
                    className="flex justify-center mb-1 text-rose-500"
                  >
                    <Star className={`w-5 h-5 ${stars === 1 ? 'fill-rose-500' : ''}`} />
                  </motion.div>
                  <div className="text-xs font-black">1 Stern</div>
                  <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-0.5">{mult1}% Basis (Okay)</div>
                </motion.button>

                {/* 2 Stars */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  type="button"
                  onClick={() => setStars(2)}
                  className={`p-3.5 rounded-2xl border text-center transition-all ${
                    stars === 2
                      ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 shadow-xs ring-2 ring-amber-500/30'
                      : 'bg-[var(--m3-surface)] border-[var(--m3-outline-variant)] text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-high)]'
                  }`}
                >
                  <motion.div 
                    animate={stars === 2 ? { scale: [1, 1.35, 0.95, 1.1, 1], rotate: [0, 16, -16, 6, 0] } : {}}
                    transition={{ duration: 0.45 }}
                    className="flex justify-center mb-1 text-amber-500 gap-0.5"
                  >
                    <Star className={`w-5 h-5 ${stars >= 2 ? 'fill-amber-500' : ''}`} />
                    <Star className={`w-5 h-5 ${stars >= 2 ? 'fill-amber-500' : ''}`} />
                  </motion.div>
                  <div className="text-xs font-black">2 Sterne</div>
                  <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">{mult2}% Besonders gut</div>
                </motion.button>

                {/* 3 Stars */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  type="button"
                  onClick={() => setStars(3)}
                  className={`p-3.5 rounded-2xl border text-center transition-all ${
                    stars === 3
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs ring-2 ring-emerald-500/30'
                      : 'bg-[var(--m3-surface)] border-[var(--m3-outline-variant)] text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-high)]'
                  }`}
                >
                  <motion.div 
                    animate={stars === 3 ? { scale: [1, 1.4, 0.9, 1.15, 1], rotate: [0, -20, 20, -8, 0] } : {}}
                    transition={{ duration: 0.45 }}
                    className="flex justify-center mb-1 text-emerald-500 gap-0.5"
                  >
                    <Star className="w-5 h-5 fill-emerald-500" />
                    <Star className="w-5 h-5 fill-emerald-500" />
                    <Star className="w-5 h-5 fill-emerald-500" />
                  </motion.div>
                  <div className="text-xs font-black">3 Sterne</div>
                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{mult3}% Extrameile</div>
                </motion.button>
              </div>
            </div>

            {/* Conditional Justification Inputs */}
            {stars === 2 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-amber-800 dark:text-amber-300">
                    Was hast du besser als nur &quot;okay&quot; bzw. besonders gut gemacht?
                  </label>
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                    Pflichtfeld
                  </span>
                </div>
                <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80">
                  Sag kurz, worauf du geachtet hast oder was sauberer/gründlicher als normal geworden ist.
                </p>
                <input
                  type="text"
                  placeholder="z. B. Alle Ecken mitgewischt, Armaturen glänzend poliert, extra gründlich gesaugt..."
                  value={star2Reason}
                  onChange={(e) => setStar2Reason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--m3-surface)] border border-amber-500/40 text-xs font-semibold text-[var(--m3-on-surface)] focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                />
              </motion.div>
            )}

            {stars === 3 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-emerald-800 dark:text-emerald-300">
                      3-Sterne-Bonus: 2★ Qualität + noch MEHR als man eigentlich müsste!
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                      Pflichtfelder
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-900/80 dark:text-emerald-300/80 mt-0.5">
                    Für die vollen 100%: Was war besonders gut UND was hast du unaufgefordert zusätzlich erledigt?
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <span className="block text-[11px] font-bold text-emerald-900 dark:text-emerald-300 mb-1">
                      1. Was war besonders gut / gründlich (wie bei 2 Sternen)?
                    </span>
                    <input
                      type="text"
                      placeholder="z. B. Alle Flächen porentief sauber gewischt & desinfiziert"
                      value={star3Highlight1}
                      onChange={(e) => setStar3Highlight1(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[var(--m3-surface)] border border-emerald-500/40 text-xs font-semibold text-[var(--m3-on-surface)] focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                    />
                  </div>

                  <div>
                    <span className="block text-[11px] font-bold text-emerald-900 dark:text-emerald-300 mb-1">
                      2. Was hast du zusätzlich MEHR gemacht, als man eigentlich müsste (Extrameile)?
                    </span>
                    <input
                      type="text"
                      placeholder="z. B. Auch noch den Mülleimer ausgewaschen, Vorräte geordnet & Spiegel geputzt"
                      value={star3Highlight2}
                      onChange={(e) => setStar3Highlight2(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[var(--m3-surface)] border border-emerald-500/40 text-xs font-semibold text-[var(--m3-on-surface)] focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Optional Notes */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-1.5">
                Zusätzliche Notiz (optional)
              </label>
              <textarea
                rows={2}
                placeholder="Details oder Anmerkungen zur Durchführung..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-xs font-medium text-[var(--m3-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--m3-primary)]"
              />
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-[var(--m3-error-container)] text-[var(--m3-on-error-container)] text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Points Summary Banner */}
            <div className="p-4 rounded-2xl bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-bold opacity-80 uppercase tracking-wider block">
                  Ergebnis dieser Aufgabe
                </span>
                <span className="text-xs font-medium">
                  {currentTask?.base_points || 20} Basis × {stars === 3 ? mult3 : stars === 2 ? mult2 : mult1}%
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black tracking-tight text-[var(--m3-primary)]">
                  +{pointsPreview} Pkt.
                </span>
                <span className="text-[10px] text-[var(--m3-on-primary-container)]/70 block">
                  (mind. 1 Punkt garantiert)
                </span>
              </div>
            </div>

            {/* Action Buttons: Delete (if editing), Cancel & Submit */}
            <div className="flex items-center justify-between pt-2">
              {logToEdit ? (
                showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteLog(logToEdit.log_id);
                        onClose();
                      }}
                      className="px-3 py-2 bg-rose-600 text-white rounded-xl text-xs font-black"
                    >
                      Löschen bestätigen
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="text-xs font-bold text-[var(--m3-outline)]"
                    >
                      Abbrechen
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2.5 rounded-xl text-rose-600 hover:bg-rose-500/15 transition flex items-center gap-1.5 text-xs font-bold"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Löschen</span>
                  </button>
                )
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-highest)] transition"
                >
                  Abbrechen
                </button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  type="submit"
                  className="m3-btn-filled px-6 py-2.5 text-xs font-black"
                >
                  <span>{logToEdit ? 'Änderungen speichern' : 'Arbeit erfassen'}</span>
                </motion.button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
