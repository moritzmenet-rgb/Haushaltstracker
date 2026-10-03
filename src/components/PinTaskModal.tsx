import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pin, Sparkles, X, Check, PinOff, Award, AlertCircle, Bell } from 'lucide-react';
import { TaskItem } from '../types';
import { useApp } from '../context/AppContext';

interface PinTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem | null;
}

export const PinTaskModal: React.FC<PinTaskModalProps> = ({
  isOpen,
  onClose,
  task
}) => {
  const { togglePinTask, updateTask, sendNotification, activeUser } = useApp();
  const [bonusEnabled, setBonusEnabled] = useState(true);
  const [bonusPoints, setBonusPoints] = useState<number>(2);
  const [notifyUsers, setNotifyUsers] = useState<boolean>(true);

  useEffect(() => {
    if (task) {
      const currentBonus = task.pinned_bonus_points ?? 0;
      if (currentBonus > 0) {
        setBonusEnabled(true);
        setBonusPoints(currentBonus);
      } else if (task.is_pinned) {
        setBonusEnabled(false);
        setBonusPoints(2);
      } else {
        setBonusEnabled(true);
        setBonusPoints(2);
      }
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const isCurrentlyPinned = !!task.is_pinned;

  const handleConfirmPin = async () => {
    const finalBonus = bonusEnabled ? Math.max(1, Number(bonusPoints) || 1) : 0;
    await updateTask(task.id, {
      is_pinned: true,
      pinned_bonus_points: finalBonus
    });

    if (notifyUsers) {
      await sendNotification({
        type: 'task_pinned',
        title: '📌 Neue angepinnte Aufgabe!',
        message: `${activeUser?.name || 'Jemand'} hat die Aufgabe "${task.title}" angepinnt${finalBonus > 0 ? ` (+${finalBonus} Bonus-Punkte!)` : ''}.`,
        senderId: activeUser?.id,
        senderName: activeUser?.name,
        read: false
      });
    }

    onClose();
  };

  const handleUnpin = async () => {
    await updateTask(task.id, {
      is_pinned: false,
      pinned_bonus_points: 0
    });
    onClose();
  };

  const presetBonuses = [1, 2, 3, 5, 10, 20, 50];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
          className="w-full max-w-md m3-dialog overflow-hidden shadow-2xl my-auto"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-[var(--m3-outline-variant)]/60 flex items-center justify-between bg-[var(--m3-surface-container-highest)]/40">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                <Pin className="w-5 h-5 fill-current rotate-12" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[var(--m3-on-surface)] leading-tight">
                  {isCurrentlyPinned ? 'Pin & Bonus bearbeiten' : 'Als dringend anpinnen'}
                </h2>
                <p className="text-xs text-[var(--m3-on-surface-variant)] mt-0.5 font-medium">
                  Erscheint ganz oben in der Haushalts-Übersicht
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-highest)] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {/* Task Info Pill */}
            <div className="p-3.5 rounded-2xl bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--m3-outline)] block">
                  Aufgabe
                </span>
                <h3 className="text-sm font-bold text-[var(--m3-on-surface)] truncate">
                  {task.title}
                </h3>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-black text-[var(--m3-primary)] bg-[var(--m3-primary-container)] px-2.5 py-1 rounded-xl">
                  +{task.base_points} Basis
                </span>
              </div>
            </div>

            {/* Bonus Toggle Card */}
            <div className="p-4 rounded-2xl bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-[var(--m3-on-surface)] block">
                      Zusätzlichen Punktebonus vergeben?
                    </span>
                    <span className="text-[11px] text-[var(--m3-on-surface-variant)]">
                      Wird bei Erledigung ohne Sternenabzug addiert
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={bonusEnabled}
                    onChange={(e) => setBonusEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-300 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Bonus Amount Configuration */}
              {bonusEnabled ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-3 border-t border-[var(--m3-outline-variant)]/60 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[var(--m3-on-surface-variant)]">
                      Bonus-Punkte:
                    </span>
                    <div className="flex items-center gap-1.5 bg-[var(--m3-surface)] px-3 py-1.5 rounded-xl border border-amber-500/40">
                      <span className="text-xs font-black text-amber-600 dark:text-amber-400">+</span>
                      <input
                        type="number"
                        min="1"
                        max="500"
                        step="1"
                        value={bonusPoints}
                        onChange={(e) => setBonusPoints(Math.max(1, Number(e.target.value) || 1))}
                        className="w-16 text-right bg-transparent text-sm font-black text-amber-600 dark:text-amber-400 focus:outline-none"
                      />
                      <span className="text-xs text-[var(--m3-outline)] font-bold">Pkt.</span>
                    </div>
                  </div>

                  {/* Preset quick select buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-[var(--m3-outline)] font-bold mr-1">Schnellwahl:</span>
                    {presetBonuses.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setBonusPoints(p)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-black transition ${
                          bonusPoints === p
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-[var(--m3-surface)] text-[var(--m3-on-surface-variant)] border border-[var(--m3-outline-variant)] hover:bg-[var(--m3-surface-container-high)]'
                        }`}
                      >
                        +{p}
                      </button>
                    ))}
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-medium space-y-1">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                      <span>Voller Bonus wird garantiert ohne Sternenabzug addiert:</span>
                    </div>
                    <div className="pl-6 text-[11px] opacity-90">
                      Basis {task.base_points} Pkt. + Bonus {bonusPoints} Pkt. = <strong>{task.base_points + bonusPoints} Punkte</strong> bei Erledigung!
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="pt-2 text-[11px] text-[var(--m3-outline)] italic">
                  Aufgabe wird ohne Extrapunkte oben angepinnt (nur Basis-Punkte).
                </div>
              )}
            </div>

            {/* Notification Toggle Card */}
            <div className="p-4 rounded-2xl bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-[var(--m3-on-surface)] block">
                    Familie benachrichtigen?
                  </span>
                  <span className="text-[11px] text-[var(--m3-on-surface-variant)]">
                    Sendet eine Push/In-App-Meldung an alle Mitglieder
                  </span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={notifyUsers}
                  onChange={(e) => setNotifyUsers(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-300 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-2">
              {isCurrentlyPinned ? (
                <button
                  type="button"
                  onClick={handleUnpin}
                  className="px-4 py-2.5 rounded-full text-xs font-bold text-rose-600 hover:bg-rose-500/10 transition flex items-center gap-1.5"
                >
                  <PinOff className="w-3.5 h-3.5" />
                  <span>Pin lösen</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-full text-xs font-bold text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-highest)] transition"
                >
                  Abbrechen
                </button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  onClick={handleConfirmPin}
                  className="m3-btn-filled px-5 py-2.5 text-xs font-black bg-amber-500 hover:bg-amber-600 text-white shadow-md flex items-center gap-1.5"
                >
                  <Pin className="w-3.5 h-3.5 fill-current rotate-12" />
                  <span>{isCurrentlyPinned ? 'Speichern' : 'Jetzt anpinnen 📌'}</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
