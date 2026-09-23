import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ArrowRight,
  AlertCircle,
  Trophy,
  History,
  Star,
  Edit3,
  Trash2,
  Filter,
  Search,
  Check,
  Award,
  Zap,
  Flame,
  Info,
  ChevronDown,
  Layers,
  Calendar
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatRelativeDate, getCategoryStyle, getInitials, getMemberCyclePoints, getTaskDueStatus } from '../utils';
import { ChoreLog } from '../types';

interface DashboardProps {
  onOpenLogModal: (preselectedTaskId?: string) => void;
  onEditLog?: (log: ChoreLog) => void;
  onOpenTaskHistory: (taskId: string) => void;
  onNavigateToTasks: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenLogModal,
  onEditLog,
  onOpenTaskHistory,
  onNavigateToTasks
}) => {
  const { data, activeUser, isAdmin, deleteLog } = useApp();

  // Filters for the Verlauf
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [starFilter, setStarFilter] = useState<number>(0); // 0 = all
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const membersList = Object.values(data.members);
  const tasksList = Object.values(data.tasks);

  // Compute members with current cycle points
  const membersWithProgress = useMemo(() => {
    return membersList.map(member => {
      const cyclePoints = getMemberCyclePoints(member.id, data.logs, data.settings.last_reset_date);
      const target = member.weekly_target || data.settings.default_weekly_target || 50;
      const progressPercent = Math.min(100, Math.round((cyclePoints / target) * 100));
      const difference = cyclePoints - target;

      return {
        ...member,
        cyclePoints,
        target,
        progressPercent,
        difference
      };
    }).sort((a, b) => b.cyclePoints - a.cyclePoints);
  }, [membersList, data.logs, data.settings]);

  // Current active user progress
  const activeUserProgress = useMemo(() => {
    if (!activeUser) return null;
    return membersWithProgress.find(m => m.id === activeUser.id) || null;
  }, [activeUser, membersWithProgress]);

  // Priority sorted tasks: Overdue first, then due soon, then ok
  const prioritizedTasks = useMemo(() => {
    const tasksWithDue = tasksList.map(t => ({
      task: t,
      due: getTaskDueStatus(t)
    }));

    return tasksWithDue.sort((a, b) => {
      const order = { overdue: 0, 'due-soon': 1, ok: 2 };
      const diff = order[a.due.status] - order[b.due.status];
      if (diff !== 0) return diff;
      return b.due.daysOverdue - a.due.daysOverdue;
    });
  }, [tasksList]);

  // Multipliers for transparent calculation
  const mult1 = data.settings.star_multiplier_1 ?? 50;
  const mult2 = data.settings.star_multiplier_2 ?? 75;
  const mult3 = data.settings.star_multiplier_3 ?? 100;

  // Comprehensive Verlauf Logs with filtering
  const filteredLogs = useMemo(() => {
    return [...data.logs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .filter(log => {
        // User filter
        if (selectedUserFilter !== 'all' && log.user_id !== selectedUserFilter) {
          return false;
        }
        // Star filter
        if (starFilter > 0 && log.stars !== starFilter) {
          return false;
        }
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const task = data.tasks[log.task_id];
          const member = data.members[log.user_id];
          const matchTask = task?.title.toLowerCase().includes(q) || task?.category.toLowerCase().includes(q);
          const matchMember = member?.name.toLowerCase().includes(q);
          const matchNotes = log.notes?.toLowerCase().includes(q);
          if (!matchTask && !matchMember && !matchNotes) return false;
        }
        return true;
      });
  }, [data.logs, selectedUserFilter, starFilter, searchQuery, data.tasks, data.members]);

  // Family weekly totals
  const totalPoints = membersWithProgress.reduce((sum, m) => sum + m.cyclePoints, 0);
  const totalTarget = membersWithProgress.reduce((sum, m) => sum + m.target, 0);
  const familyPercent = totalTarget > 0 ? Math.min(100, Math.round((totalPoints / totalTarget) * 100)) : 0;

  const handleDeleteLog = (logId: string) => {
    deleteLog(logId);
    setDeleteConfirmId(null);
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = activeUser?.name || 'Familie';
    if (hour >= 5 && hour < 12) return `Guten Morgen, ${name}`;
    if (hour >= 12 && hour < 18) return `Guten Tag, ${name}`;
    if (hour >= 18 && hour < 22) return `Guten Abend, ${name}`;
    return `Gute Nacht, ${name}`;
  }, [activeUser]);

  return (
    <div className="space-y-7 pb-12">
      {/* 1. Header & Material 3 Extended FAB */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--m3-on-surface)] flex items-center gap-2.5">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--m3-primary)] to-[var(--m3-primary)]/70">
                {greeting}
              </span>
              <motion.span 
                animate={{ rotate: [0, 14, -14, 14, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                className="inline-block text-3xl"
              >
                👋
              </motion.span>
            </h1>
            {activeUser?.role === 'admin' && (
              <span className="text-[11px] font-black px-3 py-1 rounded-full bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] uppercase tracking-wider shadow-xs">
                Admin
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--m3-on-surface-variant)] font-medium">
            {activeUserProgress ? (
              activeUserProgress.cyclePoints >= activeUserProgress.target ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Wochenziel erreicht ({activeUserProgress.cyclePoints}/{activeUserProgress.target} Pkt.)! Großartige Arbeit!
                </span>
              ) : (
                <span>
                  Noch <strong className="text-[var(--m3-primary)] font-black">{activeUserProgress.target - activeUserProgress.cyclePoints} Punkte</strong> bis zu deinem Wochenziel von {activeUserProgress.target} Pkt.
                </span>
              )
            ) : (
              'Wähle eine Aufgabe oder erfasse deine erledigte Hausarbeit.'
            )}
          </p>
        </div>

        {/* M3 Expressive Floating Action Button (Extended FAB) */}
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 450, damping: 22 }}
          onClick={() => onOpenLogModal()}
          className="m3-fab px-6 py-3.5 flex items-center justify-center gap-2.5 font-black text-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>Arbeit erfassen</span>
        </motion.button>
      </div>

      {/* 2. Personal Progress Bar & Family Summary in Material 3 Expressive Card */}
      {activeUserProgress && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="p-6 rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-xs sm:text-sm mb-3.5">
            <span className="font-black text-[var(--m3-on-surface)] flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[var(--m3-primary)] inline-block animate-pulse" />
              <span>Dein Wochenfortschritt</span>
            </span>
            <div className="flex items-center gap-2.5 font-bold">
              <span className="text-[var(--m3-on-surface)] font-black text-sm">
                {activeUserProgress.cyclePoints} / {activeUserProgress.target} Pkt.
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-[var(--m3-secondary-container)] text-[var(--m3-on-secondary-container)] font-black shadow-xs">
                {activeUserProgress.progressPercent}%
              </span>
            </div>
          </div>

          {/* M3 Expressive Progress Bar Track */}
          <div className="w-full bg-[var(--m3-surface-container-highest)] h-4 rounded-full overflow-hidden mb-4 p-0.5 border border-[var(--m3-outline-variant)]/40 shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${activeUserProgress.progressPercent}%` }}
              transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
              className={`h-full rounded-full transition-all duration-500 ${
                activeUserProgress.cyclePoints >= activeUserProgress.target 
                  ? 'bg-emerald-500 shadow-sm' 
                  : 'bg-[var(--m3-primary)] shadow-sm'
              }`}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[var(--m3-on-surface-variant)] pt-3 border-t border-[var(--m3-outline-variant)]/50 font-medium">
            <span className="flex items-center gap-2">
              <span>Haushalt Gesamt:</span>
              <strong className="text-[var(--m3-on-surface)] font-bold">{totalPoints} / {totalTarget} Pkt.</strong>
              <span className="text-[var(--m3-outline)]">({familyPercent}%)</span>
            </span>
            <button
              onClick={onNavigateToTasks}
              className="font-bold text-[var(--m3-primary)] hover:underline transition flex items-center gap-1.5 self-start sm:self-auto group"
            >
              <span>Alle Aufgaben ansehen</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      )}

      {/* 3. Fällige Hausarbeiten (Priority Section) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black text-[var(--m3-on-surface)] flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <span>Was steht an? (Dringend & Fällig)</span>
          </h2>
          <button
            onClick={onNavigateToTasks}
            className="text-xs font-bold text-[var(--m3-primary)] hover:underline flex items-center gap-1"
          >
            <span>Katalog öffnen ({tasksList.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {prioritizedTasks.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 text-center rounded-[24px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] space-y-3"
          >
            <p className="text-xs text-[var(--m3-on-surface-variant)] font-semibold">
              Noch keine Aufgaben angelegt. Erstelle jetzt Aufgaben für deinen Haushalt!
            </p>
            <button
              onClick={onNavigateToTasks}
              className="m3-btn-filled px-4 py-2 text-xs font-black inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Aufgabe erstellen</span>
            </button>
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
                  staggerChildren: 0.1
                }
              }
            }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {prioritizedTasks.slice(0, 4).map(({ task, due }) => {
              const isOverdue = due.status === 'overdue';
              const isDueSoon = due.status === 'due-soon';

              return (
                <motion.div
                  key={task.id}
                  variants={{
                    hidden: { opacity: 0, x: -10 },
                    visible: { opacity: 1, x: 0 }
                  }}
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="p-5 rounded-[24px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] hover:border-[var(--m3-primary)] shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between gap-4 group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${getCategoryStyle(task.category)}`}>
                        {task.category}
                      </span>
                      {isOverdue ? (
                        <span className="text-[10px] font-black text-rose-600 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-md">
                          {due.text}
                        </span>
                      ) : isDueSoon ? (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                          {due.text}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[var(--m3-on-surface-variant)] font-medium">
                          {due.text}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-[var(--m3-on-surface)] truncate">
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-2.5 text-xs text-[var(--m3-on-surface-variant)] mt-1.5">
                      <span className="font-black text-[var(--m3-primary)] bg-[var(--m3-primary-container)] px-2.5 py-0.5 rounded-lg">
                        +{task.base_points} Pkt.
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-[var(--m3-outline)]" />
                        ~{task.estimated_duration} Min.
                      </span>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => onOpenLogModal(task.id)}
                    className="shrink-0 px-4 py-2.5 rounded-2xl bg-[var(--m3-primary-container)] hover:bg-[var(--m3-primary-container)]/90 text-[var(--m3-on-primary-container)] text-xs font-black transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <span>Erledigt</span>
                    <Check className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>

      {/* 4. Two-Column Layout: Familien-Rangliste & Sterne-Regelwerk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Familien-Rangliste */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-[var(--m3-on-surface)] flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Familien-Wochenstand</span>
            </h2>
            <span className="text-xs font-bold text-[var(--m3-on-surface-variant)]">
              Aktueller Zyklus
            </span>
          </div>

          {membersWithProgress.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 text-center rounded-[24px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)]"
            >
              <p className="text-xs text-[var(--m3-on-surface-variant)]">
                Noch keine Familienmitglieder angelegt.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] divide-y divide-[var(--m3-outline-variant)]/50 overflow-hidden shadow-sm"
            >
              {membersWithProgress.map((member, index) => {
                const isSelf = activeUser?.id === member.id;
                const isGoalReached = member.cyclePoints >= member.target;

                return (
                  <div
                    key={member.id}
                    className={`p-4 flex items-center justify-between gap-3 transition-colors ${
                      isSelf ? 'bg-[var(--m3-secondary-container)]/35' : 'hover:bg-[var(--m3-surface-container-high)]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="w-6 text-center text-xs font-black text-[var(--m3-outline)]">
                        #{index + 1}
                      </span>
                      <div
                        style={{ backgroundColor: member.avatar_color }}
                        className="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center text-white font-black text-sm shadow-sm"
                      >
                        {getInitials(member.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[var(--m3-on-surface)] truncate">
                            {member.name}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)]">
                              Du
                            </span>
                          )}
                        </div>
                        <div className="w-28 sm:w-40 bg-[var(--m3-surface-container-highest)] h-2 rounded-full overflow-hidden mt-1.5 shadow-inner">
                          <div
                            style={{
                              width: `${member.progressPercent}%`,
                              backgroundColor: isGoalReached ? '#10B981' : member.avatar_color
                            }}
                            className="h-full rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs sm:text-sm font-black text-[var(--m3-on-surface)]">
                        {member.cyclePoints} <span className="text-[11px] text-[var(--m3-outline)] font-normal">/ {member.target} Pkt.</span>
                      </div>
                      <span className="text-[11px] font-bold text-[var(--m3-on-surface-variant)]">
                        {isGoalReached ? 'Ziel erreicht 🎉' : `${member.progressPercent}%`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </section>

        {/* Sterne- & Bonussystem (Regelwerk) */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-[var(--m3-on-surface)] flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>Sterne- & Bonussystem</span>
            </h2>
            <span className="text-xs font-bold text-[var(--m3-primary)]">
              M3 Expressive
            </span>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] p-5 shadow-sm space-y-3.5"
          >
            <div className="grid grid-cols-3 gap-2.5 text-center">
              {/* 1 Star */}
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <div className="flex justify-center text-rose-500 mb-1">
                  <Star className="w-4 h-4 fill-rose-500" />
                </div>
                <div className="text-xs font-bold text-[var(--m3-on-surface)]">1 Stern</div>
                <div className="text-xs font-black text-rose-600 dark:text-rose-400">{mult1}%</div>
                <div className="text-[10px] text-[var(--m3-outline)] mt-0.5">Basis</div>
              </div>

              {/* 2 Stars */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex justify-center text-amber-500 mb-1 gap-0.5">
                  <Star className="w-4 h-4 fill-amber-500" />
                  <Star className="w-4 h-4 fill-amber-500" />
                </div>
                <div className="text-xs font-bold text-[var(--m3-on-surface)]">2 Sterne</div>
                <div className="text-xs font-black text-amber-600 dark:text-amber-400">{mult2}%</div>
                <div className="text-[10px] text-[var(--m3-outline)] mt-0.5">1 Begründung</div>
              </div>

              {/* 3 Stars */}
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex justify-center text-emerald-500 mb-1 gap-0.5">
                  <Star className="w-4 h-4 fill-emerald-500" />
                  <Star className="w-4 h-4 fill-emerald-500" />
                  <Star className="w-4 h-4 fill-emerald-500" />
                </div>
                <div className="text-xs font-bold text-[var(--m3-on-surface)]">3 Sterne</div>
                <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">{mult3}%</div>
                <div className="text-[10px] text-[var(--m3-outline)] mt-0.5">2 Highlights</div>
              </div>
            </div>

            <p className="text-xs text-[var(--m3-on-surface-variant)] leading-relaxed">
              Jeder Eintrag wird transparent berechnet. Bei 3 Sternen nennst du 2 besondere Qualitätsmerkmale. Bei 2 Sternen begründest du, was gefehlt hat. Mindestens 1 Punkt wird garantiert!
            </p>
          </motion.div>
        </section>
      </div>

      {/* 5. DER GROSSE MATERIAL 3 AKTIVITÄTEN-VERLAUF */}
      <section className="space-y-4 pt-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[var(--m3-on-surface)] flex items-center gap-2.5">
              <History className="w-6 h-6 text-[var(--m3-primary)]" />
              <span>Aktivitäten-Verlauf & Punkte-Herleitung</span>
            </h2>
            <p className="text-xs sm:text-sm text-[var(--m3-on-surface-variant)] mt-0.5">
              Filtere nach Personen, sieh die genaue Punkteberechnung und bearbeite deine Einträge.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-[var(--m3-on-surface-variant)]">
            <span className="px-3 py-1 rounded-full bg-[var(--m3-surface-container-high)]">
              {filteredLogs.length} Einträge gefunden
            </span>
          </div>
        </div>

        {/* Filter Toolbar: M3 Filter Chips & Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-5 rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm space-y-4"
        >
          {/* Person Filter Chips */}
          <div>
            <label className="text-[11px] font-black text-[var(--m3-on-surface-variant)] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[var(--m3-primary)]" />
              <span>Nach Person filtern</span>
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {/* All Members Chip */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                type="button"
                onClick={() => setSelectedUserFilter('all')}
                className={`h-9 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                  selectedUserFilter === 'all'
                    ? 'm3-chip-selected'
                    : 'bg-[var(--m3-surface)] text-[var(--m3-on-surface-variant)] border border-[var(--m3-outline-variant)] hover:bg-[var(--m3-surface-container-high)]'
                }`}
              >
                {selectedUserFilter === 'all' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                <span>Alle Personen</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--m3-surface-container-highest)]">
                  {data.logs.length}
                </span>
              </motion.button>

              {/* Individual Members Chips */}
              {membersList.map((m) => {
                const isSelected = selectedUserFilter === m.id;
                const memberLogsCount = data.logs.filter(l => l.user_id === m.id).length;
                const cyclePts = getMemberCyclePoints(m.id, data.logs, data.settings.last_reset_date);

                return (
                  <motion.button
                    key={`filter-member-${m.id}`}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.94 }}
                    type="button"
                    onClick={() => setSelectedUserFilter(m.id)}
                    className={`h-9 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                      isSelected
                        ? 'm3-chip-selected'
                        : 'bg-[var(--m3-surface)] text-[var(--m3-on-surface-variant)] border border-[var(--m3-outline-variant)] hover:bg-[var(--m3-surface-container-high)]'
                    }`}
                  >
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <span
                        style={{ backgroundColor: m.avatar_color }}
                        className="w-3 h-3 rounded-full shrink-0"
                      />
                    )}
                    <span>{m.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[var(--m3-surface-container-highest)]">
                      {cyclePts} Pkt. ({memberLogsCount})
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Search Input & Star Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2.5 border-t border-[var(--m3-outline-variant)]/50">
            {/* Search Input in M3 Outlined Style */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[var(--m3-outline)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Nach Aufgabe, Notizen oder Person suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-xs font-semibold text-[var(--m3-on-surface)] placeholder-[var(--m3-outline)] focus:outline-none focus:ring-2 focus:ring-[var(--m3-primary)] shadow-xs transition"
              />
            </div>

            {/* Star Filter Chips */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] text-[var(--m3-outline)] font-bold mr-1">Sterne:</span>
              <button
                type="button"
                onClick={() => setStarFilter(0)}
                className={`h-8 px-3 rounded-lg text-xs font-bold transition ${
                  starFilter === 0
                    ? 'bg-[var(--m3-primary)] text-[var(--m3-on-primary)] shadow-xs'
                    : 'bg-[var(--m3-surface)] text-[var(--m3-on-surface-variant)] border border-[var(--m3-outline-variant)] hover:bg-[var(--m3-surface-container-high)]'
                }`}
              >
                Alle
              </button>
              <button
                type="button"
                onClick={() => setStarFilter(3)}
                className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  starFilter === 3
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[var(--m3-surface)] text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/10'
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>3★</span>
              </button>
              <button
                type="button"
                onClick={() => setStarFilter(2)}
                className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  starFilter === 2
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-[var(--m3-surface)] text-amber-600 dark:text-amber-400 border border-amber-500/40 hover:bg-amber-500/10'
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>2★</span>
              </button>
              <button
                type="button"
                onClick={() => setStarFilter(1)}
                className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  starFilter === 1
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-[var(--m3-surface)] text-rose-600 dark:text-rose-400 border border-rose-500/40 hover:bg-rose-500/10'
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>1★</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* List of Filtered Logs in Material 3 Elevated Cards */}
        {filteredLogs.length === 0 ? (
          <div className="p-10 text-center rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm">
            <History className="w-10 h-10 text-[var(--m3-outline)] mx-auto mb-2.5 opacity-50" />
            <p className="text-sm font-bold text-[var(--m3-on-surface)]">
              Keine Einträge für diese Filterkriterien gefunden.
            </p>
            <p className="text-xs text-[var(--m3-on-surface-variant)] mt-1">
              Erfasse eine neue Arbeit oder ändere die Filtereinstellungen.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredLogs.map((log, index) => {
              const user = data.members[log.user_id] || { name: 'Unbekannt', avatar_color: '#4F46E5', role: 'member' };
              const task = data.tasks[log.task_id] || { title: 'Gelöschte Aufgabe', category: 'Allgemein', base_points: 20 };
              
              // Calculation details
              const mult = log.stars === 1 ? mult1 : log.stars === 2 ? mult2 : mult3;
              const basePts = task.base_points || Math.round(log.points_awarded / (mult / 100));

              // User permission to edit: Admin can edit ALL, normal user can edit OWN
              const canEdit = isAdmin || (activeUser && activeUser.id === log.user_id);

              return (
                <motion.div
                  key={`m3-log-entry-${log.log_id || index}-${log.timestamp}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
                  className="p-5 rounded-[24px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] hover:border-[var(--m3-primary)] shadow-sm hover:shadow-md transition-all duration-200 space-y-3.5"
                >
                  {/* Top Bar: Task Name, Category & Points */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${getCategoryStyle(task.category)}`}>
                          {task.category}
                        </span>
                        <span className="text-xs text-[var(--m3-on-surface-variant)] font-medium">
                          {formatRelativeDate(log.timestamp)}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-[var(--m3-on-surface)] leading-snug">
                        {task.title}
                      </h3>
                    </div>

                    {/* Points Awarded Badge */}
                    <div className="text-right shrink-0">
                      <span className="text-lg font-black text-[var(--m3-primary)] tracking-tight">
                        +{log.points_awarded} Pkt.
                      </span>
                      <div className="flex items-center justify-end gap-0.5 mt-1">
                        {Array.from({ length: log.stars }).map((_, i) => (
                          <Star 
                            key={`log-star-row-${log.log_id || index}-${i}`} 
                            className={`w-4 h-4 ${
                              log.stars === 3 
                                ? 'fill-emerald-500 text-emerald-500' 
                                : log.stars === 2 
                                ? 'fill-amber-500 text-amber-500' 
                                : 'fill-rose-500 text-rose-500'
                            }`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Middle Bar: Person, Duration & Transparent Point Derivation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* User and Duration */}
                    <div className="flex items-center gap-3">
                      <div
                        style={{ backgroundColor: user.avatar_color }}
                        className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-xs shadow-xs"
                      >
                        {getInitials(user.name)}
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-[var(--m3-on-surface)] mr-2">
                          {user.name}
                        </span>
                        <span className="text-[var(--m3-on-surface-variant)] font-medium inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[var(--m3-outline)]" />
                          {log.actual_duration || 15} Min. ausgeführt
                        </span>
                      </div>
                    </div>

                    {/* Transparent Math Breakdown Formula */}
                    <div className="p-2.5 rounded-xl bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] text-xs flex items-center justify-between sm:justify-end gap-2 shadow-xs">
                      <span className="font-medium opacity-80">Punkte-Herleitung:</span>
                      <span className="font-bold">
                        {basePts} Basis × {mult}% ({log.stars}★) = 
                      </span>
                      <strong className="font-black text-sm">
                        +{log.points_awarded} Pkt.
                      </strong>
                    </div>
                  </div>

                  {/* Star Assessment Details & Justifications */}
                  {log.notes && (
                    <div className="p-3 rounded-2xl bg-[var(--m3-surface-container)] text-xs text-[var(--m3-on-surface)] space-y-1.5">
                      {log.notes.includes('[2 Sterne] Begründung:') && (
                        <div className="text-amber-700 dark:text-amber-400 font-semibold flex items-start gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 uppercase shrink-0">
                            2★ Begründung
                          </span>
                          <span>{log.notes.replace('[2 Sterne] Begründung:', '').split('| Notiz:')[0].trim()}</span>
                        </div>
                      )}

                      {log.notes.includes('[3 Sterne] Highlights:') && (
                        <div className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-start gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 uppercase shrink-0">
                            3★ Highlights
                          </span>
                          <span>{log.notes.replace('[3 Sterne] Highlights:', '').split('| Notiz:')[0].trim()}</span>
                        </div>
                      )}

                      {log.notes.includes('| Notiz:') ? (
                        <div className="text-[var(--m3-outline)] italic">
                          Notiz: {log.notes.split('| Notiz:')[1]?.trim()}
                        </div>
                      ) : (
                        !log.notes.startsWith('[2 Sterne]') && !log.notes.startsWith('[3 Sterne]') && (
                          <div className="text-[var(--m3-on-surface)]">
                            {log.notes}
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Action Bar: Edit & Delete buttons if permitted */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-[var(--m3-outline-variant)]/50">
                    <div className="text-xs text-[var(--m3-on-surface-variant)] font-medium">
                      {canEdit ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isAdmin && activeUser?.id !== log.user_id ? 'Admin-Bearbeitungsrecht' : 'Dein eigener Eintrag'}
                        </span>
                      ) : (
                        <span className="text-[var(--m3-outline)] italic">
                          Schreibgeschützt (Eintrag von {user.name})
                        </span>
                      )}
                    </div>

                    {canEdit && (
                      <div className="flex items-center gap-2">
                        {deleteConfirmId === log.log_id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-rose-600 font-bold">Löschen?</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteLog(log.log_id)}
                              className="px-2.5 py-1 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-xs"
                            >
                              Ja
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2.5 py-1 text-xs text-[var(--m3-outline)] hover:text-[var(--m3-on-surface)]"
                            >
                              Nein
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(log.log_id)}
                            className="p-2 rounded-xl text-[var(--m3-outline)] hover:text-rose-600 hover:bg-rose-500/10 transition"
                            title="Eintrag löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        {onEditLog && (
                          <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.94 }}
                            type="button"
                            onClick={() => onEditLog(log)}
                            className="px-3.5 py-1.5 rounded-xl bg-[var(--m3-surface-container-high)] hover:bg-[var(--m3-secondary-container)] text-[var(--m3-on-surface)] text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Bearbeiten</span>
                          </motion.button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
