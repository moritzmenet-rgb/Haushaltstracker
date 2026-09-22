import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Layers, Plus, Edit2, Trash2, Check, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getCategoryStyle } from '../../utils';
import { ConfirmModal } from '../ConfirmModal';

export const CategoryManagementTab: React.FC = () => {
  const { data, addCategory, renameCategory, deleteCategory } = useApp();
  const categories = data.settings.categories || [];
  const tasks = Object.values(data.tasks);

  const [newCatName, setNewCatName] = useState('');
  const [editingCat, setEditingCat] = useState<{ oldName: string; newName: string } | null>(null);
  const [catToDelete, setCatToDelete] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    if (addCategory(newCatName.trim())) {
      showToast(`Kategorie "${newCatName.trim()}" hinzugefügt!`);
      setNewCatName('');
    } else {
      showToast('Kategorie existiert bereits!');
    }
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat || !editingCat.newName.trim()) return;
    renameCategory(editingCat.oldName, editingCat.newName.trim());
    showToast(`In "${editingCat.newName.trim()}" umbenannt!`);
    setEditingCat(null);
  };

  const handleConfirmDelete = () => {
    if (!catToDelete) return;
    deleteCategory(catToDelete);
    showToast(`Kategorie "${catToDelete}" gelöscht.`);
    setCatToDelete(null);
  };

  const getTaskCountForCategory = (cat: string) => {
    return tasks.filter((t) => t.category?.toLowerCase() === cat.toLowerCase()).length;
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

      <div className="p-6 rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm">
        <div className="flex items-center gap-3.5 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] flex items-center justify-center shadow-xs">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[var(--m3-on-surface)]">
              Räume & Aufgaben-Kategorien
            </h2>
            <p className="text-xs text-[var(--m3-on-surface-variant)] mt-0.5">
              Strukturiere Aufgaben nach Räumen (z. B. Bad, Küche, Garten, Keller).
            </p>
          </div>
        </div>

        {/* Add Category Input */}
        <form onSubmit={handleAddCategory} className="flex gap-2 mt-5 mb-6">
          <input
            type="text"
            placeholder="Neue Kategorie (z. B. Keller, Haustiere, Flur, Balkon)..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-xs sm:text-sm font-bold text-[var(--m3-on-surface)] placeholder-[var(--m3-outline)] focus:outline-none focus:ring-2 focus:ring-[var(--m3-primary)] shadow-xs transition"
          />
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="m3-btn-filled px-5 py-2.5 text-xs font-black shrink-0 inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Hinzufügen</span>
          </motion.button>
        </form>

        {/* Categories List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map((cat) => {
            const count = getTaskCountForCategory(cat);
            const style = getCategoryStyle(cat);

            return (
              <div
                key={cat}
                className="flex items-center justify-between p-4 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${style}`}>
                    {cat}
                  </span>
                  <span className="text-[11px] text-[var(--m3-on-surface-variant)] font-bold whitespace-nowrap">
                    {count} {count === 1 ? 'Aufgabe' : 'Aufgaben'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingCat({ oldName: cat, newName: cat })}
                    className="p-2 rounded-xl text-[var(--m3-outline)] hover:text-[var(--m3-on-surface)] hover:bg-[var(--m3-surface-container-high)] transition"
                    title="Kategorie umbenennen"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {categories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setCatToDelete(cat)}
                      className="p-2 rounded-xl text-[var(--m3-outline)] hover:text-rose-500 hover:bg-rose-500/10 transition"
                      title="Kategorie löschen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rename Modal */}
      {editingCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-sm rounded-[28px] bg-[var(--m3-surface-container-high)] border border-[var(--m3-outline-variant)] p-6 shadow-2xl"
          >
            <h3 className="text-base font-black text-[var(--m3-on-surface)] mb-4">
              Kategorie umbenennen
            </h3>

            <form onSubmit={handleSaveRename} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] mb-1.5">
                  Neuer Name
                </label>
                <input
                  type="text"
                  required
                  value={editingCat.newName}
                  onChange={(e) => setEditingCat({ ...editingCat, newName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline)] text-sm font-bold text-[var(--m3-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--m3-primary)] shadow-xs"
                />
                <p className="text-[11px] text-[var(--m3-on-surface-variant)] mt-1.5">
                  Alle Aufgaben in dieser Kategorie werden automatisch aktualisiert.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--m3-outline-variant)]/60">
                <button
                  type="button"
                  onClick={() => setEditingCat(null)}
                  className="px-4 py-2 text-xs font-bold text-[var(--m3-on-surface-variant)] rounded-full hover:bg-[var(--m3-surface-container-highest)]"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="m3-btn-filled px-5 py-2 text-xs font-black"
                >
                  Umbenennen
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!catToDelete}
        title="Kategorie löschen?"
        message={`Möchtest du die Kategorie "${catToDelete}" wirklich löschen? Zugeordnete Aufgaben werden zur Kategorie "Allgemein" verschoben.`}
        confirmLabel="Ja, löschen"
        cancelLabel="Abbrechen"
        onConfirm={handleConfirmDelete}
        onCancel={() => setCatToDelete(null)}
        isDanger={true}
      />
    </motion.div>
  );
};
