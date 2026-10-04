import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, UserPlus, Sparkles, Check, Lock, KeyRound, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getInitials } from '../utils';
import { FamilyMember } from '../types';
import { PinModal } from './PinModal';
import { UserBadge } from './UserBadge';

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
  const { 
    data, 
    activeUser, 
    isAdmin, 
    setActiveUserId, 
    addMember, 
    initializeAdminProfile, 
    firebaseUser,
    loginWithGoogle,
    recordSession
  } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#4F46E5');
  const [newRole, setNewRole] = useState<'admin' | 'member'>('member');
  const [newPin, setNewPin] = useState('');
  const [pendingPinMember, setPendingPinMember] = useState<FamilyMember | null>(null);
  const [pendingAdminMember, setPendingAdminMember] = useState<FamilyMember | null>(null);
  const [showGoogleAuthModal, setShowGoogleAuthModal] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [googleLoginError, setGoogleLoginError] = useState<string | null>(null);

  const membersList = Object.values(data.members);
  const isInitialSetup = membersList.length === 0;
  const canAddMembers = isAdmin || isInitialSetup;

  const isGoogleAuth = Boolean(
    firebaseUser &&
    !firebaseUser.isAnonymous &&
    (firebaseUser.providerData?.some(p => p.providerId === 'google.com' || p.providerId === 'apple.com') || (firebaseUser.email && !firebaseUser.isAnonymous))
  );

  const isAppleUser = firebaseUser?.providerData?.some(p => p.providerId === 'apple.com');
  const providerLabel = isAppleUser ? 'Apple-ID angemeldet' : 'Google-Konto angemeldet';

  const suggestedAdminName = React.useMemo(() => {
    if (firebaseUser?.displayName && firebaseUser.displayName.trim().length > 0) {
      const first = firebaseUser.displayName.split(' ')[0];
      if (first) return first;
    }
    if (firebaseUser?.email) {
      const prefix = firebaseUser.email.split('@')[0].replace(/[._-]/g, ' ');
      const formatted = prefix.charAt(0).toUpperCase() + prefix.slice(1).split(' ')[0];
      if (formatted) return formatted;
    }
    return isAppleUser ? 'Familien-Admin' : 'Moritz';
  }, [firebaseUser, isAppleUser]);

  const adminInitial = (suggestedAdminName[0] || 'A').toUpperCase();

  if (!isOpen) return null;

  const handleSelectProfile = (member: FamilyMember) => {
    // If it's an ADMIN profile: Google authentication is strictly mandatory!
    if (member.role === 'admin') {
      if (!isGoogleAuth) {
        setPendingAdminMember(member);
        setShowGoogleAuthModal(true);
        setGoogleLoginError(null);
        return;
      }

      // If already Google authenticated:
      if (member.pin_code && member.pin_code.trim().length > 0) {
        setPendingPinMember(member);
      } else {
        if (firebaseUser) {
          recordSession(firebaseUser, member, 'admin_switch');
        }
        setActiveUserId(member.id);
        if (canClose && onClose) onClose();
      }
      return;
    }

    // Regular non-admin member: no Google login required
    if (member.pin_code && member.pin_code.trim().length > 0) {
      setPendingPinMember(member);
    } else {
      setActiveUserId(member.id);
      if (canClose && onClose) onClose();
    }
  };

  const handleAdminGoogleLogin = async () => {
    setIsLoggingIn(true);
    setGoogleLoginError(null);
    try {
      const user = await loginWithGoogle();
      if (user && pendingAdminMember) {
        // Track the session in the background
        await recordSession(user, pendingAdminMember, 'admin_login');
        setShowGoogleAuthModal(false);
        // If member has PIN, prompt PIN
        if (pendingAdminMember.pin_code && pendingAdminMember.pin_code.trim().length > 0) {
          setPendingPinMember(pendingAdminMember);
        } else {
          setActiveUserId(pendingAdminMember.id);
          if (canClose && onClose) onClose();
        }
        setPendingAdminMember(null);
      }
    } catch (err: any) {
      setGoogleLoginError(err?.message || 'Google-Anmeldung fehlgeschlagen.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePinSuccess = () => {
    if (pendingPinMember) {
      if (pendingPinMember.role === 'admin' && firebaseUser) {
        recordSession(firebaseUser, pendingPinMember, 'admin_login');
      }
      setActiveUserId(pendingPinMember.id);
      setPendingPinMember(null);
      if (canClose && onClose) onClose();
    }
  };

  const handleQuickStartAdmin = async () => {
    if (!isGoogleAuth) {
      const user = await loginWithGoogle();
      if (!user) return;
      await recordSession(user, null, 'admin_login');
    }
    const admin = await initializeAdminProfile(suggestedAdminName, '#4F46E5', false);
    if (firebaseUser) {
      await recordSession(firebaseUser, admin, 'admin_login');
    }
    setActiveUserId(admin.id);
    if (canClose && onClose) onClose();
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = newName.trim() || (isInitialSetup ? suggestedAdminName : '');
    if (!finalName) return;
    const roleToAssign = isInitialSetup ? 'admin' : newRole;

    if (roleToAssign === 'admin' && !isGoogleAuth) {
      const user = await loginWithGoogle();
      if (!user) return;
    }

    const created = await addMember(finalName, newColor, roleToAssign, 50, newPin.trim() || undefined);
    if (isInitialSetup && created) {
      if (firebaseUser) {
        await recordSession(firebaseUser, created, 'admin_login');
      }
      setActiveUserId(created.id);
      if (canClose && onClose) onClose();
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="w-full max-w-2xl md:max-w-3xl text-center my-auto py-5 sm:py-8 px-3 sm:px-8 max-h-[92vh] sm:max-h-[88vh] overflow-y-auto m3-dialog relative shadow-2xl"
          >
            {/* Header */}
            {canClose && activeUser && onOpenSettings && (
              <div className="absolute top-4 sm:top-6 right-4 sm:right-6 flex gap-2">
                <button
                  onClick={onOpenSettings}
                  className="p-2 sm:p-2.5 rounded-2xl bg-[var(--m3-surface-container-highest)] border border-[var(--m3-outline-variant)] text-[var(--m3-on-surface-variant)] hover:text-[var(--m3-primary)] transition shadow-sm group cursor-pointer"
                  title="Einstellungen & Cloud-Sync"
                >
                  <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
                </button>
              </div>
            )}

            <div className="mb-6 sm:mb-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--m3-surface-container-high)] border border-[var(--m3-outline-variant)] text-[var(--m3-on-surface-variant)] text-xs font-black uppercase tracking-wider mb-3 sm:mb-4 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Familien-Haushalt
              </div>

              {/* Connected Account Badge if initial setup */}
              {isInitialSetup && firebaseUser && (
                <div className="mb-6 p-3.5 sm:p-4 rounded-3xl bg-[var(--m3-primary-container)]/40 border border-[var(--m3-primary)]/25 text-[var(--m3-on-primary-container)] max-w-md mx-auto flex items-center gap-3 text-left shadow-xs">
                  <div className="w-10 h-10 rounded-2xl bg-[var(--m3-primary)] text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {adminInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[var(--m3-primary)]">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      {providerLabel}
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-[var(--m3-on-surface)] truncate">
                      {firebaseUser.email || (isAppleUser ? 'Apple-ID verknüpft' : 'Angemeldet')}
                    </p>
                  </div>
                </div>
              )}

              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-[var(--m3-on-surface)] mb-2 sm:mb-3">
                {isInitialSetup 
                  ? (firebaseUser ? `Willkommen, ${suggestedAdminName}!` : 'Erstelle das erste Profil') 
                  : 'Wer macht heute Haushalt?'}
              </h1>
              <p className="text-xs sm:text-base text-[var(--m3-on-surface-variant)] max-w-md mx-auto font-medium">
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
                  <span>Startet mit einem sauberen, leeren Haushalt für eigene Aufgaben.</span>
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
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.1 }
                  }
                }}
                className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 mb-6 sm:mb-10"
              >
                {membersList.map((member) => {
                  const isCurrent = activeUser?.id === member.id;
                  const initials = getInitials(member.name);
                  const hasPin = Boolean(member.pin_code && member.pin_code.trim().length > 0);

                  return (
                    <motion.button
                      key={member.id}
                      variants={{
                        hidden: { opacity: 0, scale: 0.8, y: 20 },
                        visible: { opacity: 1, scale: 1, y: 0 }
                      }}
                      whileHover={{ scale: 1.08, y: -4 }}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => handleSelectProfile(member)}
                      className="group flex flex-col items-center focus:outline-none cursor-pointer"
                    >
                      <div className="relative">
                        {/* Avatar box */}
                        <div
                          style={{ backgroundColor: member.avatar_color }}
                          className={`w-20 h-20 sm:w-28 sm:h-28 rounded-[24px] sm:rounded-[28px] flex items-center justify-center text-white font-black text-2xl sm:text-4xl shadow-xl transition-all duration-300 border-2 ${
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
                      <div className="mt-2.5 sm:mt-3 flex items-center justify-center gap-1.5 flex-wrap">
                        <span className="text-sm sm:text-lg font-black text-[var(--m3-on-surface)] group-hover:text-[var(--m3-primary)] transition-colors">
                          {member.name}
                        </span>
                        <UserBadge badgeId={member.active_badge_id} size="sm" />
                      </div>
                      <span className="text-[11px] sm:text-xs font-bold text-[var(--m3-on-surface-variant)]">
                        {member.total_points || 0} Pkt.
                      </span>
                    </motion.button>
                  );
                })}

                {/* Add Profile Tile (Only visible if admin) */}
                {canAddMembers && !showAddForm && (
                  <motion.button
                    variants={{
                      hidden: { opacity: 0, scale: 0.8, y: 20 },
                      visible: { opacity: 1, scale: 1, y: 0 }
                    }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setShowAddForm(true)}
                    className="group flex flex-col items-center focus:outline-none cursor-pointer"
                  >
                    <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-[24px] sm:rounded-[28px] border-2 border-dashed border-[var(--m3-outline)] group-hover:border-[var(--m3-primary)] flex items-center justify-center text-[var(--m3-outline)] group-hover:text-[var(--m3-primary)] transition-all duration-300 bg-[var(--m3-surface)]">
                      <UserPlus className="w-7 h-7 sm:w-9 sm:h-9 stroke-[2]" />
                    </div>
                    <span className="mt-2.5 sm:mt-3 text-xs sm:text-base font-black text-[var(--m3-on-surface-variant)] group-hover:text-[var(--m3-primary)] transition-colors">
                      Profil hinzufügen
                    </span>
                    <span className="text-[10px] sm:text-xs text-[var(--m3-primary)] font-bold">
                      Nur Admin
                    </span>
                  </motion.button>
                )}
              </motion.div>
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

      {/* Admin Google Authentication Modal */}
      <AnimatePresence>
        {showGoogleAuthModal && pendingAdminMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="w-full max-w-md m3-dialog p-5 sm:p-8 text-center relative shadow-2xl border border-[var(--m3-outline-variant)] my-auto max-h-[92vh] sm:max-h-[88vh] overflow-y-auto"
            >
              {/* Shield Icon */}
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-500/30 shadow-md">
                <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs font-black uppercase tracking-wider mb-2">
                <Lock className="w-3.5 h-3.5" />
                <span>Admin-Sicherheitsprüfung</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-[var(--m3-on-surface)] tracking-tight mb-2">
                Google-Anmeldung erforderlich
              </h2>

              <p className="text-xs sm:text-sm text-[var(--m3-on-surface-variant)] mb-5 leading-relaxed font-medium">
                Für den Zugriff auf das Administrator-Konto{' '}
                <strong className="text-[var(--m3-on-surface)]">
                  {pendingAdminMember.name}
                </strong>{' '}
                musst du dich mit deinem Google-Konto anmelden.
              </p>

              {/* Background audit note */}
              <div className="p-3.5 rounded-2xl bg-[var(--m3-surface-container-high)] border border-[var(--m3-outline-variant)] text-left mb-6 flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <div className="text-xs text-[var(--m3-on-surface-variant)] leading-snug">
                  <span className="font-bold text-[var(--m3-on-surface)] block mb-0.5">
                    Hintergrund-Protokollierung aktiv
                  </span>
                  Zur Sicherheit des Haushalts wird jede Admin-Anmeldung mit Google-Konto, Zeitstempel und Gerät im System protokolliert.
                </div>
              </div>

              {googleLoginError && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold text-center">
                  {googleLoginError}
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleAdminGoogleLogin}
                  disabled={isLoggingIn}
                  className="w-full py-3.5 px-5 rounded-2xl bg-white text-zinc-900 font-black text-sm flex items-center justify-center gap-3 shadow-md hover:shadow-lg hover:bg-zinc-50 active:scale-[0.98] transition border border-zinc-200 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{isLoggingIn ? 'Anmeldung läuft...' : 'Mit Google anmelden & entsperren'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowGoogleAuthModal(false);
                    setPendingAdminMember(null);
                    setGoogleLoginError(null);
                  }}
                  disabled={isLoggingIn}
                  className="w-full py-2.5 text-xs font-bold text-[var(--m3-on-surface-variant)] hover:text-[var(--m3-on-surface)] transition cursor-pointer"
                >
                  Abbrechen (Anderes Profil wählen)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
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
