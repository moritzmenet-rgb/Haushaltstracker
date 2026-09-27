import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, 
  Crown, 
  Sparkles, 
  Lock, 
  CheckCircle2, 
  Eye, 
  Star, 
  Flame, 
  Zap, 
  Shield, 
  Bot, 
  Brush, 
  Trash2, 
  Droplets, 
  Award, 
  Stars, 
  BookOpen, 
  Scale, 
  GraduationCap, 
  Utensils, 
  Shirt, 
  Home, 
  Palette, 
  Book, 
  BadgeCheck, 
  Moon, 
  Hourglass, 
  Egg, 
  Bug, 
  Info,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ACHIEVEMENTS_DATA, AchievementDef } from '../data/achievementsData';
import { getInitials } from '../utils';

interface BadgesMuseumProps {
  onInspectBadge?: (badge: AchievementDef) => void;
}

export const BadgesMuseum: React.FC<BadgesMuseumProps> = ({ onInspectBadge }) => {
  const { data, activeUser, isAdmin, updateMemberBadgeShowroom, updateMemberActiveBadge } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'trophies' | 'milestones' | 'secret'>('trophies');
  const [selectedBadgeForDetail, setSelectedBadgeForDetail] = useState<AchievementDef | null>(null);
  const [isAdminTestMode, setIsAdminTestMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('household_admin_test_mode') === 'true';
    }
    return false;
  });

  const toggleAdminTestMode = () => {
    const next = !isAdminTestMode;
    setIsAdminTestMode(next);
    localStorage.setItem('household_admin_test_mode', String(next));
  };

  // Determine unlocked badges for active user
  const memberUnlocked = (activeUser && data.members[activeUser.id]?.unlocked_badges) || {};
  const trophyOwners = data.trophyOwners || {}; // { trophy_king: memberId, ... }

  // Check if a badge is unlocked
  const isUnlocked = (badge: AchievementDef) => {
    if (isAdminTestMode) return true;
    if (badge.section === 'trophies') {
      return Object.values(trophyOwners).includes(activeUser?.id || '');
    }
    return Boolean(memberUnlocked[badge.id]);
  };

  const getTrophyOwnerMember = (trophyId: string) => {
    const ownerId = trophyOwners[trophyId];
    if (!ownerId) return null;
    return data.members[ownerId] || null;
  };

  const userShowroom = (activeUser && data.members[activeUser.id]?.showroom_badges) || [];
  const activeBadgeId = activeUser && data.members[activeUser.id]?.active_badge_id;

  const handleToggleShowroom = (e: React.MouseEvent, badgeId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!activeUser) return;
    let newShowroom = [...userShowroom];
    if (newShowroom.includes(badgeId)) {
      newShowroom = newShowroom.filter((id) => id !== badgeId);
    } else {
      if (newShowroom.length >= 5) {
        alert('Maximal 5 Lieblings-Abzeichen im Showroom erlaubt.');
        return;
      }
      newShowroom.push(badgeId);
    }
    updateMemberBadgeShowroom(activeUser.id, newShowroom);
  };

  const handleSetActiveBadge = (e: React.MouseEvent, badgeId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!activeUser) return;
    updateMemberActiveBadge(activeUser.id, activeId => (activeId === badgeId ? undefined : badgeId));
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Museum Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-[36px] p-8 sm:p-10 text-white shadow-2xl border border-indigo-500/20">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-indigo-500/25 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider mb-4 border border-amber-500/30">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Haushalts-Museum & Ruhmeshalle</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            Die Trophäen & Abzeichen
          </h1>
          <p className="text-sm sm:text-base text-indigo-200/90 leading-relaxed font-medium">
            Entdecke wandernde Pokale, sammle dauerhafte Meilensteine im Meilenstein-Saal und enthülle geheime Abzeichen im Dunklen Raum!
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="relative z-10 mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center gap-6 text-xs font-bold text-indigo-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Freigeschaltet: {Object.keys(memberUnlocked).length} / 30</span>
          </div>
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Pokal-Besitz: {Object.values(trophyOwners).filter(id => id === activeUser?.id).length} Pokale</span>
          </div>
        </div>
      </div>

      {/* Admin Test Mode Banner */}
      {isAdmin && (
        <div className="bg-[var(--m3-surface-container)] border-2 border-amber-500/40 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-lg">
              🧪
            </div>
            <div>
              <h4 className="text-sm font-black text-[var(--m3-on-surface)]">Admin-Testmodus</h4>
              <p className="text-xs text-[var(--m3-on-surface-variant)]">
                {isAdminTestMode ? 'Alle 30 Abzeichen sind im Testmodus temporär freigeschaltet.' : 'Schalte kurz alle Abzeichen zum Testen frei und stelle sie danach wieder auf Normalmodus zurück.'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleAdminTestMode}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shadow-sm shrink-0 ${
              isAdminTestMode 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
          >
            {isAdminTestMode ? '🔄 Normalmodus wiederherstellen' : '✨ Alle Abzeichen freischalten (Test)'}
          </button>
        </div>
      )}

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center justify-center gap-2 p-1.5 bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)]/60 rounded-2xl max-w-md mx-auto shadow-sm">
        {[
          { id: 'trophies', label: 'Pokal-Halle (4)', icon: <Crown className="w-4 h-4" /> },
          { id: 'milestones', label: 'Meilenstein-Saal (20)', icon: <Award className="w-4 h-4" /> },
          { id: 'secret', label: 'Dunkler Raum (6)', icon: <Moon className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer ${
              activeSubTab === tab.id
                ? 'bg-[var(--m3-primary)] text-[var(--m3-on-primary)] shadow-md'
                : 'text-[var(--m3-on-surface-variant)] hover:text-[var(--m3-on-surface)]'
            }`}
          >
            {tab.icon}
            <span className="hidden xs:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Section 1: Pokal-Halle */}
      {activeSubTab === 'trophies' && (
        <div className="space-y-6">
          <div className="bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)]/60 rounded-3xl p-6 text-center max-w-2xl mx-auto">
            <h3 className="text-base font-black text-[var(--m3-on-surface)] mb-1">
              Wanderpokale 👑
            </h3>
            <p className="text-xs text-[var(--m3-on-surface-variant)]">
              Diese Pokale können jeweils nur von <span className="font-bold text-[var(--m3-primary)]">einer Person</span> gehalten werden. Bei neuer Führung findet sofort ein automatischer Besitzerwechsel statt!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ACHIEVEMENTS_DATA.filter(b => b.section === 'trophies').map((badge) => {
              const currentOwner = getTrophyOwnerMember(badge.id);
              const isHeldByMe = currentOwner?.id === activeUser?.id;

              return (
                <motion.div
                  key={badge.id}
                  whileHover={{ y: -4 }}
                  className={`bg-[var(--m3-surface-container)] border rounded-[32px] p-6 shadow-lg flex flex-col justify-between relative overflow-hidden ${
                    isHeldByMe ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-[var(--m3-outline-variant)]'
                  }`}
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                  <div>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-indigo-600 p-1 flex items-center justify-center text-3xl shadow-md shrink-0">
                        <div className="w-full h-full bg-[var(--m3-surface)] rounded-[14px] flex items-center justify-center">
                          {badge.emoji}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                          Wanderpokal
                        </span>
                        {isHeldByMe && (
                          <span className="mt-1 text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Du hältst diesen Pokal!</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="text-lg font-black text-[var(--m3-on-surface)] mb-1">
                      {badge.title}
                    </h4>
                    <p className="text-xs text-[var(--m3-on-surface-variant)] mb-6 leading-relaxed">
                      {badge.description}
                    </p>
                  </div>

                  {/* Current Holder Card */}
                  <div className="pt-4 border-t border-[var(--m3-outline-variant)]/50 flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--m3-on-surface-variant)]">Aktueller Besitzer:</span>
                    {currentOwner ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] shadow-xs">
                        <div
                          style={{ backgroundColor: currentOwner.avatar_color }}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black"
                        >
                          {getInitials(currentOwner.name)}
                        </div>
                        <span className="text-xs font-extrabold text-[var(--m3-on-surface)]">
                          {currentOwner.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-amber-500 italic">Noch unbesetzt</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 2: Meilenstein-Saal */}
      {activeSubTab === 'milestones' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ACHIEVEMENTS_DATA.filter(b => b.section === 'milestones').map((badge) => {
              const unlocked = isUnlocked(badge);
              const isFavorite = userShowroom.includes(badge.id);
              const isTitleIcon = activeBadgeId === badge.id;

              return (
                <motion.div
                  key={badge.id}
                  whileHover={{ y: -3 }}
                  className={`bg-[var(--m3-surface-container)] border rounded-[28px] p-5 shadow-sm flex flex-col justify-between transition-all relative overflow-hidden ${
                    unlocked 
                      ? 'border-[var(--m3-outline-variant)] hover:border-[var(--m3-primary)]/50' 
                      : 'border-[var(--m3-outline-variant)]/40 opacity-70 bg-[var(--m3-surface)]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${
                        unlocked 
                          ? 'bg-gradient-to-br from-amber-400 to-indigo-600 text-white' 
                          : 'bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface-variant)] grayscale'
                      }`}>
                        <span>{badge.emoji}</span>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        {unlocked ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Freigeschaltet</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface-variant)] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            <span>Gesperrt</span>
                          </span>
                        )}
                        {badge.tier && (
                          <span className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--m3-on-surface-variant)] opacity-60">
                            {badge.tier}
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="text-base font-black text-[var(--m3-on-surface)] mb-1">
                      {badge.title}
                    </h4>
                    <p className="text-xs text-[var(--m3-on-surface-variant)] mb-4 leading-relaxed line-clamp-2">
                      {badge.description}
                    </p>
                  </div>

                  {/* Actions for unlocked badges */}
                  {unlocked && activeUser && (
                    <div className="pt-3 border-t border-[var(--m3-outline-variant)]/40 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleToggleShowroom(e, badge.id)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                          isFavorite 
                            ? 'bg-amber-500 text-white shadow-xs' 
                            : 'bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface-variant)] hover:text-[var(--m3-on-surface)]'
                        }`}
                        title="Zu deinen 5 Lieblings-Abzeichen im Profil hinzufügen"
                      >
                        <Star className={`w-3 h-3 ${isFavorite ? 'fill-current' : ''}`} />
                        <span>{isFavorite ? 'Im Showroom' : 'Showroom'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleSetActiveBadge(e, badge.id)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                          isTitleIcon 
                            ? 'bg-[var(--m3-primary)] text-[var(--m3-on-primary)] shadow-xs' 
                            : 'bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface-variant)] hover:text-[var(--m3-on-surface)]'
                        }`}
                        title="Als aktives Badge-Icon direkt neben deinem Namen auf dem Profil anzeigen"
                      >
                        <BadgeCheck className="w-3 h-3" />
                        <span>{isTitleIcon ? 'Aktiver Titel' : 'Als Titel'}</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 3: Der Dunkle Raum */}
      {activeSubTab === 'secret' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 text-white text-center max-w-2xl mx-auto shadow-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black uppercase tracking-wider mb-3">
              <Moon className="w-4 h-4 text-indigo-400" />
              <span>Geheime Abzeichen</span>
            </div>
            <h3 className="text-lg font-black tracking-tight mb-2">
              Der Dunkle Raum 🕵️‍♂️
            </h3>
            <p className="text-xs text-indigo-200/80 leading-relaxed">
              Hier schlummern mysteriöse Abzeichen. Man sieht nur selbst, was man durch clevere Aktionen im Haushalt bereits entdeckt hat!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ACHIEVEMENTS_DATA.filter(b => b.section === 'secret').map((badge) => {
              const unlocked = isUnlocked(badge);

              return (
                <div
                  key={badge.id}
                  className={`border rounded-[28px] p-5 shadow-sm flex flex-col justify-between transition-all relative overflow-hidden ${
                    unlocked 
                      ? 'bg-[var(--m3-surface-container)] border-amber-500/40 ring-1 ring-amber-500/20' 
                      : 'bg-slate-900/90 border-slate-800 text-slate-400'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${
                        unlocked 
                          ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white' 
                          : 'bg-slate-800 text-slate-600'
                      }`}>
                        <span>{unlocked ? badge.emoji : '🔒'}</span>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        unlocked ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {unlocked ? 'Entdeckt ✨' : 'Geheim'}
                      </span>
                    </div>

                    <h4 className={`text-base font-black mb-1 ${unlocked ? 'text-[var(--m3-on-surface)]' : 'text-slate-200'}`}>
                      {unlocked ? badge.title : '??? (Geheimes Abzeichen)'}
                    </h4>
                    <p className={`text-xs leading-relaxed mb-4 ${unlocked ? 'text-[var(--m3-on-surface-variant)]' : 'text-slate-400 italic'}`}>
                      {unlocked ? badge.description : 'Führe heimliche oder besondere Aktionen im Haushalt aus, um dieses Rätsel zu lüften...'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail Modal if opened locally */}
      {selectedBadgeForDetail && (
        <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl">{selectedBadgeForDetail.emoji}</span>
              <button
                onClick={() => setSelectedBadgeForDetail(null)}
                className="w-8 h-8 rounded-full bg-[var(--m3-surface-container-high)] flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <h3 className="text-xl font-black text-[var(--m3-on-surface)]">{selectedBadgeForDetail.title}</h3>
            <p className="text-xs text-[var(--m3-on-surface-variant)]">{selectedBadgeForDetail.description}</p>
          </div>
        </div>
      )}
    </div>
  );
};
