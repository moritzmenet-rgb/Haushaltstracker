import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Download, 
  Upload, 
  Trash2, 
  AlertTriangle, 
  Check, 
  RotateCcw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ConfirmModal } from '../ConfirmModal';

export const DataManagementTab: React.FC = () => {
  const { 
    exportDataJSON, 
    importDataJSON, 
    clearAllData, 
    resetToDemoData 
  } = useApp();

  const [showClearModal, setShowClearModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExport = () => {
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `haushalt_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup-Datei erfolgreich heruntergeladen!');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && importDataJSON(content)) {
        showToast('Daten erfolgreich wiederhergestellt!');
      } else {
        alert('Fehler beim Importieren der Datei. Bitte überprüfe das Format.');
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteClear = async () => {
    setIsProcessing(true);
    try {
      await clearAllData();
      showToast('Haushaltsdaten wurden vollständig geleert.');
    } catch (err) {
      console.error('Clear failed:', err);
    } finally {
      setIsProcessing(false);
      setShowClearModal(false);
    }
  };

  const handleExecuteDemo = async () => {
    setIsProcessing(true);
    try {
      await resetToDemoData();
      showToast('Demo-Haushalt "Familie Menet" erfolgreich geladen!');
    } catch (err) {
      console.error('Demo reset failed:', err);
    } finally {
      setIsProcessing(false);
      setShowDemoModal(false);
    }
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

      {/* Backup & Export */}
      <div className="p-6 rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm">
        <div className="flex items-center gap-3.5 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] flex items-center justify-center shadow-xs">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[var(--m3-on-surface)]">
              Datensicherung & Export
            </h2>
            <p className="text-xs text-[var(--m3-on-surface-variant)] mt-0.5">
              Sichere alle Aufgaben, Mitglieder, Einstellungen und Logs als JSON-Datei.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
          <div className="p-5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] flex flex-col justify-between shadow-2xs">
            <div>
              <span className="font-black text-xs text-[var(--m3-on-surface)] block mb-1">
                JSON-Backup herunterladen
              </span>
              <p className="text-[11px] text-[var(--m3-on-surface-variant)] mb-4">
                Speichere den aktuellen Stand auf deinem Computer oder Smartphone.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleExport}
              className="m3-btn-filled px-4 py-2.5 text-xs font-black inline-flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Backup jetzt exportieren</span>
            </motion.button>
          </div>

          <div className="p-5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] flex flex-col justify-between shadow-2xs">
            <div>
              <span className="font-black text-xs text-[var(--m3-on-surface)] block mb-1">
                Backup-Datei importieren
              </span>
              <p className="text-[11px] text-[var(--m3-on-surface-variant)] mb-4">
                Lade ein zuvor erstelltes Backup hoch, um alte Daten wiederherzustellen.
              </p>
            </div>
            <label className="m3-btn-tonal px-4 py-2.5 text-xs font-black inline-flex items-center justify-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>JSON-Datei auswählen</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Demo Data & Danger Zone */}
      <div className="p-6 rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm">
        <div className="flex items-center gap-3.5 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-xs">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[var(--m3-on-surface)]">
              Demodaten & Haushalts-Reset
            </h2>
            <p className="text-xs text-[var(--m3-on-surface-variant)] mt-0.5">
              Demodaten laden oder den gesamten Haushalt für einen Neuanfang zurücksetzen.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
          <div className="p-5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] flex flex-col justify-between shadow-2xs">
            <div>
              <span className="font-black text-xs text-[var(--m3-on-surface)] block mb-1">
                Demodaten laden
              </span>
              <p className="text-[11px] text-[var(--m3-on-surface-variant)] mb-4">
                Lädt den vorbefüllten Beispiel-Haushalt "Familie Menet" mit 4 Mitgliedern und 18 Aufgaben.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDemoModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--m3-surface-container)] hover:bg-[var(--m3-surface-container-high)] text-[var(--m3-primary)] text-xs font-black transition border border-[var(--m3-outline-variant)] cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Demodaten einspielen</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] flex flex-col justify-between shadow-2xs">
            <div>
              <span className="font-black text-xs text-rose-500 block mb-1">
                Haushalt komplett leeren
              </span>
              <p className="text-[11px] text-[var(--m3-on-surface-variant)] mb-4">
                Löscht alle Aufgaben, Mitglieder und Historien für einen sauberen Neuanfang.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowClearModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-black transition border border-rose-500/30 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Alle Daten unwiderruflich löschen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={showClearModal}
        title="Alle Daten löschen?"
        message="Möchtest du wirklich alle Aufgaben, Mitglieder und Punktestände löschen? Dies kann nicht rückgängig gemacht werden, es sei denn, du hast ein Backup exportiert."
        confirmLabel="Ja, alles löschen"
        cancelLabel="Abbrechen"
        onConfirm={handleExecuteClear}
        onCancel={() => setShowClearModal(false)}
        isDanger={true}
      />

      <ConfirmModal
        isOpen={showDemoModal}
        title="Demodaten laden?"
        message="Dadurch werden die aktuellen Daten mit den Beispiel-Daten von Familie Menet überschrieben."
        confirmLabel="Demodaten laden"
        cancelLabel="Abbrechen"
        onConfirm={handleExecuteDemo}
        onCancel={() => setShowDemoModal(false)}
        isDanger={false}
      />
    </motion.div>
  );
};
