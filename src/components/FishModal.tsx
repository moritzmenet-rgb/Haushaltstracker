import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Fish, X, Clock, Calendar, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TaskItem } from '../types';

interface FishModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem;
}

export const FishModal: React.FC<FishModalProps> = ({ isOpen, onClose, task }) => {
  const { fishTask, activeUser } = useApp();
  const [days, setDays] = useState(1);

  if (!isOpen || !activeUser) return null;

  const handleFish = async () => {
    await fishTask(task.id, activeUser.id, days);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-sm bg-[var(--m3-surface-container-high)] rounded-[32px] shadow-2xl border border-[var(--m3-outline-variant)] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                <Fish className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[var(--m3-on-surface)]">Aufgabe fischen</h2>
                <p className="text-xs text-[var(--m3-on-surface-variant)]">Diese Aufgabe für dich reservieren</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[var(--m3-surface-container-highest)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--m3-on-surface-variant)]" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="p-4 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)]">
              <p className="text-xs font-bold text-[var(--m3-primary)] mb-1 uppercase tracking-wider">Ausgewählte Aufgabe</p>
              <h3 className="text-base font-black text-[var(--m3-on-surface)]">{task.title}</h3>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-black text-[var(--m3-on-surface)] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>Wie lange reservieren? (Max. 3 Tage)</span>
              </label>
              
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    className={`py-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                      days === d
                        ? 'bg-indigo-500 border-indigo-600 text-white shadow-lg scale-105'
                        : 'bg-[var(--m3-surface)] border-[var(--m3-outline-variant)] text-[var(--m3-on-surface-variant)] hover:border-indigo-300'
                    }`}
                  >
                    <span className="text-lg font-black">{d}</span>
                    <span className="text-[10px] font-bold uppercase">{d === 1 ? 'Tag' : 'Tage'}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-[var(--m3-on-surface-variant)] text-center italic">
                Nach Ablauf der Zeit wird die Aufgabe wieder für alle freigegeben.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 pt-2 flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl text-xs font-black text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-highest)] transition"
            >
              Abbrechen
            </button>
            <button
              onClick={handleFish}
              className="flex-2 py-3 rounded-2xl bg-indigo-600 text-white text-xs font-black shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Jetzt fischen</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
