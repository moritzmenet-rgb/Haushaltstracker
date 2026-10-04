import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  Search, 
  Filter, 
  Award, 
  Clock, 
  Calendar, 
  Pin, 
  Trash2, 
  Edit3, 
  PlusCircle, 
  ShieldAlert, 
  ArrowRight,
  Layers,
  Sparkles,
  User,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRelativeDate, getInitials } from '../../utils';
import { TaskEditLog } from '../../types';

export const TaskAuditTab: React.FC = () => {
  const { taskEdits, deleteTaskEdit, isAdmin, data } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [selectedActionFilter, setSelectedActionFilter] = useState<'all' | 'created' | 'updated' | 'deleted' | 'points'>('all');

  const filteredEdits = useMemo(() => {
    return taskEdits.filter(edit => {
      // Member Filter
      if (selectedMemberId !== 'all' && edit.edited_by_id !== selectedMemberId) {
        return false;
      }

      // Action Filter
      if (selectedActionFilter === 'points') {
        const hasPointChange = edit.changes.some(c => c.field === 'base_points' || c.field === 'pinned_bonus_points');
        if (!hasPointChange) return false;
      } else if (selectedActionFilter !== 'all' && edit.action !== selectedActionFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = edit.task_title.toLowerCase().includes(query);
        const matchesEditor = edit.edited_by_name.toLowerCase().includes(query);
        const matchesSummary = edit.summary.toLowerCase().includes(query);
        const matchesChanges = edit.changes.some(c => 
          c.field_label.toLowerCase().includes(query) || 
          String(c.old_value).toLowerCase().includes(query) || 
          String(c.new_value).toLowerCase().includes(query)
        );
        if (!matchesTitle && !matchesEditor && !matchesSummary && !matchesChanges) {
          return false;
        }
      }

      return true;
    });
  }, [taskEdits, selectedMemberId, selectedActionFilter, searchQuery]);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-[var(--m3-surface-container-low)] rounded-[28px] border border-[var(--m3-outline-variant)]">
        <ShieldAlert className="w-12 h-12 text-[var(--m3-error)] mx-auto mb-4" />
        <h2 className="text-xl font-black text-[var(--m3-on-surface)]">Zugriff verweigert</h2>
        <p className="text-sm text-[var(--m3-on-surface-variant)] mt-2">
          Nur Administratoren können das Aufgaben-Änderungsprotokoll einsehen.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] flex items-center justify-center shrink-0 shadow-xs">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-[var(--m3-on-surface)] mb-1 flex items-center gap-2">
              <span>Aufgaben-Änderungsprotokoll & Audit</span>
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--m3-primary)] text-white text-[10px] font-black uppercase tracking-wider">
                Live-Audit
              </span>
            </h2>
            <p className="text-xs text-[var(--m3-on-surface-variant)] max-w-xl leading-relaxed">
              Lückenlose Nachverfolgung aller Aufgaben-Bearbeitungen: Sieh genau, wer wann Punkte angepasst, Titel geändert, Aufgaben gelöscht oder Intervalle modifiziert hat.
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 sm:p-5 rounded-[24px] bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)] space-y-3.5">
        {/* Search Field */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--m3-outline)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Aufgabe, Bearbeiter oder Änderung suchen (z. B. Punkte, Küche, Moritz)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-xs sm:text-sm font-bold text-[var(--m3-on-surface)] placeholder-[var(--m3-outline)] focus:ring-2 focus:ring-[var(--m3-primary)] shadow-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
          {/* Action Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {[
              { id: 'all', label: 'Alle Änderungen' },
              { id: 'points', label: '💰 Punkte-Anpassungen' },
              { id: 'updated', label: '✏️ Bearbeitet' },
              { id: 'created', label: '✨ Neu erstellt' },
              { id: 'deleted', label: '🗑️ Gelöscht' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedActionFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition cursor-pointer border ${
                  selectedActionFilter === tab.id
                    ? 'bg-[var(--m3-primary)] text-[var(--m3-on-primary)] border-[var(--m3-primary)] shadow-xs'
                    : 'bg-[var(--m3-surface)] text-[var(--m3-on-surface-variant)] border-[var(--m3-outline-variant)] hover:bg-[var(--m3-surface-container-high)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Member Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-[var(--m3-on-surface-variant)] flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-[var(--m3-primary)]" />
              <span>Bearbeiter:</span>
            </span>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] text-xs font-bold text-[var(--m3-on-surface)] shadow-xs cursor-pointer"
            >
              <option value="all">Alle Mitglieder</option>
              {Object.values(data.members).map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role === 'admin' ? 'Admin' : 'Mitglied'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Log Count Banner */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-[var(--m3-on-surface-variant)]">
          Protokollierte Ereignisse: <strong>{filteredEdits.length}</strong> von {taskEdits.length}
        </span>
      </div>

      {/* Audit Log Cards */}
      <div className="grid gap-3.5">
        {filteredEdits.length === 0 ? (
          <div className="p-12 text-center text-[var(--m3-on-surface-variant)] bg-[var(--m3-surface-container-low)] rounded-[28px] border border-dashed border-[var(--m3-outline-variant)]">
            <History className="w-10 h-10 text-[var(--m3-outline)] mx-auto mb-2 opacity-40" />
            <p className="text-sm font-bold text-[var(--m3-on-surface)]">Keine Änderungsprotokolle gefunden</p>
            <p className="text-xs text-[var(--m3-on-surface-variant)] mt-1">
              Sobald jemand eine Aufgabe anlegt, Punkte ändert oder Einstellungen anpasst, erscheint der Eintrag hier in Echtzeit.
            </p>
          </div>
        ) : (
          filteredEdits.map((edit) => {
            const initials = getInitials(edit.edited_by_name);
            const isPointsChange = edit.changes.some(c => c.field === 'base_points' || c.field === 'pinned_bonus_points');

            return (
              <motion.div
                key={edit.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 rounded-[24px] border transition-all shadow-xs flex flex-col gap-3.5 ${
                  isPointsChange
                    ? 'bg-amber-500/5 border-amber-500/30 ring-1 ring-amber-500/20'
                    : edit.action === 'created'
                    ? 'bg-emerald-500/5 border-emerald-500/25'
                    : edit.action === 'deleted'
                    ? 'bg-rose-500/5 border-rose-500/25'
                    : 'bg-[var(--m3-surface-container-low)] border-[var(--m3-outline-variant)]'
                }`}
              >
                {/* Header: Editor & Timestamp */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* User Avatar */}
                    <div
                      style={{ backgroundColor: edit.edited_by_avatar_color || '#4F46E5' }}
                      className="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center text-white font-black text-xs shadow-xs"
                    >
                      {initials}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-[var(--m3-on-surface)]">
                          {edit.edited_by_name}
                        </span>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          edit.action === 'created'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : edit.action === 'deleted'
                            ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                            : isPointsChange
                            ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 font-black'
                            : 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                        }`}>
                          {edit.action === 'created'
                            ? '✨ Neu erstellt'
                            : edit.action === 'deleted'
                            ? '🗑️ Gelöscht'
                            : isPointsChange
                            ? '💰 Punkte angepasst'
                            : '✏️ Bearbeitet'}
                        </span>
                      </div>

                      <span className="text-[10px] font-bold text-[var(--m3-on-surface-variant)] flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-[var(--m3-primary)]" />
                        <span>{new Date(edit.timestamp).toLocaleString('de-DE')}</span>
                        <span>•</span>
                        <span>{formatRelativeDate(edit.timestamp)}</span>
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteTaskEdit(edit.id)}
                    className="text-[var(--m3-outline)] hover:text-rose-500 p-1.5 rounded-xl hover:bg-rose-500/10 transition cursor-pointer"
                    title="Diesen Protokolleintrag entfernen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Target Task Title */}
                <div className="pt-2 border-t border-[var(--m3-outline-variant)]/40">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[var(--m3-on-surface)]">
                    <CheckCircle2 className="w-4 h-4 text-[var(--m3-primary)]" />
                    <span>Aufgabe:</span>
                    <span className="underline decoration-[var(--m3-primary)]/40 font-extrabold">{edit.task_title}</span>
                  </div>
                  <p className="text-xs text-[var(--m3-on-surface-variant)] font-semibold mt-0.5">
                    {edit.summary}
                  </p>
                </div>

                {/* Field-by-Field Diff Changes Box */}
                {edit.changes && edit.changes.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {edit.changes.map((change, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] text-xs flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <span className="font-bold text-[var(--m3-on-surface-variant)] text-[11px]">
                          {change.field_label}:
                        </span>
                        
                        <div className="flex items-center gap-1.5 font-black text-[11px]">
                          {change.old_value !== null && (
                            <>
                              <span className="text-rose-600 dark:text-rose-400 line-through opacity-80">
                                {String(change.old_value)}
                              </span>
                              <ArrowRight className="w-3 h-3 text-[var(--m3-outline)]" />
                            </>
                          )}
                          <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                            {String(change.new_value)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
