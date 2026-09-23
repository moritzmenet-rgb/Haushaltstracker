import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, UserPlus, Sparkles, Check, Lock, KeyRound, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getInitials } from '../utils';
import { FamilyMember } from '../types';
import { PinModal } from './PinModal';

interface ProfileSelectorProps {
  isOpen: boolean;
  onClose?: () => void;
  onOpenSettings?: () => void;
  canClose?: boolean;
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  canClose = false
}) => {
  const { data, activeUser, isAdmin, setActiveUserId, addMember, initializeAdminProfile, firebaseUser } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#4F46E5');
  const [newRole, setNewRole] = useState<'admin' | 'member'>('member');
  const [newPin, setNewPin] = useState('');
  const [pendingPinMember, setPendingPinMember] = useState<FamilyMember | null>(null);

  const membersList = Object.values(data.members);
  const isInitialSetup = membersList.length === 0;
  const canAddMembers = isAdmin || isInitialSetup;

  const suggestedAdminName = React.useMemo(() => {
    if (firebaseUser?.displayName && firebaseUser.displayName.trim().length > 0) {
      return firebaseUser.displayName.split(' ')[0];
    }
    if (firebaseUser?.email) {
      const prefix = firebaseUser.email.split('@')[0].replace(/[._-]/g, ' ');
      return prefix.charAt(0).toUpperCase() + prefix.slice(1).split(' ')[0];
    }
    return 'Moritz';
  }, [firebaseUser]);

  if (!isOpen) return null;

  const handleSelectProfile = (member: FamilyMember) => {
    if (member.pin_code && member.pin_code.trim().length > 0) {
      setPendingPinMember(member);
    } else {
      setActiveUserId(member.id);
      if (onClose) onClose();
    }
  };

  const handlePinSuccess = () => {
    if (pendingPinMember) {
      setActiveUserId(pendingPinMember.id);
      setPendingPinMember(null);
      if (onClose) onClose();
    }
  };

  const handleQuickStartAdmin = () => {
    const admin = initializeAdminProfile(suggestedAdminName, '#4F46E5', true);
    setActiveUserId(admin.id);
    if (onClose) onClose();
  };

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = newName.trim() || (isInitialSetup ? suggestedAdminName : '');
    if (!finalName) return;
    const roleToAssign = isInitialSetup ? 'admin' : newRole;
    const created = addMember(finalName, newColor, roleToAssign, 50, newPin.trim() || undefined);
    if (isInitialSetup && created) {
      setActiveUserId(created.id);
      if (onClose) onClose();
    }
    setNewName('');
    setNewPin('');
    setShowAddForm(false);
  };

  const PRESET_COLORS = [
    '#4F46E5', // Indigo
    '#059669', // Emerald
    '#E11D48', // Rose
    '#D97706', // Amber
    '#06B6D4', // Cyan
    '#8B5CF6'  // Purple
  ];

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 sm:p-6 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.94, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="w-full max-w-4xl text-center my-auto py-8 px-6 sm:px-10 rounded-[32px] bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)] shadow-2xl relative"
          >
            {/* Header */}
            <div className="absolute top-6 right-6 flex gap-2">
              <button
                onClick={onOpenSettings}
                className="p-2.5 rounded-2xl bg-[var(--m3-surface-container-highest)] border border-[var(--m3-outline-variant)] text-[var(--m3-on-surface-variant)] hover:text-[var(--m3-primary)] transition shadow-sm group"
                title="Einstellungen & Cloud-Sync"
              >
                <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
              </button>
            </div>

            <div className="mb-8 sm:mb-12">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--m3-surface-container-high)] border border-[var(--m3-outline-variant)] text-[var(--m3-on-surface-variant)] text-xs font-black uppercase tracking-wider mb-4 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Familien-Haushalt
              </div>

              {/* Connected Google Account Badge if initial setup */}
              {isInitialSetup && firebaseUser && (
                <div className="mb-6 p-3.5 sm:p-4 rounded-3xl bg-[var(--m3-primary-container)]/40 border border-[var(--m3-primary)]/25 text-[var(--m3-on-primary-container)] max-w-md mx-auto flex items-center gap-3 text-left shadow-xs">
                  <div className="w-10 h-10 rounded-2xl bg-[var(--m3-primary)] text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {suggestedAdminName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[var(--m3-primary)]">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      Google-Konto angemeldet
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-[var(--m3-on-surface)] truncate">
                      {firebaseUser.email}
                    </p>
                  </div>
                </div>
              )}

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[var(--m3-on-surface)] mb-3">
                {isInitialSetup 
                  ? (firebaseUser ? `Willkommen, ${suggestedAdminName}!` : 'Erstelle das erste Profil') 
                  : 'Wer macht heute Haushalt?'}
              </h1>
              <p className="text-sm sm:text-base text-[var(--m3-on-surface-variant)] max-w-md mx-auto font-medium">
                {isInitialSetup
                  ? 'Jedes Familienmitglied erhält ein eigenes Profil für Aufgaben und Punkte. Starte jetzt deinen Haushalt als Administrator:'
                  : 'Wähle dein Profil aus, um Aufgaben zu sehen, erledigte Arbeiten zu erfassen und Punkte zu sammeln.'}
              </p>
            </div>

            {/* If initial setup and not showing the form: 1-Click Quickstart */}
            {isInitialSetup && !showAddForm ? (
              <div className="max-w-md mx-auto mb-10 space-y-3.5">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleQuickStartAdmin}
                  className="w-full py-4 px-6 rounded-3xl bg-[var(--m3-primary)] text-white font-black text-base flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>Als {suggestedAdminName} (Admin) starten</span>
                </motion.button>

                <div className="p-3.5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] text-xs font-bold text-[var(--m3-on-surface-variant)] flex items-center justify-center gap-2 shadow-2xs">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Inklusive 8 Standard-Aufgaben für Küche, Bad, Müll & Co.</span>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewName(suggestedAdminName);
                      setShowAddForm(true);
                    }}
                    className="text-xs font-bold text-[var(--m3-on-surface-variant)] hover:text-[var(--m3-primary)] transition underline decoration-dotted cursor-pointer"
                  >
                    Profil anpassen (anderer Name, PIN oder Farbe)...
                  </button>
                </div>
              </div>
            ) : null}

            {/* Profile Tiles Grid (When not initial setup) */}
            {!isInitialSetup && (
              <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10 mb-10">
                {membersList.map((member) => {
                  const isCurrent = activeUser?.id === member.id;
                  const initials = getInitials(member.name);
                  const hasPin = Boolean(member.pin_code && member.pin_code.trim().length > 0);

                  return (
                    <motion.button
                      key={member.id}
                      whileHover={{ scale: 1.08, y: -4 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleSelectProfile(member)}
                      className="group flex flex-col items-center focus:outline-none cursor-pointer"
                    >
                      <div className="relative">
                        {/* Avatar box */}
                        <div
                          style={{ backgroundColor: member.avatar_color }}
                          className={`w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] flex items-center justify-center text-white font-black text-3xl sm:text-4xl shadow-xl transition-all duration-300 border-2 ${
                            isCurrent
                              ? 'ring-4 ring-[var(--m3-primary)] border-transparent shadow-[var(--m3-primary)]/20'
                              : 'border-white/10 group-hover:border-white/40'
                          }`}
                        >
                          {initials}
                        </div>

                        {/* Admin Badge */}
                        {member.role === 'admin' && (
                          <div className="absolute -top-2 -right-2 bg-[var(--m3-primary)] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                            <ShieldCheck className="w-3 h-3" />
                            Admin
                          </div>
                        )}

                        {/* PIN Protected Indicator */}
                        {hasPin && (
                          <div 
                            className="absolute -top-2 -left-2 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md"
                            title="PIN-Code geschützt"
                          >
                            <Lock className="w-2.5 h-2.5" />
                            <span>PIN</span>
                          </div>
                        )}

                        {/* Active checkmark */}
                        {isCurrent && (
                          <div className="absolute -bottom-2 right-2 bg-[var(--m3-primary)] text-white rounded-full p-1 shadow-md">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Name and points */}
                      <span className="mt-3 text-base sm:text-lg font-black text-[var(--m3-on-surface)] group-hover:text-[var(--m3-primary)] transition-colors">
                        {member.name}
                      </span>
                      <span className="text-xs font-bold text-[var(--m3-on-surface-variant)]">
                        {member.total_points || 0} Pkt.
                      </span>
                    </motion.button>
                  );
                })}

                {/* Add Profile Tile (Only visible if admin) */}
                {canAddMembers && !showAddForm && (
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setShowAddForm(true)}
                    className="group flex flex-col items-center focus:outline-none cursor-pointer"
                  >
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] border-2 border-dashed border-[var(--m3-outline)] group-hover:border-[var(--m3-primary)] flex items-center justify-center text-[var(--m3-outline)] group-hover:text-[var(--m3-primary)] transition-all duration-300 bg-[var(--m3-surface)]">
                      <UserPlus className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2]" />
                    </div>
                    <span className="mt-3 text-sm sm:text-base font-black text-[var(--m3-on-surface-variant)] group-hover:text-[var(--m3-primary)] transition-colors">
                      Profil hinzufügen
                    </span>
                    <span className="text-xs text-[var(--m3-primary)] font-bold">
                      Nur Admin
                    </span>
                  </motion.button>
                )}
              </div>
            )}

            {/* Non-admin hint if profiles exist */}
            {!canAddMembers && !showAddForm && membersList.length > 0 && (
              <p className="text-xs text-[var(--m3-on-surface-variant)] max-w-sm mx-auto mb-8 bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] rounded-2xl py-2 px-3 font-medium shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--m3-primary)] inline mr-1 -mt-0.5" />
                Neue Profile können nur von einem Administrator angelegt werden.
              </p>
            )}

            {/* Inline Add Member Form (Admin only) */}
            <AnimatePresence>
              {showAddForm && canAddMembers && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleCreateProfile}
                  className="max-w-md mx-auto p-6 rounded-[28px] bg-[var(--m3-surface-container-high)] border border-[var(--m3-outline-variant)] text-left mb-8 shadow-2xl"
                >
                  <h3 className="text-sm font-black text-[var(--m3-on-surface)] mb-4 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-[var(--m3-primary)]" />
                    {isInitialSetup ? 'Erstes Profil erstellen (Admin)' : 'Neues Mitglied anlegen'}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={isInitialSetup ? suggestedAdminName : 'z. B. Sophie'}
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm font-bold rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-[var(--m3-on-surface)] placeholder-[var(--m3-outline)] focus:outline-none focus:ring-2 focus:ring-[var(--m3-primary)] shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-1.5">
                        Profilfarbe
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_COLORS.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewColor(c)}
                            style={{ backgroundColor: c }}
                            className={`w-7 h-7 rounded-xl transition-transform ${
                              newColor === c ? 'ring-2 ring-[var(--m3-primary)] ring-offset-2 scale-110 shadow-xs' : 'opacity-70 hover:opacity-100'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Role selector */}
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-1">
                        Rolle
                      </label>
                      {isInitialSetup ? (
                        <div className="px-3.5 py-2.5 text-xs rounded-2xl bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] font-black flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4" />
                          Administrator (Erster Nutzer im Haushalt)
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setNewRole('member')}
                            className={`px-3 py-2 text-xs font-black rounded-xl border text-center transition cursor-pointer ${
                              newRole === 'member'
                                ? 'bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] border-[var(--m3-primary)]/30'
                                : 'bg-[var(--m3-surface)] text-[var(--m3-on-surface-variant)] border-[var(--m3-outline-variant)]'
                            }`}
                          >
                            Mitglied
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewRole('admin')}
                            className={`px-3 py-2 text-xs font-black rounded-xl border text-center transition flex items-center justify-center gap-1.5 cursor-pointer ${
                              newRole === 'admin'
                                ? 'bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] border-[var(--m3-primary)]/30'
                                : 'bg-[var(--m3-surface)] text-[var(--m3-on-surface-variant)] border-[var(--m3-outline-variant)]'
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Admin
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Optional PIN Protection */}
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-1 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                        Optionaler PIN-Code (4 Ziffern)
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        placeholder="z. B. 1234 (leer lassen für ungeschützt)"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full px-4 py-2 text-sm font-mono tracking-widest rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-[var(--m3-on-surface)] placeholder-[var(--m3-outline)] focus:outline-none focus:ring-2 focus:ring-[var(--m3-primary)]"
                      />
                      <p className="text-[11px] text-[var(--m3-on-surface-variant)] mt-1 font-medium">
                        Schützt das Profil vor versehentlichem Wechsel durch Mitbewohner.
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--m3-outline-variant)]/60">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-3 py-1.5 text-xs font-bold text-[var(--m3-on-surface-variant)] hover:text-[var(--m3-on-surface)] cursor-pointer"
                      >
                        Abbrechen
                      </button>
                      <button
                        type="submit"
                        className="m3-btn-filled px-4 py-2 text-xs font-black cursor-pointer"
                      >
                        {isInitialSetup ? 'Haushalt starten' : 'Mitglied anlegen'}
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Close button if user already had an active profile */}
            {canClose && (
              <button
                onClick={onClose}
                className="text-xs font-black text-[var(--m3-on-surface-variant)] hover:text-[var(--m3-on-surface)] transition-colors uppercase tracking-wider cursor-pointer"
              >
                Abbrechen & Zurück
              </button>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* PIN Verification Modal */}
      <PinModal
        isOpen={!!pendingPinMember}
        member={pendingPinMember}
        onSuccess={handlePinSuccess}
        onCancel={() => setPendingPinMember(null)}
      />
    </>
  );
};
