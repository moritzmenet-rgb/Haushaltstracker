import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Check, Lock, ShoppingBag, Coins, Palette, Shirt, Scissors, Glasses } from 'lucide-react';
import { CAT_SHOP_ITEMS, CAT_FUR_COLORS, CatShopItem } from '../../data/catItemsData';
import { PetAppearance, PetState } from '../../types';
import { haptic } from '../../utils/haptics';
import { rewardAudio } from '../../utils/rewardAudio';

interface CatBoutiqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: PetState;
  userPoints: number;
  onBuyItem: (item: CatShopItem) => Promise<boolean>;
  onEquipItem: (category: 'clothing' | 'hair' | 'fur' | 'accessory', itemId: string | null) => void;
}

export const CatBoutiqueModal: React.FC<CatBoutiqueModalProps> = ({
  isOpen,
  onClose,
  pet,
  userPoints,
  onBuyItem,
  onEquipItem
}) => {
  const [activeCategory, setActiveCategory] = useState<'clothing' | 'hair' | 'fur' | 'accessory'>('clothing');
  const [purchaseToast, setPurchaseToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const unlocked = new Set(pet.unlockedItems || []);

  const handleBuy = async (item: CatShopItem) => {
    haptic.medium();
    const success = await onBuyItem(item);
    if (success) {
      rewardAudio.playCatMeow();
      setPurchaseToast(`"${item.name}" freigeschaltet! 🎉 (Test-Modus: 0 Chips)`);
      setTimeout(() => setPurchaseToast(null), 2500);
    }
  };

  const handleSelectEquip = (category: 'clothing' | 'hair' | 'fur' | 'accessory', itemId: string | null) => {
    haptic.light();
    rewardAudio.playCatChirp();
    onEquipItem(category, itemId);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md"
      />

      {/* Boutique Modal Box */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 15 }}
        className="relative w-full max-w-2xl bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)] rounded-3xl shadow-2xl p-6 sm:p-8 my-auto overflow-hidden z-10 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--m3-outline-variant)]/60">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center text-2xl shadow-xs">
              🛍️
            </div>
            <div>
              <h2 className="text-xl font-black text-[var(--m3-on-surface)] tracking-tight flex items-center gap-2">
                <span>Katzen-Boutique</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30">
                  Styling & Mode
                </span>
              </h2>
              <p className="text-xs text-[var(--m3-on-surface-variant)]">
                Kleidung, Schnitte und Farben für {pet.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Chips balance badge with test mode indication */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-black text-xs shadow-2xs">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Test-Modus: 0 Chips (Kostenlos)</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-[var(--m3-surface-container-high)] hover:bg-[var(--m3-surface-container-highest)] text-[var(--m3-on-surface-variant)] flex items-center justify-center transition cursor-pointer border border-[var(--m3-outline-variant)]"
              aria-label="Schließen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Purchase Toast banner if active */}
        <AnimatePresence>
          {purchaseToast && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-3 px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>{purchaseToast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 mt-4 pb-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => { haptic.light(); setActiveCategory('clothing'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeCategory === 'clothing'
                ? 'bg-[var(--m3-primary)] text-white shadow-xs'
                : 'bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-highest)]'
            }`}
          >
            <Shirt className="w-3.5 h-3.5" />
            <span>Kleidung</span>
          </button>

          <button
            type="button"
            onClick={() => { haptic.light(); setActiveCategory('hair'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeCategory === 'hair'
                ? 'bg-[var(--m3-primary)] text-white shadow-xs'
                : 'bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-highest)]'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Frisuren & Hüte</span>
          </button>

          <button
            type="button"
            onClick={() => { haptic.light(); setActiveCategory('accessory'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeCategory === 'accessory'
                ? 'bg-[var(--m3-primary)] text-white shadow-xs'
                : 'bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-highest)]'
            }`}
          >
            <Glasses className="w-3.5 h-3.5" />
            <span>Accessoires</span>
          </button>

          <button
            type="button"
            onClick={() => { haptic.light(); setActiveCategory('fur'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeCategory === 'fur'
                ? 'bg-[var(--m3-primary)] text-white shadow-xs'
                : 'bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-highest)]'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Fellfarben</span>
          </button>
        </div>

        {/* Catalog Items Grid */}
        <div className="flex-1 overflow-y-auto pr-1 mt-3 space-y-3">
          {/* A. FUR COLORS TAB */}
          {activeCategory === 'fur' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(CAT_FUR_COLORS).map(([colorKey, colorDef]) => {
                const isSelected = pet.appearance.furColor === colorKey;
                return (
                  <div
                    key={colorKey}
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 shadow-xs'
                        : 'border-[var(--m3-outline-variant)]/60 bg-[var(--m3-surface-container-low)] hover:bg-[var(--m3-surface-container-high)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full border-2 border-white/50 shadow-sm flex items-center justify-center"
                        style={{ backgroundColor: colorDef.primary }}
                      >
                        <span className="text-base">🐱</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-[var(--m3-on-surface)]">
                          {colorDef.label}
                        </h4>
                        <p className="text-[11px] text-[var(--m3-on-surface-variant)]">
                          Natürliches Samtfell
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectEquip('fur', colorKey)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'bg-[var(--m3-surface-container-highest)] hover:bg-amber-500/20 text-[var(--m3-on-surface)]'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Aktiv</span>
                        </>
                      ) : (
                        <span>Wählen</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* B. CLOTHING / HAIR / ACCESSORIES TABS */}
          {activeCategory !== 'fur' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Optional "None / Ausziehen" card for clothing, hair or accessory */}
              <div className="p-3.5 rounded-2xl border border-[var(--m3-outline-variant)]/60 bg-[var(--m3-surface-container-low)] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-500/20 text-slate-500 flex items-center justify-center text-lg">
                    ✨
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[var(--m3-on-surface)]">
                      Nichts anlegen
                    </h4>
                    <p className="text-[10px] text-[var(--m3-on-surface-variant)]">
                      Natürlicher Katzen-Look
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectEquip(activeCategory, activeCategory === 'hair' ? 'classic' : null)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    (activeCategory === 'clothing' && pet.appearance.clothingId === null) ||
                    (activeCategory === 'hair' && pet.appearance.hairStyle === 'classic') ||
                    (activeCategory === 'accessory' && pet.appearance.accessoryId === null)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[var(--m3-surface-container-highest)] text-[var(--m3-on-surface)] hover:bg-[var(--m3-surface-container-highest)]/80'
                  }`}
                >
                  {(activeCategory === 'clothing' && pet.appearance.clothingId === null) ||
                   (activeCategory === 'hair' && pet.appearance.hairStyle === 'classic') ||
                   (activeCategory === 'accessory' && pet.appearance.accessoryId === null)
                    ? 'Aktiv'
                    : 'Ablegen'}
                </button>
              </div>

              {CAT_SHOP_ITEMS.filter(item => item.category === activeCategory).map(item => {
                const isOwned = unlocked.has(item.id);
                const isEquipped = 
                  (activeCategory === 'clothing' && pet.appearance.clothingId === item.id) ||
                  (activeCategory === 'hair' && pet.appearance.hairStyle === item.id) ||
                  (activeCategory === 'accessory' && pet.appearance.accessoryId === item.id);
                const isLockedByLevel = pet.level < item.requiredLevel;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                      isEquipped
                        ? 'border-amber-500 bg-amber-500/10 shadow-xs'
                        : isOwned
                        ? 'border-[var(--m3-outline-variant)]/60 bg-[var(--m3-surface-container-low)]'
                        : 'border-[var(--m3-outline-variant)]/40 bg-[var(--m3-surface-container-low)]/60 opacity-90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/25 text-2xl flex items-center justify-center shadow-2xs">
                          {item.emoji}
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-black text-[var(--m3-on-surface)] leading-tight">
                            {item.name}
                          </h4>
                          <p className="text-[10px] text-[var(--m3-on-surface-variant)] line-clamp-1 mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {isLockedByLevel && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-[10px] whitespace-nowrap">
                          <Lock className="w-3 h-3" />
                          <span>Lv. {item.requiredLevel}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--m3-outline-variant)]/40">
                      <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <span className="line-through text-amber-700/50 dark:text-amber-300/40 text-[10px]">{item.price} Chips</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black">Gratis ✨</span>
                      </div>

                      {isOwned ? (
                        <button
                          type="button"
                          onClick={() => handleSelectEquip(activeCategory, isEquipped ? null : item.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                            isEquipped
                              ? 'bg-amber-500 text-white shadow-2xs'
                              : 'bg-[var(--m3-surface-container-highest)] hover:bg-amber-500/20 text-[var(--m3-on-surface)]'
                          }`}
                        >
                          {isEquipped ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Angelegt</span>
                            </>
                          ) : (
                            <span>Anziehen</span>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleBuy(item)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Freischalten</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[var(--m3-outline-variant)]/60 flex items-center justify-between text-xs text-[var(--m3-on-surface-variant)]">
          <span>Gekaufte Kleidung bleibt dauerhaft in deiner Garderobe.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[var(--m3-primary)] hover:bg-[var(--m3-primary)]/90 text-white font-bold transition cursor-pointer"
          >
            Fertig
          </button>
        </div>
      </motion.div>
    </div>
  );
};
