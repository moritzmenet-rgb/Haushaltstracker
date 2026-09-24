import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckSquare, X, Clock, Award, Calendar, Layers, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TaskItem } from '../types';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: TaskItem | null;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  taskToEdit
}) => {
  const { data, createTask, updateTask, deleteTask, isAdmin } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [basePoints, setBasePoints] = useState(30);
  const [estimatedDuration, setEstimatedDuration] = useState(15);
  const [intervalDays, setIntervalDays] = useState(7);
  const [frequencyPerDay, setFrequencyPerDay] = useState(1);
  const [preferredTime, setPreferredTime] = useState<'morning' | 'noon' | 'evening' | null>(null);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description);
      setCategory(taskToEdit.category);
      setBasePoints(taskToEdit.base_points);
      setEstimatedDuration(taskToEdit.estimated_duration);
      setIntervalDays(taskToEdit.interval_days);
      setFrequencyPerDay(taskToEdit.frequency_per_day || 1);
      setPreferredTime(taskToEdit.preferred_time || null);
    } else {
      setTitle('');
      setDescription('');
      setCategory(data.settings.categories[0] || 'Allgemein');
      setBasePoints(30);
      setEstimatedDuration(15);
      setIntervalDays(7);
      setFrequencyPerDay(1);
      setPreferredTime(null);
    }
  }, [taskToEdit, isOpen, data.settings.categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category) return;

    try {
      if (taskToEdit) {
        await updateTask(taskToEdit.id, {
          title: title.trim(),
          description: description.trim(),
          category,
          base_points: Number(basePoints) || 20,
          estimated_duration: Number(estimatedDuration) || 10,
          interval_days: Number(intervalDays) || 7,
          frequency_per_day: Number(frequencyPerDay) || 1,
          preferred_time: preferredTime
        });
      } else {
        await createTask({
          title: title.trim(),
          description: description.trim(),
          category,
          base_points: Number(basePoints) || 20,
          estimated_duration: Number(estimatedDuration) || 10,
          interval_days: Number(intervalDays) || 7,
          frequency_per_day: Number(frequencyPerDay) || 1,
          preferred_time: preferredTime
        });
      }
      onClose();
    } catch (err) {
      // Error handled by SyncOverlay/AppContext, but we prevent onClose if failed
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="w-full max-w-lg rounded-[28px] bg-[var(--m3-surface-container-high)] border border-[var(--m3-outline-variant)] shadow-2xl overflow-hidden my-12"
        >
          {/* M3 Dialog Header */}
          <div className="p-6 border-b border-[var(--m3-outline-variant)]/60 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] flex items-center justify-center shadow-xs">
                <CheckSquare className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[var(--m3-on-surface)] leading-tight">
                  {taskToEdit ? 'Aufgabe bearbeiten' : 'Neue Aufgabe anlegen'}
                </h2>
                <p className="text-xs text-[var(--m3-on-surface-variant)] mt-0.5">
                  Verwaltung für den Haushalts-Katalog
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-highest)] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-1.5">
                Titel der Aufgabe
              </label>
              <input
                type="text"
                required
                placeholder="z. B. Küche gründlich wischen"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-sm font-bold text-[var(--m3-on-surface)] placeholder-[var(--m3-outline)] focus:outline-none focus:ring-2 focus:ring-[var(--m3-primary)] shadow-xs transition"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-1.5">
                Beschreibung / Anleitung
              </label>
              <textarea
                rows={2}
                placeholder="Details zur Durchführung..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-xs font-medium text-[var(--m3-on-surface)] placeholder-[var(--m3-outline)] focus:outline-none focus:ring-2 focus:ring-[var(--m3-primary)] resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[var(--m3-primary)]" />
                <span>Kategorie</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-sm font-bold text-[var(--m3-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--m3-primary)] shadow-xs"
              >
                {data.settings.categories.map((c, idx) => {
                  const catName = typeof c === 'string' ? c : (c as any).name || `Kat ${idx}`;
                  return (
                    <option key={`opt-cat-${catName}-${idx}`} value={catName}>
                      {catName}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Parameters Grid with Stufenlos Continuous Adjustment */}
            <div className="space-y-4 p-5 rounded-2xl bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)]">
              {/* 1. Base Points (min 1, stufenlos) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[var(--m3-primary)]" />
                    <span>Basis-Punkte (ab 1 Pkt.)</span>
                  </label>
                  <div className="flex items-center gap-1 bg-[var(--m3-surface)] px-2.5 py-1 rounded-xl border border-[var(--m3-outline-variant)]">
                    <input
                      type="number"
                      min="1"
                      max="300"
                      step="1"
                      required
                      value={basePoints}
                      onChange={(e) => setBasePoints(Math.max(1, Number(e.target.value) || 1))}
                      className="w-14 text-right bg-transparent text-xs font-black text-[var(--m3-primary)] focus:outline-none"
                    />
                    <span className="text-[11px] text-[var(--m3-outline)] font-bold">Pkt.</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={Math.min(100, Math.max(1, basePoints))}
                  onChange={(e) => setBasePoints(Number(e.target.value))}
                  className="w-full m3-slider cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[var(--m3-outline)] font-bold mt-1">
                  <span>1 Pkt.</span>
                  <span>25 Pkt.</span>
                  <span>50 Pkt.</span>
                  <span>75 Pkt.</span>
                  <span>100+ Pkt.</span>
                </div>
              </div>

              {/* 2. Estimated Duration (min 1 Min, stufenlos) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[var(--m3-primary)]" />
                    <span>Geschätzte Dauer (Minuten)</span>
                  </label>
                  <div className="flex items-center gap-1 bg-[var(--m3-surface)] px-2.5 py-1 rounded-xl border border-[var(--m3-outline-variant)]">
                    <input
                      type="number"
                      min="1"
                      max="1440"
                      step="1"
                      required
                      value={estimatedDuration}
                      onChange={(e) => setEstimatedDuration(Math.max(1, Number(e.target.value) || 1))}
                      className="w-14 text-right bg-transparent text-xs font-black text-[var(--m3-on-surface)] focus:outline-none"
                    />
                    <span className="text-[11px] text-[var(--m3-outline)] font-bold">Min.</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="480"
                  step="5"
                  value={Math.min(480, Math.max(1, estimatedDuration))}
                  onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                  className="w-full m3-slider cursor-pointer"
                />
                {/* Quick preset chips */}
                <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                  <span className="text-[10px] text-[var(--m3-outline)] font-bold mr-1">Schnellwahl:</span>
                  {[5, 15, 30, 60, 120, 180, 240, 480].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setEstimatedDuration(mins)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg font-bold transition ${
                        estimatedDuration === mins
                          ? 'bg-[var(--m3-primary)] text-[var(--m3-on-primary)] shadow-xs'
                          : 'bg-[var(--m3-surface)] text-[var(--m3-on-surface-variant)] border border-[var(--m3-outline-variant)] hover:bg-[var(--m3-surface-container-highest)]'
                      }`}
                    >
                      {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Interval Days (min 1 Tag, stufenlos) */}
              <div className="space-y-4 pt-2 border-t border-[var(--m3-outline-variant)]/30">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[var(--m3-primary)]" />
                    <span>Wiederholungs-Intervall</span>
                  </label>
                  <div className="flex items-center gap-1 bg-[var(--m3-surface)] px-2.5 py-1 rounded-xl border border-[var(--m3-outline-variant)]">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      step="1"
                      required
                      value={intervalDays}
                      onChange={(e) => setIntervalDays(Math.max(1, Number(e.target.value) || 1))}
                      className="w-14 text-right bg-transparent text-xs font-black text-[var(--m3-on-surface)] focus:outline-none"
                    />
                    <span className="text-[11px] text-[var(--m3-outline)] font-bold">Tage</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={Math.min(30, Math.max(1, intervalDays))}
                  onChange={(e) => setIntervalDays(Number(e.target.value))}
                  className="w-full m3-slider cursor-pointer"
                />
                {/* Quick preset chips */}
                <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                  <span className="text-[10px] text-[var(--m3-outline)] font-bold mr-1">Schnellwahl:</span>
                  {[1, 7, 14, 30, 90, 180, 365].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setIntervalDays(days)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg font-bold transition ${
                        intervalDays === days
                          ? 'bg-[var(--m3-primary)] text-[var(--m3-on-primary)] shadow-xs'
                          : 'bg-[var(--m3-surface)] text-[var(--m3-on-surface-variant)] border border-[var(--m3-outline-variant)] hover:bg-[var(--m3-surface-container-highest)]'
                      }`}
                    >
                      {days === 1 ? 'Täglich' : days === 7 ? 'Wöchentlich' : days === 30 ? 'Monatlich' : days === 365 ? 'Jährlich' : `${days} Tage`}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Frequency per Day & Time of Day */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--m3-outline-variant)]/30">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-2">
                    Frequenz pro Tag
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFrequencyPerDay(num)}
                        className={`flex-1 py-2 rounded-xl text-xs font-black transition ${
                          frequencyPerDay === num
                            ? 'bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] border-2 border-[var(--m3-primary)]'
                            : 'bg-[var(--m3-surface)] text-[var(--m3-on-surface-variant)] border border-[var(--m3-outline-variant)]'
                        }`}
                      >
                        {num}x
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-2">
                    Tageszeit (Optional)
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[
                      { id: 'morning', label: 'Morgens' },
                      { id: 'noon', label: 'Mittags' },
                      { id: 'evening', label: 'Abends' }
                    ].map((time) => (
                      <button
                        key={time.id}
                        type="button"
                        onClick={() => setPreferredTime(preferredTime === time.id ? null : time.id as any)}
                        className={`flex-1 py-2 rounded-xl text-[9px] font-black transition leading-tight ${
                          preferredTime === time.id
                            ? 'bg-[var(--m3-secondary-container)] text-[var(--m3-on-secondary-container)] border-2 border-[var(--m3-secondary)]'
                            : 'bg-[var(--m3-surface)] text-[var(--m3-on-surface-variant)] border border-[var(--m3-outline-variant)]'
                        }`}
                      >
                        {time.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--m3-outline-variant)]/60">
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
                <span>{taskToEdit ? 'Änderungen speichern' : 'Aufgabe anlegen'}</span>
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
