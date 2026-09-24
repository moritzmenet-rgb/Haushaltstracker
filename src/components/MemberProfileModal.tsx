import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Award, 
  TrendingUp, 
  Star, 
  Clock, 
  Calendar, 
  ChevronRight, 
  PieChart, 
  Target,
  User as UserIcon,
  Zap,
  History
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getInitials, formatRelativeDate, getCategoryStyle } from '../utils';

interface MemberProfileModalProps {
  memberId: string | null;
  onClose: () => void;
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  memberId,
  onClose
}) => {
  const { data } = useApp();

  const member = useMemo(() => {
    if (!memberId) return null;
    return data.members[memberId];
  }, [memberId, data.members]);

  // Statistics Calculation
  const stats = useMemo(() => {
    if (!memberId || !data.logs) return null;
    
    const memberLogs = data.logs.filter(l => l.user_id === memberId);
    if (memberLogs.length === 0) return null;

    // Sort by timestamp
    const sortedLogs = [...memberLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Task count by category
    const categoryCounts: Record<string, number> = {};
    const taskCounts: Record<string, number> = {};
    let totalStars = 0;
    let totalDuration = 0;
    let totalPoints = 0;

    memberLogs.forEach(log => {
      const task = data.tasks[log.task_id];
      if (task) {
        categoryCounts[task.category] = (categoryCounts[task.category] || 0) + 1;
        taskCounts[task.title] = (taskCounts[task.title] || 0) + 1;
      }
      totalStars += log.stars;
      totalDuration += log.actual_duration || 0;
      totalPoints += log.points_awarded || 0;
    });

    // Favorite Category
    const favoriteCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Keine';
    
    // Favorite Task
    const favoriteTask = Object.entries(taskCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Keine';

    // Average Stars
    const avgStars = (totalStars / memberLogs.length).toFixed(1);

    // Points over time
    const currentCycleStart = data.settings.last_reset_date;
    const currentCycleLogs = currentCycleStart 
      ? memberLogs.filter(l => new Date(l.timestamp).getTime() >= new Date(currentCycleStart).getTime())
      : memberLogs;
    const currentCyclePoints = currentCycleLogs.reduce((sum, l) => sum + l.points_awarded, 0);

    return {
      totalTasks: memberLogs.length,
      totalPoints,
      currentCyclePoints,
      avgStars,
      totalDurationHours: (totalDuration / 60).toFixed(1),
      favoriteCategory,
      favoriteTask,
      recentLogs: sortedLogs.slice(0, 5)
    };
  }, [memberId, data.logs, data.tasks, data.settings.last_reset_date]);

  if (!member) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="w-full max-w-2xl m3-dialog overflow-hidden my-8 relative"
        >
          {/* Enhanced Header Section with Wave Decor */}
          <div className="relative h-48 bg-gradient-to-br from-[var(--m3-primary)] to-[var(--m3-primary-container)] overflow-hidden">
            {/* Subtle Pattern Overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            
            {/* Animated Glows */}
            <motion.div 
              animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.2, 1] }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-white/20 blur-3xl"
            />

            <button
              onClick={onClose}
              className="absolute top-6 right-6 w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all backdrop-blur-xl border border-white/20 z-20 group"
            >
              <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
            </button>
            
            {/* Bottom Wave/Curve to soften the "hard edge" */}
            <div className="absolute bottom-0 left-0 w-full leading-none overflow-hidden translate-y-[1px]">
              <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-[calc(100%+1.3px)] h-[60px] fill-[var(--m3-surface-container-high)]">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C57.23,103.52,114.36,110,172,110c70.24,0,140.43-11.39,209.19-27.18Z"></path>
              </svg>
            </div>

            <div className="absolute bottom-6 left-10 flex items-end gap-6 z-10">
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ backgroundColor: member.avatar_color }}
                className="w-28 h-28 rounded-[32px] border-[6px] border-[var(--m3-surface-container-high)] shadow-2xl flex items-center justify-center text-white text-4xl font-black"
              >
                {getInitials(member.name)}
              </motion.div>
              <div className="pb-4">
                <h2 className="text-3xl font-black text-white drop-shadow-sm leading-none mb-2">
                  {member.name}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-white/20 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md border border-white/10">
                    {member.role === 'admin' ? 'Administrator' : 'Mitglied'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-10 space-y-10">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-3xl bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-2xs">
                <Award className="w-5 h-5 text-amber-500 mb-2" />
                <div className="text-xl font-black text-[var(--m3-on-surface)]">{stats?.totalPoints || 0}</div>
                <div className="text-[10px] font-bold text-[var(--m3-on-surface-variant)] uppercase tracking-wider">Gesamtpunkte</div>
              </div>
              <div className="p-4 rounded-3xl bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-2xs">
                <Zap className="w-5 h-5 text-[var(--m3-primary)] mb-2" />
                <div className="text-xl font-black text-[var(--m3-on-surface)]">{stats?.currentCyclePoints || 0}</div>
                <div className="text-[10px] font-bold text-[var(--m3-on-surface-variant)] uppercase tracking-wider">Diese Woche</div>
              </div>
              <div className="p-4 rounded-3xl bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-2xs">
                <Star className="w-5 h-5 text-emerald-500 mb-2" />
                <div className="text-xl font-black text-[var(--m3-on-surface)]">{stats?.avgStars || '0.0'}</div>
                <div className="text-[10px] font-bold text-[var(--m3-on-surface-variant)] uppercase tracking-wider">∅ Sterne</div>
              </div>
              <div className="p-4 rounded-3xl bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-2xs">
                <Clock className="w-5 h-5 text-indigo-500 mb-2" />
                <div className="text-xl font-black text-[var(--m3-on-surface)]">{stats?.totalDurationHours || '0.0'}h</div>
                <div className="text-[10px] font-bold text-[var(--m3-on-surface-variant)] uppercase tracking-wider">Investiert</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Favorites & Insights */}
              <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-[var(--m3-on-surface-variant)] flex items-center gap-2">
                  <PieChart className="w-4 h-4" />
                  Insights & Vorlieben
                </h3>
                
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                        <Target className="w-4 h-4 text-indigo-600" />
                      </div>
                      <span className="text-xs font-bold text-[var(--m3-on-surface)]">Wochenziel</span>
                    </div>
                    <span className="text-xs font-black text-indigo-600 bg-indigo-500/10 px-2.5 py-1 rounded-lg">
                      {member.weekly_target} Pkt.
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <Star className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-xs font-bold text-[var(--m3-on-surface)]">Lieblingskategorie</span>
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-black ${getCategoryStyle(stats?.favoriteCategory || '')}`}>
                      {stats?.favoriteCategory}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-amber-600" />
                      </div>
                      <span className="text-xs font-bold text-[var(--m3-on-surface)]">Häufigste Aufgabe</span>
                    </div>
                    <span className="text-[10px] font-black text-amber-700 bg-amber-500/10 px-2.5 py-1 rounded-lg truncate max-w-[120px]">
                      {stats?.favoriteTask}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-[var(--m3-on-surface-variant)] flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Letzte Aktivitäten
                </h3>

                <div className="space-y-2">
                  {stats?.recentLogs.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[var(--m3-on-surface-variant)] font-bold italic">
                      Noch keine Aktivitäten erfasst.
                    </div>
                  ) : (
                    stats?.recentLogs.map(log => {
                      const task = data.tasks[log.task_id];
                      return (
                        <div key={log.log_id} className="p-3 rounded-2xl bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)] hover:border-[var(--m3-primary)] transition-colors flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[11px] font-black text-[var(--m3-on-surface)] truncate">
                              {task?.title || 'Gelöschte Aufgabe'}
                            </div>
                            <div className="text-[9px] font-bold text-[var(--m3-on-surface-variant)] flex items-center gap-1.5 mt-0.5">
                              <Calendar className="w-2.5 h-2.5" />
                              {formatRelativeDate(log.timestamp)}
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-1 text-[10px] font-black text-[var(--m3-primary)] bg-[var(--m3-primary-container)] px-2 py-0.5 rounded-md">
                            +{log.points_awarded}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-[var(--m3-surface-container)] border-t border-[var(--m3-outline-variant)]/60 flex items-center justify-center">
             <div className="text-[11px] font-bold text-[var(--m3-on-surface-variant)] flex items-center gap-2">
                <PieChart className="w-3.5 h-3.5" />
                Detaillierte Statistiken helfen dir, deinen Beitrag zum Haushalt zu verstehen.
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
