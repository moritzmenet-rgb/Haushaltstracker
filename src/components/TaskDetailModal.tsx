import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Info, History, Star, Clock, Trash2, ShieldAlert, 
  Award, Calendar, Zap, Fish, Edit3, CheckCircle2 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatRelativeDate, getInitials, getCategoryStyle, getTaskDueStatus } from '../utils';
import { ConfirmModal } from './ConfirmModal';
import { TaskItem } from '../types';

interface TaskDetailModalProps {
  taskId: string | null;
  onClose: () => void;
  onLogThisTask: (taskId: string) => void;
  onEditTask?: (task: TaskItem) => void;
  onFishTask?: (task: TaskItem) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  taskId,
  onClose,
  onLogThisTask,
  onEditTask,
  onFishTask
}) => {
  const { data, isAdmin, deleteLog, activeUser, unfishTask } = useApp();
  const [logToDelete, setLogToDelete] = useState<{ id: string; user: string; points: number } | null>(null);

  if (!taskId) return null;

  const task = data.tasks[taskId];
  if (!task) return null;

  // Find all logs for this task, sorted latest first
  const taskLogs = data.logs
    .filter(l => l.task_id === taskId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const dueStatus = getTaskDueStatus(task);
  const isFished = !!task.fished_until && new Date(task.fished_until) > new Date();
  const fishedByMember = task.fished_by ? data.members[task.fished_by] : null;
  const isFishedByMe = isFished && task.fished_by === activeUser?.id;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="w-full max-w-2xl m3-dialog overflow-hidden my-8"
        >
          {/* Header */}
          <div className="p-6 border-b border-[var(--m3-outline-variant)]/60 flex items-center justify-between bg-[var(--m3-surface-container-highest)]/30">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${getCategoryStyle(task.category)} shadow-sm`}>
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[var(--m3-on-surface)] leading-tight">
                  {task.title}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-[var(--m3-on-surface-variant)]">
                    {task.category}
                  </span>
                  <span className="text-[10px] text-[var(--m3-outline)]">•</span>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${
                    dueStatus.status === 'overdue' ? 'text-rose-500' : 
                    dueStatus.status === 'due-soon' ? 'text-amber-500' : 'text-emerald-500'
                  }`}>
                    {dueStatus.text}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && onEditTask && (
                <button
                  onClick={() => onEditTask(task)}
                  className="p-2 rounded-full hover:bg-[var(--m3-surface-container-highest)] text-[var(--m3-on-surface-variant)] transition"
                  title="Aufgabe bearbeiten"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-highest)] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[80vh]">
            {/* Task Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <div className="p-4 rounded-2xl bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)] flex flex-col items-center gap-1 text-center shadow-xs">
                <Award className="w-5 h-5 text-[var(--m3-primary)] mb-1" />
                <span className="text-lg font-black text-[var(--m3-on-surface)]">+{task.base_points}</span>
                <span className="text-[10px] font-bold text-[var(--m3-on-surface-variant)] uppercase">Punkte</span>
              </div>
              
              <div className="p-4 rounded-2xl bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)] flex flex-col items-center gap-1 text-center shadow-xs">
                <Clock className="w-5 h-5 text-amber-500 mb-1" />
                <span className="text-lg font-black text-[var(--m3-on-surface)]">
                  {task.estimated_duration >= 60 ? `${task.estimated_duration / 60}h` : `${task.estimated_duration}m`}
                </span>
                <span className="text-[10px] font-bold text-[var(--m3-on-surface-variant)] uppercase">Dauer</span>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)] flex flex-col items-center gap-1 text-center shadow-xs">
                <Calendar className="w-5 h-5 text-emerald-500 mb-1" />
                <span className="text-lg font-black text-[var(--m3-on-surface)]">{task.interval_days}</span>
                <span className="text-[10px] font-bold text-[var(--m3-on-surface-variant)] uppercase">Tage Intervall</span>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)] flex flex-col items-center gap-1 text-center shadow-xs">
                <Zap className="w-5 h-5 text-indigo-500 mb-1" />
                <span className="text-lg font-black text-[var(--m3-on-surface)]">{task.frequency_per_day || 1}x</span>
                <span className="text-[10px] font-bold text-[var(--m3-on-surface-variant)] uppercase">pro Tag</span>
              </div>
            </div>

            {/* Description & Status Info */}
            <div className="space-y-4 mb-8">
              {task.description && (
                <div className="p-4 rounded-2xl bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)]/60">
                  <h3 className="text-xs font-black text-[var(--m3-on-surface-variant)] uppercase tracking-wider mb-2">Beschreibung</h3>
                  <p className="text-sm text-[var(--m3-on-surface)] whitespace-pre-wrap">{task.description}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {task.preferred_time && (
                  <div className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-bold flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Bevorzugte Zeit: {task.preferred_time === 'morning' ? 'Morgens' : task.preferred_time === 'noon' ? 'Mittags' : 'Abends'}
                  </div>
                )}
                
                {isFished && (
                  <div className="px-4 py-2 rounded-xl bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] border border-[var(--m3-primary)]/20 text-xs font-bold flex items-center gap-2">
                    <Fish className="w-4 h-4" />
                    Gefischt von {fishedByMember?.name} bis {new Date(task.fished_until!).toLocaleDateString('de-DE')}
                  </div>
                )}
              </div>
            </div>

            {/* Action Section */}
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              {!isFished ? (
                <>
                  <button
                    onClick={() => {
                      onClose();
                      onLogThisTask(task.id);
                    }}
                    className="flex-1 px-6 py-4 rounded-2xl bg-[var(--m3-primary)] text-[var(--m3-on-primary)] font-black shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    <span>Jetzt erledigen</span>
                  </button>
                  {onFishTask && (
                    <button
                      onClick={() => onFishTask(task)}
                      className="px-6 py-4 rounded-2xl bg-[var(--m3-surface-container-highest)] text-[var(--m3-on-surface)] font-black hover:bg-[var(--m3-surface-container-highest)]/80 transition-all flex items-center justify-center gap-3"
                    >
                      <Fish className="w-6 h-6" />
                      <span>Fischen</span>
                    </button>
                  )}
                </>
              ) : (
                <div className="w-full p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600">
                      <Fish className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-amber-700 dark:text-amber-200">Diese Aufgabe ist reserviert</p>
                      <p className="text-xs text-amber-600/80">Kein Logging möglich bis die Reservierung abläuft.</p>
                    </div>
                  </div>
                  {isFishedByMe && (
                    <button
                      onClick={() => unfishTask(task.id)}
                      className="px-6 py-2 rounded-xl bg-amber-500 text-white font-black text-sm shadow-md hover:bg-amber-600 transition"
                    >
                      Freigeben
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* History Section */}
            <div>
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-sm font-black text-[var(--m3-on-surface)] flex items-center gap-2">
                  <History className="w-5 h-5 text-[var(--m3-primary)]" />
                  Verlauf & Zeitstempel
                </h3>
                <span className="text-[10px] font-bold text-[var(--m3-on-surface-variant)] uppercase tracking-wider">
                  {taskLogs.length} Einträge
                </span>
              </div>

              <div className="space-y-3">
                {taskLogs.length === 0 ? (
                  <div className="text-center py-10 bg-[var(--m3-surface-container-low)] rounded-3xl border border-dashed border-[var(--m3-outline-variant)]">
                    <History className="w-8 h-8 text-[var(--m3-outline)] mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-bold text-[var(--m3-on-surface-variant)]">Bisher keine Einträge</p>
                  </div>
                ) : (
                  taskLogs.map((log) => {
                    const user = data.members[log.user_id] || {
                      name: 'Unbekannt',
                      avatar_color: '#4F46E5'
                    };
                    const initials = getInitials(user.name);

                    return (
                      <div
                        key={log.log_id}
                        className="p-4 rounded-2xl bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)]/60 flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            style={{ backgroundColor: user.avatar_color }}
                            className="w-9 h-9 rounded-2xl shrink-0 flex items-center justify-center text-white font-black text-xs shadow-xs"
                          >
                            {initials}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[var(--m3-on-surface)]">{user.name}</span>
                              <span className="text-[10px] text-[var(--m3-outline)]">{formatRelativeDate(log.timestamp)}</span>
                            </div>

                            <div className="flex items-center gap-3 mt-1.5">
                              <div className="flex items-center gap-0.5 text-amber-500">
                                {Array.from({ length: log.stars }).map((_, idx) => (
                                  <Star key={idx} className="w-3 h-3 fill-amber-500 text-amber-500" />
                                ))}
                              </div>
                              <span className="flex items-center gap-1 text-[11px] font-black text-[var(--m3-primary)]">
                                +{log.points_awarded} Pkt.
                              </span>
                              <span className="text-[11px] text-[var(--m3-on-surface-variant)] font-medium">
                                {log.actual_duration} Min.
                              </span>
                            </div>
                            {log.notes && (
                              <p className="mt-2 text-[11px] text-[var(--m3-on-surface-variant)] italic">„{log.notes}“</p>
                            )}
                          </div>
                        </div>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setLogToDelete({ id: log.log_id, user: user.name, points: log.points_awarded })}
                            className="text-[var(--m3-outline)] hover:text-rose-500 p-2 rounded-xl hover:bg-rose-500/10 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Footer Info */}
          {isAdmin && (
            <div className="p-3 bg-[var(--m3-surface-container-highest)]/50 border-t border-[var(--m3-outline-variant)]/60 text-[10px] text-[var(--m3-on-surface-variant)] flex items-center justify-center gap-1.5 font-bold uppercase tracking-widest">
              <ShieldAlert className="w-3.5 h-3.5 text-[var(--m3-primary)]" />
              <span>Administrator Modus</span>
            </div>
          )}
        </motion.div>
      </div>

      <ConfirmModal
        isOpen={!!logToDelete}
        title="Eintrag löschen"
        message={logToDelete ? `Möchtest du den Eintrag von "${logToDelete.user}" (${logToDelete.points} Punkte) wirklich löschen?` : ''}
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        isDanger={true}
        onConfirm={() => {
          if (logToDelete) {
            deleteLog(logToDelete.id);
            setLogToDelete(null);
          }
        }}
        onCancel={() => setLogToDelete(null)}
      />
    </AnimatePresence>
  );
};
