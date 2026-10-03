import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Utensils, 
  Calendar, 
  Lightbulb, 
  BookOpen, 
  Search, 
  Filter, 
  Plus, 
  Check, 
  X, 
  ThumbsUp, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Clock, 
  Flame, 
  ShoppingCart, 
  Trash2, 
  Edit2, 
  CheckCircle2,
  ChefHat,
  ArrowRight,
  Dices
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PlannedMeal, RecipeItem, MenuWish } from '../../types';
import { ALL_RECIPES, RECIPE_CATEGORIES } from '../../data/recipesData';
import { haptic } from '../../utils/haptics';

interface MenuplannerViewProps {
  onNavigateToFishAndWish?: () => void;
  activeTab?: 'week' | 'ideas' | 'recipes';
  onSelectTab?: (tab: 'week' | 'ideas' | 'recipes') => void;
  openNewWishModal?: boolean;
  onResetNewWishModal?: () => void;
}

export const MenuplannerView: React.FC<MenuplannerViewProps> = ({
  onNavigateToFishAndWish,
  activeTab: controlledActiveTab,
  onSelectTab: controlledOnSelectTab,
  openNewWishModal,
  onResetNewWishModal
}) => {
  const { 
    activeUser, 
    data, 
    menuPlan, 
    menuWishes, 
    setDayMeal, 
    addMenuWish, 
    deleteMenuWish, 
    toggleWishUpvote, 
    transferIngredientsToPinnwand 
  } = useApp();

  const [internalActiveTab, setInternalActiveTab] = useState<'week' | 'ideas' | 'recipes'>('week');
  const activeTab = controlledActiveTab ?? internalActiveTab;
  const setActiveTab = (tab: 'week' | 'ideas' | 'recipes') => {
    if (controlledOnSelectTab) {
      controlledOnSelectTab(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Week offset state (0 = current week, -1 = last week, +1 = next week)
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Generate 7 days (Monday - Sunday) for the selected week
  const weekDays = useMemo(() => {
    const today = new Date();
    // Monday as day 1
    const currentDayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDayOfWeek + (weekOffset * 7));

    const days = [];
    const dayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    const shortDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const isToday = d.toDateString() === today.toDateString();
      days.push({
        dateKey,
        dayName: dayNames[i],
        shortDay: shortDays[i],
        formattedDate: `${d.getDate()}.${d.getMonth() + 1}.`,
        isToday
      });
    }
    return days;
  }, [weekOffset]);

  // Modal / Dialog for editing or assigning a meal
  const [editingMealModal, setEditingMealModal] = useState<{
    isOpen: boolean;
    dateKey: string;
    dayName: string;
    mealType: 'lunch' | 'dinner';
    existingMeal?: PlannedMeal | null;
  } | null>(null);

  const [manualTitle, setManualTitle] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [selectedRecipeForPlan, setSelectedRecipeForPlan] = useState<RecipeItem | null>(null);

  // Ideas Tab: New Wish Form state
  const [newWishTitle, setNewWishTitle] = useState('');
  const [newWishNotes, setNewWishNotes] = useState('');

  // Recipes Tab: Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEffort, setSelectedEffort] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [selectedTimeMax, setSelectedTimeMax] = useState<number>(0); // 0 = all, 20, 30, 45
  const [bakeFilter, setBakeFilter] = useState<'all' | 'with' | 'without'>('all');

  // Quick Plan Modal from Recipe Library or Ideas
  const [quickAssignModal, setQuickAssignModal] = useState<{
    isOpen: boolean;
    recipe?: RecipeItem;
    wishTitle?: string;
  } | null>(null);

  // Filtered Recipes (500+ items filtered client-side with high performance)
  const filteredRecipes = useMemo(() => {
    return ALL_RECIPES.filter(recipe => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = recipe.title.toLowerCase().includes(query);
        const matchesIng = recipe.ingredients.some(ing => ing.toLowerCase().includes(query));
        if (!matchesTitle && !matchesIng) return false;
      }
      // Category
      if (selectedCategory !== 'all' && recipe.category !== selectedCategory) {
        if (selectedCategory === 'schnell' && recipe.durationMinutes > 25) return false;
        else if (selectedCategory !== 'schnell') return false;
      }
      // Effort
      if (selectedEffort !== 'all' && recipe.effort !== selectedEffort) return false;
      // Duration
      if (selectedTimeMax > 0 && recipe.durationMinutes > selectedTimeMax) return false;
      // Baking
      if (bakeFilter === 'with' && !recipe.requiresBaking) return false;
      if (bakeFilter === 'without' && recipe.requiresBaking) return false;

      return true;
    });
  }, [searchQuery, selectedCategory, selectedEffort, selectedTimeMax, bakeFilter]);

  // Open modal to assign meal
  const handleOpenEditModal = (dateKey: string, dayName: string, mealType: 'lunch' | 'dinner') => {
    const existing = menuPlan[dateKey]?.[mealType] || null;
    setManualTitle(existing?.title || '');
    setManualNotes(existing?.notes || '');
    setSelectedRecipeForPlan(null);
    setEditingMealModal({
      isOpen: true,
      dateKey,
      dayName,
      mealType,
      existingMeal: existing
    });
  };

  // Save meal
  const handleSaveMeal = async () => {
    if (!editingMealModal) return;
    const titleToSave = selectedRecipeForPlan ? selectedRecipeForPlan.title : manualTitle.trim();
    if (!titleToSave) return;

    haptic.selection();
    const newMeal: PlannedMeal = {
      id: `meal_${Date.now()}`,
      title: titleToSave,
      recipeId: selectedRecipeForPlan?.id,
      notes: manualNotes.trim() || undefined,
      effort: selectedRecipeForPlan?.effort || 'medium',
      durationMinutes: selectedRecipeForPlan?.durationMinutes || 20,
      requiresBaking: selectedRecipeForPlan?.requiresBaking || false,
      cookUserId: activeUser?.id
    };

    await setDayMeal(editingMealModal.dateKey, editingMealModal.mealType, newMeal);
    setEditingMealModal(null);
    showToast(`✓ Für ${editingMealModal.dayName} (${editingMealModal.mealType === 'lunch' ? 'Mittag' : 'Abend'}) gespeichert!`);
  };

  // Remove meal
  const handleRemoveMeal = async (dateKey: string, mealType: 'lunch' | 'dinner') => {
    haptic.light();
    await setDayMeal(dateKey, mealType, null);
    showToast('Gericht entfernt');
  };

  // Create new Wish
  const handleCreateWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWishTitle.trim()) return;
    haptic.success();
    await addMenuWish(newWishTitle.trim(), newWishNotes.trim());
    setNewWishTitle('');
    setNewWishNotes('');
    showToast('Wunsch erfolgreich eingetragen! 💡');
  };

  // Quick plan a recipe onto a chosen day
  const handleQuickAssign = async (dateKey: string, mealType: 'lunch' | 'dinner') => {
    if (!quickAssignModal) return;
    haptic.success();
    const title = quickAssignModal.recipe ? quickAssignModal.recipe.title : (quickAssignModal.wishTitle || '');
    const newMeal: PlannedMeal = {
      id: `meal_${Date.now()}`,
      title,
      recipeId: quickAssignModal.recipe?.id,
      effort: quickAssignModal.recipe?.effort || 'medium',
      durationMinutes: quickAssignModal.recipe?.durationMinutes || 25,
      requiresBaking: quickAssignModal.recipe?.requiresBaking || false,
      cookUserId: activeUser?.id
    };

    await setDayMeal(dateKey, mealType, newMeal);
    setQuickAssignModal(null);
    showToast(`✓ "${title}" eingeplant!`);
    setActiveTab('week');
  };

  // Random Recipe Picker
  const handlePickRandom = () => {
    haptic.medium();
    const random = ALL_RECIPES[Math.floor(Math.random() * ALL_RECIPES.length)];
    if (random) {
      setQuickAssignModal({ isOpen: true, recipe: random });
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Feedback */}
      <AnimatePresence>
        {feedbackToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[var(--m3-primary)] text-white text-xs font-bold shadow-xl flex items-center gap-2 pointer-events-none"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{feedbackToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TAB 1: WOCHENPLAN (Montag bis Sonntag mit Mittags & Abends) */}
      {activeTab === 'week' && (
        <div className="space-y-4">
          {/* Week Navigation Header */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)]">
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setWeekOffset(prev => prev - 1);
              }}
              className="p-2 rounded-xl hover:bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface-variant)] transition cursor-pointer"
              title="Vorherige Woche"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              <span className="text-xs font-black uppercase tracking-wider text-[var(--m3-primary)] block">
                {weekOffset === 0 ? 'Aktuelle Woche' : weekOffset === 1 ? 'Nächste Woche' : weekOffset === -1 ? 'Letzte Woche' : `Woche (${weekOffset > 0 ? '+' : ''}${weekOffset})`}
              </span>
              <span className="text-sm font-extrabold text-[var(--m3-on-surface)]">
                {weekDays[0].formattedDate} – {weekDays[6].formattedDate}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {weekOffset !== 0 && (
                <button
                  type="button"
                  onClick={() => setWeekOffset(0)}
                  className="px-2.5 py-1 rounded-xl bg-[var(--m3-surface)] text-[var(--m3-on-surface)] border border-[var(--m3-outline-variant)] text-xs font-bold cursor-pointer hover:bg-[var(--m3-surface-container-high)]"
                >
                  Heute
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setWeekOffset(prev => prev + 1);
                }}
                className="p-2 rounded-xl hover:bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface-variant)] transition cursor-pointer"
                title="Nächste Woche"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 7-Days Grid */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDays.map(day => {
              const dayPlan = menuPlan[day.dateKey] || {};
              const lunch = dayPlan.lunch;
              const dinner = dayPlan.dinner;

              return (
                <div 
                  key={day.dateKey}
                  className={`flex flex-col rounded-3xl border p-3.5 transition-all shadow-xs ${
                    day.isToday
                      ? 'bg-[var(--m3-primary-container)]/25 border-[var(--m3-primary)] ring-2 ring-[var(--m3-primary)]/20'
                      : 'bg-[var(--m3-surface-container-low)] border-[var(--m3-outline-variant)]'
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[var(--m3-outline-variant)]/60">
                    <div>
                      <span className="text-xs font-black text-[var(--m3-on-surface)] block leading-tight">
                        {day.dayName}
                      </span>
                      <span className="text-[10px] text-[var(--m3-on-surface-variant)] font-bold">
                        {day.formattedDate}
                      </span>
                    </div>
                    {day.isToday && (
                      <span className="px-1.5 py-0.5 rounded-md bg-[var(--m3-primary)] text-white text-[9px] font-black uppercase tracking-wider">
                        Heute
                      </span>
                    )}
                  </div>

                  {/* Meals: Lunch and Dinner */}
                  <div className="space-y-2.5 flex-1 flex flex-col justify-between">
                    {/* 1. MITTAGESSEN */}
                    <div className="rounded-2xl p-2.5 bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)]/70 relative group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <span>☀️</span>
                          <span>Mittag</span>
                        </span>
                        {lunch && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMeal(day.dateKey, 'lunch')}
                            className="text-[var(--m3-outline)] hover:text-rose-500 transition opacity-0 group-hover:opacity-100 p-0.5"
                            title="Löschen"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {lunch ? (
                        <div 
                          onClick={() => handleOpenEditModal(day.dateKey, day.dayName, 'lunch')}
                          className="cursor-pointer hover:opacity-85 transition"
                        >
                          <p className="text-xs font-extrabold text-[var(--m3-on-surface)] line-clamp-2 leading-snug">
                            {lunch.title}
                          </p>
                          {lunch.notes && (
                            <p className="text-[10px] text-[var(--m3-on-surface-variant)] italic truncate mt-0.5">
                              {lunch.notes}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1.5 text-[9px] text-[var(--m3-on-surface-variant)] font-semibold">
                            {lunch.durationMinutes && (
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {lunch.durationMinutes}m
                              </span>
                            )}
                            {lunch.requiresBaking && <span>• 🥧 Ofen</span>}
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(day.dateKey, day.dayName, 'lunch')}
                          className="w-full py-2.5 flex flex-col items-center justify-center text-[var(--m3-on-surface-variant)] hover:text-[var(--m3-primary)] hover:bg-[var(--m3-surface-container)] rounded-xl border border-dashed border-[var(--m3-outline-variant)] text-[11px] font-bold transition cursor-pointer gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Eintragen</span>
                        </button>
                      )}
                    </div>

                    {/* 2. ABENDESSEN */}
                    <div className="rounded-2xl p-2.5 bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)]/70 relative group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          <span>🌙</span>
                          <span>Abend</span>
                        </span>
                        {dinner && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMeal(day.dateKey, 'dinner')}
                            className="text-[var(--m3-outline)] hover:text-rose-500 transition opacity-0 group-hover:opacity-100 p-0.5"
                            title="Löschen"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {dinner ? (
                        <div 
                          onClick={() => handleOpenEditModal(day.dateKey, day.dayName, 'dinner')}
                          className="cursor-pointer hover:opacity-85 transition"
                        >
                          <p className="text-xs font-extrabold text-[var(--m3-on-surface)] line-clamp-2 leading-snug">
                            {dinner.title}
                          </p>
                          {dinner.notes && (
                            <p className="text-[10px] text-[var(--m3-on-surface-variant)] italic truncate mt-0.5">
                              {dinner.notes}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1.5 text-[9px] text-[var(--m3-on-surface-variant)] font-semibold">
                            {dinner.durationMinutes && (
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {dinner.durationMinutes}m
                              </span>
                            )}
                            {dinner.requiresBaking && <span>• 🥧 Ofen</span>}
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(day.dateKey, day.dayName, 'dinner')}
                          className="w-full py-2.5 flex flex-col items-center justify-center text-[var(--m3-on-surface-variant)] hover:text-[var(--m3-primary)] hover:bg-[var(--m3-surface-container)] rounded-xl border border-dashed border-[var(--m3-outline-variant)] text-[11px] font-bold transition cursor-pointer gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Eintragen</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Action Bar */}
          <div className="p-4 rounded-3xl bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[var(--m3-on-surface-variant)]">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Tipp: Klicke auf ein beliebiges Feld, um Menüs aus den 500+ Rezepten oder Wünschen zu wählen.</span>
            </div>

            <button
              type="button"
              onClick={handlePickRandom}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-xs transition cursor-pointer"
            >
              <Dices className="w-4 h-4" />
              <span>Zufälliges Menü vorschlagen</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: IDEEN & WÜNSCHE */}
      {activeTab === 'ideas' && (
        <div className="space-y-6">
          {/* Wish Creation Form */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[var(--m3-surface-container)] border border-amber-500/30 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Lightbulb className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-black text-[var(--m3-on-surface)]">
                  Was hättest du gerne wieder mal?
                </h2>
                <p className="text-xs text-[var(--m3-on-surface-variant)]">
                  Schreibe deine Lieblingsgerichte auf die Wunschliste. Alle Familienmitglieder können abstimmen!
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateWish} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    placeholder="z. B. Selbstgemachte Pizza, Lasagne, Thai-Curry..."
                    value={newWishTitle}
                    onChange={(e) => setNewWishTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-sm font-bold text-[var(--m3-on-surface)] placeholder-[var(--m3-outline)] focus:ring-2 focus:ring-amber-500 shadow-xs"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Notiz / Wunsch (optional)"
                    value={newWishNotes}
                    onChange={(e) => setNewWishNotes(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-sm font-bold text-[var(--m3-on-surface)] placeholder-[var(--m3-outline)] focus:ring-2 focus:ring-amber-500 shadow-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Wunsch eintragen</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of Wishes */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] px-1">
              Aktuelle Wünsche der Familie ({menuWishes.length})
            </h3>

            {menuWishes.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)]">
                <Lightbulb className="w-8 h-8 text-amber-500/40 mx-auto mb-2" />
                <p className="text-sm font-bold text-[var(--m3-on-surface)]">
                  Noch keine Wünsche eingetragen
                </p>
                <p className="text-xs text-[var(--m3-on-surface-variant)] mt-1">
                  Trage oben dein Lieblingsgericht ein, das du bald wieder essen möchtest!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {menuWishes.map(wish => {
                  const hasUpvoted = activeUser ? wish.upvotes.includes(activeUser.id) : false;

                  return (
                    <motion.div
                      key={wish.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-3xl bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)] flex flex-col justify-between shadow-xs hover:border-amber-500/40 transition"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-black text-[var(--m3-on-surface)] leading-snug">
                            {wish.title}
                          </h4>
                          <button
                            type="button"
                            onClick={() => deleteMenuWish(wish.id)}
                            className="text-[var(--m3-outline)] hover:text-rose-500 p-1 transition"
                            title="Löschen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {wish.notes && (
                          <p className="text-xs text-[var(--m3-on-surface-variant)] italic mt-1">
                            "{wish.notes}"
                          </p>
                        )}

                        <div className="text-[10px] text-[var(--m3-on-surface-variant)] font-semibold mt-2">
                          Gewünscht von <strong>{wish.requestedByName}</strong>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="pt-3 mt-3 border-t border-[var(--m3-outline-variant)]/60 flex items-center justify-between gap-2">
                        {/* Upvote Button */}
                        <button
                          type="button"
                          onClick={() => {
                            haptic.selection();
                            toggleWishUpvote(wish.id);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                            hasUpvoted
                              ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                              : 'bg-[var(--m3-surface)] hover:bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface)] border-[var(--m3-outline-variant)]'
                          }`}
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'fill-current' : ''}`} />
                          <span>{wish.upvotes.length}</span>
                        </button>

                        {/* Plan in week button */}
                        <button
                          type="button"
                          onClick={() => setQuickAssignModal({ isOpen: true, wishTitle: wish.title })}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--m3-primary)] hover:bg-[var(--m3-primary)]/90 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>Einplanen</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: REZEPT-BIBLIOTHEK MIT FILTERN */}
      {activeTab === 'recipes' && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)] space-y-3.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--m3-outline)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="In Rezepten & Zutaten suchen (z. B. Pasta, Lachs, Tomaten, Curry)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-xs sm:text-sm font-bold text-[var(--m3-on-surface)] placeholder-[var(--m3-outline)] focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--m3-outline)] hover:text-[var(--m3-on-surface)]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Rows */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {RECIPE_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setSelectedCategory(cat.id);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition cursor-pointer border ${
                      selectedCategory === cat.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-[var(--m3-surface)] text-[var(--m3-on-surface-variant)] border-[var(--m3-outline-variant)] hover:bg-[var(--m3-surface-container-high)]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-Filters: Aufwand, Zubereitungszeit, Backen */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[var(--m3-outline-variant)]/50">
              {/* Aufwand */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-[var(--m3-on-surface-variant)] shrink-0">Aufwand:</span>
                <select
                  value={selectedEffort}
                  onChange={(e) => setSelectedEffort(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] text-xs font-bold text-[var(--m3-on-surface)]"
                >
                  <option value="all">Alle Stufen</option>
                  <option value="easy">Einfach (schnell gemacht)</option>
                  <option value="medium">Mittel</option>
                  <option value="hard">Anspruchsvoll</option>
                </select>
              </div>

              {/* Zeit */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-[var(--m3-on-surface-variant)] shrink-0">Max. Zeit:</span>
                <select
                  value={selectedTimeMax}
                  onChange={(e) => setSelectedTimeMax(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] text-xs font-bold text-[var(--m3-on-surface)]"
                >
                  <option value={0}>Beliebig lange</option>
                  <option value={20}>Bis 20 Minuten (Blitzküche)</option>
                  <option value={30}>Bis 30 Minuten</option>
                  <option value={45}>Bis 45 Minuten</option>
                </select>
              </div>

              {/* Backen */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-[var(--m3-on-surface-variant)] shrink-0">Ofen:</span>
                <select
                  value={bakeFilter}
                  onChange={(e) => setBakeFilter(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] text-xs font-bold text-[var(--m3-on-surface)]"
                >
                  <option value="all">Mit & Ohne Backen</option>
                  <option value="without">Nur Herd / Ohne Backen</option>
                  <option value="with">Mit Backofen</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results count & Random suggest */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[var(--m3-on-surface-variant)]">
              Gefundene Menüs: <strong>{filteredRecipes.length}</strong>
            </span>

            <button
              type="button"
              onClick={handlePickRandom}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              <Dices className="w-3.5 h-3.5" />
              <span>Zufälliges Menü vorschlagen</span>
            </button>
          </div>

          {/* Recipes Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredRecipes.slice(0, 60).map(recipe => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-3xl bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)] flex flex-col justify-between shadow-xs hover:border-emerald-500/40 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="text-sm font-black text-[var(--m3-on-surface)] leading-snug">
                      {recipe.title}
                    </h4>
                  </div>

                  <p className="text-xs text-[var(--m3-on-surface-variant)] line-clamp-2 leading-relaxed">
                    {recipe.description}
                  </p>

                  {/* Badges / Meta */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] text-[10px] font-bold text-[var(--m3-on-surface)]">
                      <Clock className="w-3 h-3 text-[var(--m3-primary)]" />
                      {recipe.durationMinutes} min
                    </span>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      recipe.effort === 'easy'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : recipe.effort === 'medium'
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                    }`}>
                      {recipe.effort === 'easy' ? 'Einfach' : recipe.effort === 'medium' ? 'Mittel' : 'Aufwendig'}
                    </span>

                    <span className="px-2 py-0.5 rounded-full bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] text-[10px] font-bold text-[var(--m3-on-surface-variant)]">
                      {recipe.requiresBaking ? '🥧 Ofen' : '🍳 Herd'}
                    </span>
                  </div>

                  {/* Ingredients Preview */}
                  <div className="mt-2.5 pt-2 border-t border-[var(--m3-outline-variant)]/50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--m3-on-surface-variant)] block mb-1">
                      Hauptzutaten:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {recipe.ingredients.slice(0, 4).map((ing, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-lg bg-[var(--m3-surface)] text-[var(--m3-on-surface)] font-medium">
                          {ing}
                        </span>
                      ))}
                      {recipe.ingredients.length > 4 && (
                        <span className="text-[10px] text-[var(--m3-on-surface-variant)] font-semibold px-1">
                          +{recipe.ingredients.length - 4} mehr
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions: Plan in week + Transfer to Pinnwand */}
                <div className="pt-3 mt-3 border-t border-[var(--m3-outline-variant)]/60 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      haptic.selection();
                      await transferIngredientsToPinnwand(recipe.title, recipe.ingredients);
                      showToast(`✓ Zutaten für "${recipe.title}" auf Pinnwand übertragen!`);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[var(--m3-surface)] hover:bg-[var(--m3-surface-container-high)] border border-[var(--m3-outline-variant)] text-[11px] font-bold text-[var(--m3-on-surface)] transition cursor-pointer"
                    title="Zutatenliste auf die Pinnwand pinnen"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 text-amber-500" />
                    <span>Auf Pinnwand</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickAssignModal({ isOpen: true, recipe })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-xs transition cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>In Woche planen</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredRecipes.length > 60 && (
            <p className="text-center text-xs text-[var(--m3-on-surface-variant)] font-semibold">
              Zeige die ersten 60 von {filteredRecipes.length} Menüs. Nutze die Suche für spezifische Zutaten!
            </p>
          )}
        </div>
      )}

      {/* MODAL 1: Detail & Edit Meal Modal */}
      {editingMealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg m3-dialog p-6 space-y-5 my-auto overflow-hidden shadow-2xl relative"
          >
            <div className="flex items-center justify-between border-b border-[var(--m3-outline-variant)]/60 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--m3-primary)]">
                  {editingMealModal.dayName} • {editingMealModal.mealType === 'lunch' ? '☀️ Mittagessen' : '🌙 Abendessen'}
                </span>
                <h3 className="text-xl font-black text-[var(--m3-on-surface)]">
                  Menü eintragen oder wählen
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingMealModal(null)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-high)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Choose from 500+ Recipes or manual */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-1.5">
                  Gericht / Menü
                </label>
                <input
                  type="text"
                  placeholder="z. B. Spaghetti Bolognese, Gemüseauflauf..."
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-sm font-bold text-[var(--m3-on-surface)] focus:ring-2 focus:ring-[var(--m3-primary)] shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-1.5">
                  Notiz (z. B. "vegetarisch für Papa", "Salat dazu")
                </label>
                <input
                  type="text"
                  placeholder="Zusatzinfo eingeben..."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-xs font-bold text-[var(--m3-on-surface)]"
                />
              </div>

              {/* Or Pick from Favorites / Random */}
              <div className="p-3.5 rounded-2xl bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)]">
                <span className="text-[11px] font-bold text-[var(--m3-on-surface-variant)] block mb-2">
                  Schnell-Vorschläge:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_RECIPES.slice(0, 8).map(rec => (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => {
                        setManualTitle(rec.title);
                        setSelectedRecipeForPlan(rec);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-[var(--m3-surface)] hover:bg-[var(--m3-surface-container-high)] text-[11px] font-bold text-[var(--m3-on-surface)] border border-[var(--m3-outline-variant)] transition cursor-pointer"
                    >
                      {rec.title.split(' ')[0]} {rec.title.split(' ')[1] || ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--m3-outline-variant)]/60">
              <button
                type="button"
                onClick={() => setEditingMealModal(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-high)] cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleSaveMeal}
                className="px-5 py-2.5 rounded-xl bg-[var(--m3-primary)] hover:bg-[var(--m3-primary)]/90 text-white text-xs font-black shadow-xs cursor-pointer"
              >
                Speichern
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL 2: Quick Assign Recipe to Day & Meal */}
      {quickAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md m3-dialog p-6 space-y-4 my-auto shadow-2xl relative"
          >
            <div className="flex items-center justify-between border-b border-[var(--m3-outline-variant)]/60 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  In den Wochenplan
                </span>
                <h3 className="text-base sm:text-lg font-black text-[var(--m3-on-surface)]">
                  Wann soll es das geben?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQuickAssignModal(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-high)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)]">
              <p className="text-xs font-black text-[var(--m3-on-surface)]">
                {quickAssignModal.recipe ? quickAssignModal.recipe.title : quickAssignModal.wishTitle}
              </p>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              <span className="text-[11px] font-bold text-[var(--m3-on-surface-variant)] block">
                Tag & Mahlzeit auswählen:
              </span>
              <div className="space-y-1.5">
                {weekDays.map(day => (
                  <div key={day.dateKey} className="p-2.5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-[var(--m3-on-surface)] block">
                        {day.dayName} ({day.formattedDate})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickAssign(day.dateKey, 'lunch')}
                        className="px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-700 hover:text-white dark:text-amber-300 text-[11px] font-bold transition cursor-pointer"
                      >
                        ☀️ Mittag
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAssign(day.dateKey, 'dinner')}
                        className="px-2.5 py-1 rounded-xl bg-indigo-500/15 hover:bg-indigo-500 text-indigo-700 hover:text-white dark:text-indigo-300 text-[11px] font-bold transition cursor-pointer"
                      >
                        🌙 Abend
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
