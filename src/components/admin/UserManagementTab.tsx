import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  User as UserIcon, 
  Edit2, 
  Trash2, 
  Award, 
  Check, 
  Target, 
  KeyRound, 
  Sparkles 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FamilyMember, UserRole } from '../../types';
import { getInitials } from '../../utils';
import { ConfirmModal } from '../ConfirmModal';

export const UserManagementTab: React.FC = () => {
  const { data, addMember, updateMember, deleteMember, activeUser } = useApp();
  const members = Object.values(data.members);

  // Modals & form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<FamilyMember | null>(null);
  const [pointsAdjustMember, setPointsAdjustMember] = useState<FamilyMember | null>(null);
  const [pointsDelta, setPointsDelta] = useState<number>(5);
  const [pointsReason, setPointsReason] = useState<string>('');

  // Add Member form fields
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#4F46E5');
  const [newRole, setNewRole] = useState<UserRole>('member');
  const [newWeeklyTarget, setNewWeeklyTarget] = useState<number>(data.settings.default_weekly_target || 50);
  const [newPin, setNewPin] = useState('');

  // Edit Member form fields
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('member');
  const [editWeeklyTarget, setEditWeeklyTarget] = useState<number>(50);
  const [editPin, setEditPin] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const PRESET_COLORS = [
    '#4F46E5', // Indigo
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#8B5CF6', // Purple
    '#EF4444', // Red
    '#64748B'  // Slate
  ];

  const handleOpenAddModal = () => {
    setNewName('');
    setNewColor('#4F46E5');
    setNewRole('member');
    setNewWeeklyTarget(data.settings.default_weekly_target || 50);
    setNewPin('');
    setShowAddModal(true);
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const cleanPin = newPin.trim();
    await addMember(
      newName.trim(),
      newColor,
      newRole,
      newWeeklyTarget,
      cleanPin.length === 4 ? cleanPin : undefined
    );
    setShowAddModal(false);
    showToast(`Mitglied "${newName.trim()}" erfolgreich hinzugefügt!`);
  };

  const handleOpenEditModal = (member: FamilyMember) => {
    setEditingMember(member);
    setEditName(member.name);
    setEditColor(member.avatar_color);
    setEditRole(member.role);
    setEditWeeklyTarget(member.weekly_target || data.settings.default_weekly_target || 50);
    setEditPin(member.pin_code || '');
  };

  const handleSaveEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editName.trim()) return;
    const cleanPin = editPin.trim();
    await updateMember(editingMember.id, {
      name: editName.trim(),
      avatar_color: editColor,
      role: editRole,
      weekly_target: editWeeklyTarget,
      pin_code: cleanPin.length === 4 ? cleanPin : undefined
    });
    setEditingMember(null);
    showToast(`Änderungen an "${editName.trim()}" gespeichert!`);
  };

  const handleQuickToggleRole = async (member: FamilyMember) => {
    const nextRole: UserRole = member.role === 'admin' ? 'member' : 'admin';
    await updateMember(member.id, { role: nextRole });
    showToast(`${member.name} ist nun ${nextRole === 'admin' ? 'Administrator' : 'Mitglied'}!`);
  };

  const handleApplyPointsAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pointsAdjustMember || pointsDelta === 0) return;
    const currentPoints = pointsAdjustMember.total_points || 0;
    const updatedPoints = Math.max(0, currentPoints + pointsDelta);
    await updateMember(pointsAdjustMember.id, { total_points: updatedPoints });
    setPointsAdjustMember(null);
    setPointsReason('');
    showToast(`${pointsDelta > 0 ? `+${pointsDelta}` : pointsDelta} Punkte für ${pointsAdjustMember.name} verbucht!`);
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    await deleteMember(memberToDelete.id);
    showToast(`Mitglied "${memberToDelete.name}" wurde entfernt.`);
    setMemberToDelete(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-6"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs shadow-lg"
        >
          <Check className="w-4 h-4 text-emerald-500" />
          <span>{toastMessage}</span>
        </motion.div>
      )}

      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--m3-on-surface)] flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--m3-primary)]" />
            Mitglieder-Verwaltung von A bis Z
          </h2>
          <p className="text-xs text-[var(--m3-on-surface-variant)] mt-0.5">
            Passe jedes Detail separat an: Name, Administrator-Rechte, individuelles Wochenziel und Punktestand.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleOpenAddModal}
          className="m3-btn-filled px-5 py-2.5 text-xs font-black inline-flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Mitglied hinzufügen</span>
        </motion.button>
      </div>

      {/* Members Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map((m) => {
          const isCurrentActive = activeUser?.id === m.id;
          const isAdminRole = m.role === 'admin';

          return (
            <div
              key={m.id}
              className="p-6 rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm relative flex flex-col justify-between"
            >
              <div>
                {/* Top Row: Avatar + Name + Role Badge */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      style={{ backgroundColor: m.avatar_color }}
                      className="w-13 h-13 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-sm ring-2 ring-white/20"
                    >
                      {getInitials(m.name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-base text-[var(--m3-on-surface)]">
                          {m.name}
                        </span>
                        {isCurrentActive && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] font-black">
                            Du
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {m.pin_code && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[var(--m3-outline)] font-bold">
                            <KeyRound className="w-3 h-3 text-emerald-500" />
                            PIN aktiv
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Role Toggle Switch / Badge */}
                  <button
                    onClick={() => handleQuickToggleRole(m)}
                    title="Klicken, um Rolle zwischen Admin und Mitglied umzuschalten"
                    className={`px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                      isAdminRole
                        ? 'bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] border border-[var(--m3-primary)]/20 shadow-2xs'
                        : 'bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface-variant)] border border-[var(--m3-outline-variant)]'
                    }`}
                  >
                    {isAdminRole ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Administrator</span>
                      </>
                    ) : (
                      <>
                        <UserIcon className="w-3.5 h-3.5" />
                        <span>Mitglied</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Details Metrics */}
                <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)]/60 text-xs mb-4 shadow-2xs">
                  <div>
                    <span className="text-[11px] text-[var(--m3-on-surface-variant)] font-bold block mb-0.5">Individuelles Wochenziel:</span>
                    <span className="font-black text-sm text-[var(--m3-primary)] flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" />
                      {m.weekly_target || 50} Pkt.
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[var(--m3-on-surface-variant)] font-bold block mb-0.5">Gesamtpunkte:</span>
                    <span className="font-black text-sm text-[var(--m3-on-surface)] flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      {m.total_points || 0} Pkt.
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Edit, Points Adjust, Delete */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--m3-outline-variant)]/60">
                <button
                  type="button"
                  onClick={() => {
                    setPointsAdjustMember(m);
                    setPointsDelta(5);
                    setPointsReason('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] text-xs font-black flex items-center gap-1.5 transition hover:brightness-105"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Punkte anpassen</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(m)}
                    className="p-2 rounded-xl text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-high)] transition"
                    title="Mitgliedsdetails bearbeiten"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setMemberToDelete(m)}
                      className="p-2 rounded-xl text-[var(--m3-outline)] hover:text-rose-500 hover:bg-rose-500/10 transition"
                      title="Mitglied löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: ADD MEMBER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md rounded-[28px] bg-[var(--m3-surface-container-high)] border border-[var(--m3-outline-variant)] p-6 shadow-2xl"
          >
            <h3 className="text-base font-black text-[var(--m3-on-surface)] mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[var(--m3-primary)]" />
              Neues Haushaltsmitglied anlegen
            </h3>

            <form onSubmit={handleCreateMember} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="z. B. Leo, Papa, Sarah..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-sm font-bold text-[var(--m3-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--m3-primary)] shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-1.5">
                  Profilfarbe
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-7 h-7 rounded-xl transition-transform ${
                        newColor === c ? 'ring-2 ring-[var(--m3-primary)] ring-offset-2 scale-110 shadow-xs' : 'opacity-80 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-1.5">
                    Rolle
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-xs font-bold text-[var(--m3-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--m3-primary)]"
                  >
                    <option value="member">Mitglied</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-1.5">
                    Wochenziel (Pkt.)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    step="5"
                    value={newWeeklyTarget}
                    onChange={(e) => setNewWeeklyTarget(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-xs font-bold text-[var(--m3-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--m3-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-1.5">
                  Optionaler 4-stelliger PIN-Code
                </label>
                <input
                  type="password"
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="Leer lassen für ungeschützt"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-sm tracking-widest font-mono text-[var(--m3-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--m3-primary)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--m3-outline-variant)]/60">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[var(--m3-on-surface-variant)] rounded-full hover:bg-[var(--m3-surface-container-highest)]"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="m3-btn-filled px-5 py-2 text-xs font-black"
                >
                  Mitglied anlegen
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: EDIT MEMBER */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md rounded-[28px] bg-[var(--m3-surface-container-high)] border border-[var(--m3-outline-variant)] p-6 shadow-2xl"
          >
            <h3 className="text-base font-black text-[var(--m3-on-surface)] mb-4 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-[var(--m3-primary)]" />
              Mitglied bearbeiten: {editingMember.name}
            </h3>

            <form onSubmit={handleSaveEditMember} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-sm font-bold text-[var(--m3-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--m3-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-1.5">
                  Avatar-Farbe
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-7 h-7 rounded-xl transition-transform ${
                        editColor === c ? 'ring-2 ring-[var(--m3-primary)] ring-offset-2 scale-110 shadow-xs' : 'opacity-80 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-1.5">
                    Rolle (Berechtigungen)
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-xs font-bold text-[var(--m3-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--m3-primary)]"
                  >
                    <option value="member">Mitglied</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-1.5">
                    Individuelles Ziel (Pkt.)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    step="5"
                    value={editWeeklyTarget}
                    onChange={(e) => setEditWeeklyTarget(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-xs font-bold text-[var(--m3-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--m3-primary)]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)]">
                    PIN-Schutz (4 Ziffern)
                  </label>
                  {editPin && (
                    <button
                      type="button"
                      onClick={() => setEditPin('')}
                      className="text-[11px] text-rose-500 font-bold hover:underline"
                    >
                      PIN entfernen
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="Leer lassen für ungeschützt"
                  value={editPin}
                  onChange={(e) => setEditPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-sm tracking-widest font-mono text-[var(--m3-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--m3-primary)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--m3-outline-variant)]/60">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 text-xs font-bold text-[var(--m3-on-surface-variant)] rounded-full hover:bg-[var(--m3-surface-container-highest)]"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="m3-btn-filled px-5 py-2 text-xs font-black"
                >
                  Speichern
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: MANUAL POINTS ADJUSTMENT / BONUS */}
      {pointsAdjustMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-sm rounded-[28px] bg-[var(--m3-surface-container-high)] border border-[var(--m3-outline-variant)] p-6 shadow-2xl"
          >
            <h3 className="text-base font-black text-[var(--m3-on-surface)] mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--m3-primary)]" />
              Punkte anpassen: {pointsAdjustMember.name}
            </h3>
            <p className="text-xs text-[var(--m3-on-surface-variant)] mb-4">
              Vergib Sonderpunkte (z.B. für außergewöhnlichen Einsatz) oder passe den aktuellen Stand an.
            </p>

            <form onSubmit={handleApplyPointsAdjustment} className="space-y-4">
              <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] shadow-2xs">
                <button
                  type="button"
                  onClick={() => setPointsDelta((d) => d - 5)}
                  className="w-10 h-10 rounded-xl bg-[var(--m3-surface-container-highest)] text-[var(--m3-on-surface)] flex items-center justify-center font-black text-sm"
                >
                  -5
                </button>
                <div className="text-center w-24">
                  <span className={`text-2xl font-black ${pointsDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {pointsDelta >= 0 ? `+${pointsDelta}` : pointsDelta}
                  </span>
                  <span className="text-[10px] text-[var(--m3-outline)] block font-bold">Punkte</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPointsDelta((d) => d + 5)}
                  className="w-10 h-10 rounded-xl bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] flex items-center justify-center font-black text-sm"
                >
                  +5
                </button>
              </div>

              <div className="flex justify-center gap-2">
                {[5, 10, 20, -5, -10].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setPointsDelta(quick)}
                    className="px-2.5 py-1 text-xs font-black rounded-lg bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-high)]"
                  >
                    {quick > 0 ? `+${quick}` : quick}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-1.5">
                  Begründung / Notiz (optional)
                </label>
                <input
                  type="text"
                  placeholder="z. B. Großputz Keller oder Ausgleich..."
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  className="w-full px-4 py-2 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-xs text-[var(--m3-on-surface)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--m3-outline-variant)]/60">
                <button
                  type="button"
                  onClick={() => setPointsAdjustMember(null)}
                  className="px-4 py-2 text-xs font-bold text-[var(--m3-on-surface-variant)] rounded-full hover:bg-[var(--m3-surface-container-highest)]"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="m3-btn-filled px-5 py-2 text-xs font-black"
                >
                  Punkte buchen
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={!!memberToDelete}
        title="Mitglied entfernen?"
        message={`Möchtest du "${memberToDelete?.name}" wirklich aus dem Haushalt löschen? Alle individuellen Einstellungen gehen dabei verloren.`}
        confirmLabel="Ja, löschen"
        cancelLabel="Abbrechen"
        onConfirm={handleConfirmDelete}
        onCancel={() => setMemberToDelete(null)}
        isDanger={true}
      />
    </motion.div>
  );
};
