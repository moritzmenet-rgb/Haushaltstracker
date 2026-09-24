import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Fish, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { TaskItem } from '../types';

interface FishingModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem;
  onFish: (taskId: string, untilDate: string) => void;
}

export const FishingModal: React.FC<FishingModalProps> = ({
  isOpen,
  onClose,
  task,
  onFish
}) => {
  const [days, setDays] = useState(1);

  if (!isOpen) return null;

  const handleFish = () => {
    const untilDate = new Date();
    untilDate.setDate(untilDate.getDate() + days);
    // Set to end of day
    untilDate.setHours(23, 59, 59, 999);
    onFish(task.id, untilDate.toISOString());
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-md bg-[var(--m3-surface-container-high)] rounded-[32px] overflow-hidden shadow-2xl border border-[var(--m3-outline-variant)]"
        >
          {/* Header */}
          <div className="p-6 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)]">
                <Fish className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[var(--m3-on-surface)]">Aufgabe fischen</h2>
                <p className="text-xs text-[var(--m3-on-surface-variant)] font-medium">Reserviere diese Aufgabe für dich</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[var(--m3-surface-variant)] text-[var(--m3-on-surface-variant)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 pt-4 space-y-6">
            {/* Task Info */}
            <div className="p-4 rounded-2xl bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)]">
              <h3 className="font-bold text-[var(--m3-on-surface)]">{task.title}</h3>
              <p className="text-xs text-[var(--m3-on-surface-variant)] mt-1">{task.category} • +{task.base_points} Pkt.</p>
            </div>

            {/* Duration Selector */}
            <div className="space-y-3">
              <label className="text-xs font-black text-[var(--m3-on-surface-variant)] uppercase tracking-wider px-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--m3-primary)]" />
                <span>Wie lange möchtest du reservieren?</span>
              </label>
              
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                      days === d
                        ? 'bg-[var(--m3-primary-container)] border-[var(--m3-primary)] text-[var(--m3-on-primary-container)]'
                        : 'bg-[var(--m3-surface)] border-[var(--m3-outline-variant)] text-[var(--m3-on-surface-variant)] hover:border-[var(--m3-outline)]'
                    }`}
                  >
                    <span className="text-lg font-black">{d}</span>
                    <span className="text-[10px] font-bold uppercase">{d === 1 ? 'Tag' : 'Tage'}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-[var(--m3-on-surface-variant)] italic text-center">
                Maximale Reservierungsdauer beträgt 3 Tage.
              </p>
            </div>

            {/* Warning/Info */}
            <div className="flex gap-3 p-3 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-500/20 text-xs">
              <Clock className="w-4 h-4 shrink-0" />
              <p>Während die Aufgabe gefischt ist, kann sie von niemandem (auch nicht von dir) geloggt werden, bis die Frist abläuft oder die Reservierung aufgehoben wird.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 pt-2 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-2xl bg-[var(--m3-surface-variant)] text-[var(--m3-on-surface-variant)] text-sm font-black hover:bg-[var(--m3-surface-variant)]/80 transition-all"
            >
              Abbrechen
            </button>
            <button
              onClick={handleFish}
              className="flex-1 px-6 py-3 rounded-2xl bg-[var(--m3-primary)] text-[var(--m3-on-primary)] text-sm font-black shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Fischen</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
