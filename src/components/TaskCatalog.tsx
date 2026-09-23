import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckSquare, 
  Clock, 
  Award, 
  History, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  AlertCircle,
  Calendar,
  Sparkles,
  Check,
  Filter
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TaskItem } from '../types';
import { formatRelativeDate, getCategoryStyle, getTaskDueStatus } from '../utils';
import { ConfirmModal } from './ConfirmModal';

interface TaskCatalogProps {
  onOpenLogModal: (taskId: string) => void;
  onOpenTaskHistory: (taskId: string) => void;
  onOpenCreateTaskModal: () => void;
  onOpenEditTaskModal: (task: TaskItem) => void;
}

export const TaskCatalog: React.FC<TaskCatalogProps> = ({
  onOpenLogModal,
  onOpenTaskHistory,
  onOpenCreateTaskModal,
  onOpenEditTaskModal
}) => {
  const { data, isAdmin, deleteTask } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyDue, setOnlyDue] = useState<boolean>(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);

  const categories = data.settings.categories;
  const tasksList = Object.values(data.tasks);

  const filteredTasks = useMemo(() => {
    return tasksList.filter(task => {
      const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
      const matchesSearch = 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const dueStatus = getTaskDueStatus(task);
      const matchesDue = !onlyDue || dueStatus.status === 'overdue' || dueStatus.status === 'due-soon';

      return matchesCategory && matchesSearch && matchesDue;
    });
  }, [tasksList, selectedCategory, searchQuery, onlyDue]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & M3 Extended FAB for Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--m3-on-surface)] flex items-center gap-2.5">
            <CheckSquare className="w-7 h-7 text-[var(--m3-primary)]" />
            <span>Aufgaben-Katalog</span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--m3-on-surface-variant)] mt-0.5">
            Fällige Aufgaben einsehen, Arbeit erfassen oder Historie prüfen
          </p>
        </div>

        {/* Admin "+ Neue Aufgabe" button */}
        {isAdmin && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={onOpenCreateTaskModal}
            className="self-start sm:self-auto m3-fab px-5 py-3 flex items-center gap-2 text-xs font-black shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Neue Aufgabe anlegen</span>
          </motion.button>
        )}
      </div>

      {/* Filter & Search Bar in Material 3 Style */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-5 rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm space-y-4"
      >
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--m3-outline)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Aufgabe suchen (z. B. Bad, Saugen, Müll, Küche)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-xs font-semibold text-[var(--m3-on-surface)] placeholder-[var(--m3-outline)] focus:outline-none focus:ring-2 focus:ring-[var(--m3-primary)] shadow-xs transition"
          />
        </div>

        {/* Category Filter Chips & "Nur Fällige" toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {/* All Categories Chip */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`h-9 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                selectedCategory === 'all'
                  ? 'm3-chip-selected'
                  : 'bg-[var(--m3-surface)] text-[var(--m3-on-surface-variant)] border border-[var(--m3-outline-variant)] hover:bg-[var(--m3-surface-container-high)]'
              }`}
            >
              {selectedCategory === 'all' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              <span>Alle Kategorien</span>
            </motion.button>

            {/* Specific Categories */}
            {categories.map((cat, idx) => {
              const catName = typeof cat === 'string' ? cat : (cat as any).name || `Kat ${idx}`;
              const isSelected = selectedCategory === catName;
              return (
                <motion.button
                  key={`cat-${catName}-${idx}`}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  onClick={() => setSelectedCategory(catName)}
                  className={`h-9 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
                    isSelected
                      ? 'm3-chip-selected'
                      : 'bg-[var(--m3-surface)] text-[var(--m3-on-surface-variant)] border border-[var(--m3-outline-variant)] hover:bg-[var(--m3-surface-container-high)]'
                  }`}
                >
                  {isSelected ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <span 
                      className="w-2 h-2 rounded-full shrink-0 bg-[var(--m3-primary)]" 
                    />
                  )}
                  <span>{catName}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Toggle for Due Only */}
          <button
            type="button"
            onClick={() => setOnlyDue(!onlyDue)}
            className={`h-9 px-4 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-2 ${
              onlyDue
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-[var(--m3-surface)] text-[var(--m3-on-surface-variant)] border border-[var(--m3-outline-variant)] hover:bg-[var(--m3-surface-container-high)]'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Nur fällige anzeigen</span>
          </button>
        </div>
      </motion.div>

      {/* Task Cards Grid */}
      {filteredTasks.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-12 text-center rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm"
        >
          <CheckSquare className="w-12 h-12 text-[var(--m3-primary)] mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-[var(--m3-on-surface)]">
            {tasksList.length === 0 ? 'Noch keine Aufgaben vorhanden' : 'Keine passenden Aufgaben gefunden'}
          </h3>
          <p className="text-xs text-[var(--m3-on-surface-variant)] mt-1 max-w-sm mx-auto">
            {tasksList.length === 0
              ? 'Dieser Haushalt ist leer und bereit für deine eigenen Aufgaben. Erstelle die erste Aufgabe für eure Familie!'
              : 'Versuche einen anderen Suchbegriff oder hebe die Filter auf.'}
          </p>
          {tasksList.length === 0 && (
            <div className="mt-5">
              <button
                type="button"
                onClick={onOpenCreateTaskModal}
                className="m3-btn-filled px-5 py-2.5 text-xs font-black inline-flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Erste Aufgabe anlegen</span>
              </button>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05
              }
            }
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {filteredTasks.map((task, index) => {
            const dueStatus = getTaskDueStatus(task);
            const isOverdue = dueStatus.status === 'overdue';
            const isDueSoon = dueStatus.status === 'due-soon';

            return (
              <motion.div
                key={task.id}
                variants={{
                  hidden: { opacity: 0, scale: 0.95 },
                  visible: { opacity: 1, scale: 1 }
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                whileHover={{ y: -3 }}
                className="p-5 rounded-[24px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] hover:border-[var(--m3-primary)] shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 group"
              >
                <div>
                  {/* Top Bar: Category & Due Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${getCategoryStyle(task.category)}`}>
                      {task.category}
                    </span>

                    {isOverdue ? (
                      <span className="text-[10px] font-black text-rose-600 bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{dueStatus.text}</span>
                      </span>
                    ) : isDueSoon ? (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{dueStatus.text}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-[var(--m3-on-surface-variant)] font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[var(--m3-outline)]" />
                        <span>{dueStatus.text}</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-[var(--m3-on-surface)] group-hover:text-[var(--m3-primary)] transition-colors leading-snug">
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-xs text-[var(--m3-on-surface-variant)] mt-1 line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  )}

                  {/* Task Meta (Base Points & Duration) */}
                  <div className="flex items-center gap-3 text-xs text-[var(--m3-on-surface-variant)] mt-3">
                    <span className="font-black text-[var(--m3-primary)] bg-[var(--m3-primary-container)] px-2.5 py-0.5 rounded-lg shadow-2xs">
                      +{task.base_points} Pkt.
                    </span>
                    <span className="flex items-center gap-1 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-[var(--m3-outline)]" />
                      ~{task.estimated_duration} Min.
                    </span>
                    <span className="text-[var(--m3-outline)]">
                      Alle {task.interval_days} Tage
                    </span>
                  </div>
                </div>

                {/* Bottom Actions: History & Done Button & Admin Edit */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--m3-outline-variant)]/50">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenTaskHistory(task.id)}
                      className="p-2 rounded-xl text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-high)] hover:text-[var(--m3-primary)] transition"
                      title="Verlauf dieser Aufgabe ansehen"
                    >
                      <History className="w-4 h-4" />
                    </button>

                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => onOpenEditTaskModal(task)}
                          className="p-2 rounded-xl text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-high)] hover:text-indigo-600 transition"
                          title="Aufgabe bearbeiten"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setTaskToDelete(task)}
                          className="p-2 rounded-xl text-[var(--m3-on-surface-variant)] hover:bg-rose-500/15 hover:text-rose-600 transition"
                          title="Aufgabe löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-2xl bg-[var(--m3-surface-variant)] text-[var(--m3-on-surface-variant)] text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-not-allowed opacity-70"
                      disabled
                      title="Noch nicht verfügbar"
                    >
                      <span>Fischen</span>
                      <Award className="w-4 h-4" />
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => onOpenLogModal(task.id)}
                      className="px-4 py-2 rounded-2xl bg-[var(--m3-primary-container)] hover:bg-[var(--m3-primary-container)]/90 text-[var(--m3-on-primary-container)] text-xs font-black transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <span>Gönnen</span>
                      <Check className="w-4 h-4 stroke-[3]" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <ConfirmModal
          isOpen={!!taskToDelete}
          title="Aufgabe wirklich löschen?"
          message={`Möchtest du "${taskToDelete.title}" wirklich unwiderruflich entfernen?`}
          confirmLabel="Löschen"
          isDestructive={true}
          onConfirm={() => {
            deleteTask(taskToDelete.id);
            setTaskToDelete(null);
          }}
          onClose={() => setTaskToDelete(null)}
        />
      )}
    </div>
  );
};
