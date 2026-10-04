import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Utensils, 
  Sparkles, 
  Droplets, 
  ShoppingBag, 
  Edit3, 
  Check, 
  Coins, 
  Users, 
  Award, 
  Info,
  ArrowRight,
  Smile,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CatAvatar } from './CatAvatar';
import { CatBoutiqueModal } from './CatBoutiqueModal';
import { createInitialPet, computeDecayedPetState, CatShopItem } from '../../data/catItemsData';
import { PetState } from '../../types';
import { haptic } from '../../utils/haptics';
import { rewardAudio } from '../../utils/rewardAudio';

export const CatRoomView: React.FC = () => {
  const { data, activeUser, updateMemberPet, feedOtherMemberPet } = useApp();

  // If visiting another member's cat
  const [visitedMemberId, setVisitedMemberId] = useState<string | null>(null);

  // Name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  // Boutique modal state
  const [isBoutiqueOpen, setIsBoutiqueOpen] = useState(false);

  // Feedback toast
  const [roomToast, setRoomToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setRoomToast(msg);
    setTimeout(() => setRoomToast(null), 3200);
  };

  // Determine current viewed member
  const currentMember = useMemo(() => {
    if (visitedMemberId && data.members[visitedMemberId]) {
      return data.members[visitedMemberId];
    }
    return activeUser;
  }, [visitedMemberId, data.members, activeUser]);

  const isOwnCat = Boolean(activeUser && currentMember && activeUser.id === currentMember.id);

  // Retrieve and compute pet state with time-decay
  const pet: PetState = useMemo(() => {
    if (!currentMember) {
      return createInitialPet('default', 'Familie');
    }
    if (!currentMember.pet) {
      return createInitialPet(currentMember.id, currentMember.name);
    }
    return computeDecayedPetState(currentMember.pet);
  }, [currentMember]);

  // Family members list for visitor carousel
  const familyList = useMemo(() => {
    return Object.values(data.members).sort((a, b) => a.name.localeCompare(b.name));
  }, [data.members]);

  const userChips = activeUser?.total_points || 0;

  // Action: Pet the cat
  const handlePetCat = () => {
    haptic.light();
    // Alternates between soft purr, chirp and sweet meow
    const rand = Math.random();
    if (rand < 0.45) {
      rewardAudio.playCatChirp();
    } else if (rand < 0.8) {
      rewardAudio.playCatPurr();
    } else {
      rewardAudio.playCatMeow();
    }

    if (isOwnCat && activeUser) {
      const nextHappy = Math.min(100, pet.happiness + 8);
      const nextXp = pet.xp + 6;
      const nextLevel = nextXp >= pet.level * 100 ? pet.level + 1 : pet.level;
      updateMemberPet(activeUser.id, {
        ...pet,
        happiness: nextHappy,
        xp: nextXp,
        level: nextLevel,
        lastPetTimestamp: new Date().toISOString()
      }, 0);
      showToast(`${pet.name} schnurrt überglücklich! 💕`);
    } else {
      showToast(`${pet.name} schnurrt beim Kraulen! ✨`);
    }
  };

  // Action: Feed the cat (0 Chips in test mode!)
  const handleFeed = async () => {
    if (!activeUser) return;
    const feedCost = 0; // 0 Chips in test mode!

    haptic.medium();
    rewardAudio.playCatCrunch();

    if (isOwnCat) {
      // Feed own cat
      const nextHunger = Math.min(100, pet.hunger + 35);
      const nextHappy = Math.min(100, pet.happiness + 15);
      const nextXp = pet.xp + 15;
      const nextLevel = nextXp >= pet.level * 100 ? pet.level + 1 : pet.level;

      await updateMemberPet(activeUser.id, {
        ...pet,
        hunger: nextHunger,
        happiness: nextHappy,
        xp: nextXp,
        level: nextLevel,
        lastFedTimestamp: new Date().toISOString()
      }, feedCost);

      showToast(`Mampf! ${pet.name} ist satt und glücklich! 🐟 (0 Chips)`);
    } else if (currentMember) {
      // Feed other member's cat
      await feedOtherMemberPet(currentMember.id, activeUser.id, activeUser.name, feedCost);
      showToast(`Du hast ${currentMember.name}s Katze gefüttert! ❤️ (0 Chips)`);
    }
  };

  // Action: Wash the cat
  const handleWash = async () => {
    if (!isOwnCat || !activeUser) return;

    haptic.medium();
    rewardAudio.playCatSplash();

    const nextHappy = Math.min(100, pet.happiness + 20);
    const nextXp = pet.xp + 20;
    const nextLevel = nextXp >= pet.level * 100 ? pet.level + 1 : pet.level;

    await updateMemberPet(activeUser.id, {
      ...pet,
      hygiene: 100,
      happiness: nextHappy,
      xp: nextXp,
      level: nextLevel,
      lastWashedTimestamp: new Date().toISOString()
    }, 0);

    showToast(`Blubberblasen! ${pet.name} ist wieder blitzblank und duftet frisch! 🧼🫧`);
  };

  // Action: Rename cat
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnCat || !activeUser || !tempName.trim()) return;

    haptic.light();
    await updateMemberPet(activeUser.id, {
      ...pet,
      name: tempName.trim()
    });
    setIsEditingName(false);
    showToast(`Name geändert in "${tempName.trim()}"! ✨`);
  };

  // Action: Buy shop item
  const handleBuyShopItem = async (item: CatShopItem): Promise<boolean> => {
    if (!isOwnCat || !activeUser) return false;
    if (userChips < item.price) return false;

    const nextUnlocked = Array.from(new Set([...(pet.unlockedItems || []), item.id]));
    const nextAppearance = { ...pet.appearance };
    if (item.category === 'clothing') nextAppearance.clothingId = item.id;
    if (item.category === 'hair') nextAppearance.hairStyle = item.id;
    if (item.category === 'accessory') nextAppearance.accessoryId = item.id;

    await updateMemberPet(activeUser.id, {
      ...pet,
      unlockedItems: nextUnlocked,
      appearance: nextAppearance
    }, item.price);

    return true;
  };

  // Action: Equip item
  const handleEquipItem = async (category: 'clothing' | 'hair' | 'fur' | 'accessory', itemId: string | null) => {
    if (!isOwnCat || !activeUser) return;

    const nextAppearance = { ...pet.appearance };
    if (category === 'clothing') nextAppearance.clothingId = itemId;
    if (category === 'hair') nextAppearance.hairStyle = itemId || 'classic';
    if (category === 'fur' && itemId) nextAppearance.furColor = itemId;
    if (category === 'accessory') nextAppearance.accessoryId = itemId;

    await updateMemberPet(activeUser.id, {
      ...pet,
      appearance: nextAppearance
    });
  };

  const isSad = pet.hunger < 35 || pet.hygiene < 35 || pet.happiness < 35;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Banner */}
      <AnimatePresence>
        {roomToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[120] px-5 py-2.5 rounded-2xl bg-amber-500 text-white font-black text-sm shadow-xl flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>{roomToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header & Family Visitors Carousel */}
      <div className="bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)] rounded-3xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-[var(--m3-outline-variant)]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shadow-xs">
              🐱
            </div>
            <div>
              <h2 className="text-base font-black text-[var(--m3-on-surface)] tracking-tight">
                Familien-Katzenzimmer
              </h2>
              <p className="text-xs text-[var(--m3-on-surface-variant)]">
                Besuche die Katzen der anderen und hilf beim Füttern!
              </p>
            </div>
          </div>

          {/* Active User Chips Display with Test Mode */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-black text-xs shadow-2xs">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Test-Modus aktiv: 0 Chips (Kostenlos)</span>
            </div>
          </div>
        </div>

        {/* Member Carousel Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {familyList.map(member => {
            const isSelected = currentMember?.id === member.id;
            const isSelf = activeUser?.id === member.id;
            const memberPet = member.pet ? computeDecayedPetState(member.pet) : null;
            const memberPetHungry = memberPet ? memberPet.hunger < 35 : false;

            return (
              <button
                key={member.id}
                type="button"
                onClick={() => {
                  haptic.light();
                  setVisitedMemberId(isSelf ? null : member.id);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                    : 'bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface)] border-[var(--m3-outline-variant)]/60 hover:bg-[var(--m3-surface-container-highest)]'
                }`}
              >
                <div 
                  className="w-5 h-5 rounded-full border border-white/40 flex items-center justify-center text-[10px] font-black text-white"
                  style={{ backgroundColor: member.avatar_color }}
                >
                  {member.name.charAt(0)}
                </div>

                <span>{isSelf ? 'Mein Zimmer' : `${member.name}s Zimmer`}</span>

                {memberPetHungry && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="Katze hat Hunger!" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Room & Cat Stage */}
      <div className="relative bg-gradient-to-b from-amber-500/10 via-[var(--m3-surface-container)] to-[var(--m3-surface-container-high)] border border-[var(--m3-outline-variant)] rounded-[36px] p-6 sm:p-10 shadow-lg text-center overflow-hidden flex flex-col items-center">
        {/* Visitor Banner if visiting someone else */}
        {!isOwnCat && currentMember && (
          <div className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
            <Users className="w-3.5 h-3.5" />
            <span>Du bist zu Besuch bei <strong>{currentMember.name}</strong></span>
          </div>
        )}

        {/* Pet Name & Edit Button */}
        <div className="flex items-center justify-center gap-2 mb-2">
          {isEditingName && isOwnCat ? (
            <form onSubmit={handleSaveName} className="flex items-center gap-2">
              <input
                type="text"
                value={tempName}
                onChange={e => setTempName(e.target.value)}
                maxLength={28}
                autoFocus
                className="px-3 py-1.5 rounded-xl bg-[var(--m3-surface)] border border-[var(--m3-primary)] text-sm font-black text-[var(--m3-on-surface)] text-center focus:outline-hidden"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition cursor-pointer shadow-xs"
                title="Speichern"
              >
                <Check className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--m3-on-surface)] tracking-tight">
                {pet.name}
              </h1>
              {isOwnCat && (
                <button
                  type="button"
                  onClick={() => {
                    setTempName(pet.name);
                    setIsEditingName(true);
                  }}
                  className="p-1.5 rounded-lg bg-[var(--m3-surface-container-highest)] hover:bg-amber-500/20 text-[var(--m3-on-surface-variant)] transition cursor-pointer"
                  title="Name bearbeiten"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Level & Mood Tag */}
        <div className="flex items-center gap-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-black shadow-2xs">
            <Award className="w-3.5 h-3.5" />
            <span>Katzen-Level {pet.level}</span>
          </div>

          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
            isSad
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
          }`}>
            <span>{isSad ? '😿 Zerzaust & Traurig' : '😻 Schnurrend & Glücklich'}</span>
          </div>
        </div>

        {/* The Animated Cat Avatar on its Rug */}
        <div className="relative my-2 sm:my-4 flex items-center justify-center">
          {/* Cosy Clay Rug beneath cat */}
          <div className="absolute -bottom-4 w-60 sm:w-72 h-14 bg-amber-900/15 dark:bg-amber-100/10 rounded-full blur-xs pointer-events-none transform -rotate-1" />
          <div className="absolute -bottom-2 w-52 sm:w-64 h-10 border-2 border-dashed border-amber-600/30 rounded-full pointer-events-none" />

          {/* The Cat */}
          <CatAvatar
            appearance={pet.appearance}
            hunger={pet.hunger}
            hygiene={pet.hygiene}
            happiness={pet.happiness}
            size="lg"
            onPet={handlePetCat}
          />
        </div>

        <p className="text-xs text-[var(--m3-on-surface-variant)] opacity-70 mt-2">
          Tippe auf die Katze, um sie zu kraulen und zum Schnurren zu bringen! ✨
        </p>

        {/* 3. Status Need Meters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg mt-6">
          {/* Hunger Meter */}
          <div className="bg-[var(--m3-surface-container)]/80 border border-[var(--m3-outline-variant)]/60 rounded-2xl p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="flex items-center gap-1.5 text-[var(--m3-on-surface)]">
                <span>🥣</span>
                <span>Hunger</span>
              </span>
              <span className={pet.hunger < 35 ? 'text-rose-500 font-black' : 'text-emerald-600 dark:text-emerald-400'}>
                {pet.hunger}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-[var(--m3-surface-container-highest)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pet.hunger}%` }}
                className={`h-full rounded-full transition-all ${
                  pet.hunger < 35 ? 'bg-rose-500' : pet.hunger < 65 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
            </div>
          </div>

          {/* Hygiene Meter */}
          <div className="bg-[var(--m3-surface-container)]/80 border border-[var(--m3-outline-variant)]/60 rounded-2xl p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="flex items-center gap-1.5 text-[var(--m3-on-surface)]">
                <span>🧼</span>
                <span>Sauberkeit</span>
              </span>
              <span className={pet.hygiene < 35 ? 'text-rose-500 font-black' : 'text-emerald-600 dark:text-emerald-400'}>
                {pet.hygiene}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-[var(--m3-surface-container-highest)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pet.hygiene}%` }}
                className={`h-full rounded-full transition-all ${
                  pet.hygiene < 35 ? 'bg-amber-700' : pet.hygiene < 65 ? 'bg-amber-500' : 'bg-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Happiness Meter */}
          <div className="bg-[var(--m3-surface-container)]/80 border border-[var(--m3-outline-variant)]/60 rounded-2xl p-3 text-left">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="flex items-center gap-1.5 text-[var(--m3-on-surface)]">
                <span>💖</span>
                <span>Laune</span>
              </span>
              <span className={pet.happiness < 35 ? 'text-rose-500 font-black' : 'text-pink-600 dark:text-pink-400'}>
                {pet.happiness}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-[var(--m3-surface-container-highest)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pet.happiness}%` }}
                className={`h-full rounded-full transition-all ${
                  pet.happiness < 35 ? 'bg-rose-500' : 'bg-pink-500'
                }`}
              />
            </div>
          </div>
        </div>

        {/* 4. Action Buttons Grid */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          {/* Feed Button (Works for own cat OR visitor cat!) */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleFeed}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-md shadow-amber-500/25 transition cursor-pointer"
          >
            <Utensils className="w-4 h-4" />
            <span>{isOwnCat ? 'Füttern' : `Katze von ${currentMember?.name} füttern`} (Gratis ✨)</span>
          </motion.button>

          {/* Wash Button (Own cat only) */}
          {isOwnCat && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleWash}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-md shadow-blue-600/25 transition cursor-pointer"
            >
              <Droplets className="w-4 h-4" />
              <span>Waschen & Kämmen</span>
            </motion.button>
          )}

          {/* Boutique Button (Own cat only) */}
          {isOwnCat && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                haptic.medium();
                setIsBoutiqueOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[var(--m3-primary)] hover:bg-[var(--m3-primary)]/90 text-white font-black text-sm shadow-md shadow-[var(--m3-primary)]/25 transition cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Boutique & Styling</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* 5. Visitor History & Good Deeds Card */}
      {pet.feedHistory && pet.feedHistory.length > 0 && (
        <div className="bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)] rounded-3xl p-5 shadow-xs">
          <h3 className="text-sm font-black text-[var(--m3-on-surface)] flex items-center gap-2 mb-3">
            <span>💌</span>
            <span>Liebevolle Besucher & Futter-Spenden</span>
          </h3>

          <div className="space-y-2">
            {pet.feedHistory.slice(-5).reverse().map((event, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-2xl bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)]/40 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🐟</span>
                  <span className="text-[var(--m3-on-surface)]">
                    <strong>{event.fedByName}</strong> hat leckere Snacks vorbeigebracht!
                  </span>
                </div>
                <span className="text-[10px] text-[var(--m3-on-surface-variant)]">
                  {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Boutique Modal */}
      <CatBoutiqueModal
        isOpen={isBoutiqueOpen}
        onClose={() => setIsBoutiqueOpen(false)}
        pet={pet}
        userPoints={userChips}
        onBuyItem={handleBuyShopItem}
        onEquipItem={handleEquipItem}
      />
    </div>
  );
};
