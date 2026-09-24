import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History, Star, Clock, Trash2, X, ShieldAlert, Award } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatRelativeDate, getInitials } from '../utils';
import { ConfirmModal } from './ConfirmModal';

interface TaskHistoryModalProps {
  taskId: string | null;
  onClose: () => void;
  onLogThisTask?: (taskId: string) => void;
}

export const TaskHistoryModal: React.FC<TaskHistoryModalProps> = ({
  taskId,
  onClose,
  onLogThisTask
}) => {
  const { data, isAdmin, deleteLog } = useApp();
  const [logToDelete, setLogToDelete] = useState<{ id: string; user: string; points: number } | null>(null);

  if (!taskId) return null;

  const task = data.tasks[taskId];
  if (!task) return null;

  // Find all logs for this task, sorted latest first
  const taskLogs = data.logs
    .filter(l => l.task_id === taskId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="w-full max-w-lg m3-dialog overflow-hidden my-12"
        >
          {/* M3 Header */}
          <div className="p-6 border-b border-[var(--m3-outline-variant)]/60 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] flex items-center justify-center shadow-xs">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[var(--m3-on-surface)] leading-tight">
                  Aufgaben-Historie
                </h2>
                <p className="text-xs text-[var(--m3-on-surface-variant)] mt-0.5 font-medium">
                  {task.title} ({task.category})
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

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3.5">
            {taskLogs.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-2xl bg-[var(--m3-surface-container)] text-[var(--m3-outline)] flex items-center justify-center mx-auto mb-3">
                  <History className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-[var(--m3-on-surface)] mb-1">
                  Bisher keine Einträge vorhanden
                </p>
                <p className="text-xs text-[var(--m3-on-surface-variant)] mb-4">
                  Diese Aufgabe wurde noch nicht im System erfasst.
                </p>
                {onLogThisTask && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLogThisTask(taskId);
                    }}
                    className="m3-btn-filled px-5 py-2.5 text-xs font-black"
                  >
                    Jetzt als erledigt erfassen
                  </button>
                )}
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
                    className="p-4 rounded-2xl bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)] flex items-start justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-start gap-3">
                      {/* User Avatar */}
                      <div
                        style={{ backgroundColor: user.avatar_color }}
                        className="w-9 h-9 rounded-2xl shrink-0 flex items-center justify-center text-white font-black text-xs shadow-xs mt-0.5"
                      >
                        {initials}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[var(--m3-on-surface)]">
                            {user.name}
                          </span>
                          <span className="text-[10px] text-[var(--m3-outline)] font-medium">
                            {formatRelativeDate(log.timestamp)}
                          </span>
                        </div>

                        {/* Stars & Points */}
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex items-center gap-0.5 text-amber-500">
                            {Array.from({ length: log.stars }).map((_, idx) => (
                              <Star key={idx} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            ))}
                          </div>

                          <span className="flex items-center gap-1 text-xs font-black text-[var(--m3-primary)] bg-[var(--m3-primary-container)] px-2 py-0.5 rounded-lg">
                            <Award className="w-3 h-3" />
                            +{log.points_awarded} Pkt.
                          </span>

                          <span className="flex items-center gap-1 text-[11px] text-[var(--m3-on-surface-variant)] font-medium">
                            <Clock className="w-3.5 h-3.5 text-[var(--m3-outline)]" />
                            {log.actual_duration} Min.
                          </span>
                        </div>

                        {log.notes && (
                          <p className="mt-2 text-xs text-[var(--m3-on-surface)] italic bg-[var(--m3-surface)] px-3 py-1.5 rounded-xl border border-[var(--m3-outline-variant)]/60">
                            „{log.notes}“
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Admin Delete Action */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setLogToDelete({ id: log.log_id, user: user.name, points: log.points_awarded })}
                        title="Eintrag als Admin löschen"
                        className="text-[var(--m3-outline)] hover:text-rose-500 p-2 rounded-xl hover:bg-rose-500/10 transition shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Info */}
          {isAdmin && taskLogs.length > 0 && (
            <div className="p-3.5 bg-[var(--m3-surface-container)] border-t border-[var(--m3-outline-variant)]/60 text-[11px] text-[var(--m3-on-surface-variant)] flex items-center justify-center gap-1.5 font-medium">
              <ShieldAlert className="w-4 h-4 text-[var(--m3-primary)]" />
              <span>Admin-Recht: Du kannst fehlerhafte oder versehentliche Einträge löschen.</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Delete Log Confirmation Modal */}
      <ConfirmModal
        isOpen={!!logToDelete}
        title="Eintrag löschen"
        message={logToDelete ? `Möchtest du den Eintrag von "${logToDelete.user}" (${logToDelete.points} Punkte) wirklich löschen? Die Punkte werden entsprechend abgezogen.` : ''}
        confirmLabel="Eintrag löschen"
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
