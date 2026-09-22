import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Cloud, 
  CheckCircle2, 
  Smartphone, 
  Zap, 
  Database, 
  LogOut, 
  Loader2, 
  Share2, 
  Copy, 
  Check, 
  DollarSign, 
  UploadCloud,
  HelpCircle,
  FileDown,
  FileUp,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SyncSettingsTab: React.FC = () => {
  const { 
    firebaseUser, 
    loginWithGoogle, 
    logoutFirebase, 
    uploadAllToCloud,
    exportDataJSON,
    importDataJSON
  } = useApp();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonSuccess, setJsonSuccess] = useState<string | null>(null);

  const handleUploadAll = async () => {
    setIsUploading(true);
    try {
      await uploadAllToCloud();
      setUploadSuccess('Alle Haushaltsdaten erfolgreich in die Cloud synchronisiert!');
      setTimeout(() => setUploadSuccess(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyAppUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-6"
    >
      {/* 1. STATUS & AUTH CARD */}
      <div className="p-6 rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs ${
              firebaseUser
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)]'
            }`}>
              <Cloud className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-[var(--m3-on-surface)]">
                  Firebase Cloud-Synchronisation
                </h2>
                {firebaseUser ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-black border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live & Aktiv
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface-variant)] text-xs font-bold">
                    Lokaler Speicher
                  </span>
                )}
              </div>

              <p className="text-xs text-[var(--m3-on-surface-variant)] mt-0.5">
                {firebaseUser
                  ? `Verbunden mit Google-Konto: ${firebaseUser.email}`
                  : 'Aktuell sind deine Daten lokal im Browser gespeichert. Melde dich mit Google an für automatische Live-Synchronisation.'}
              </p>
            </div>
          </div>

          {/* Action Login / Logout */}
          <div>
            {firebaseUser ? (
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUploadAll}
                  disabled={isUploading}
                  className="m3-btn-filled px-4 py-2.5 text-xs font-black inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UploadCloud className="w-4 h-4" />
                  )}
                  <span>In Cloud pushen</span>
                </motion.button>

                <button
                  type="button"
                  onClick={logoutFirebase}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-[var(--m3-surface)] hover:bg-rose-500/10 text-[var(--m3-on-surface-variant)] hover:text-rose-500 text-xs font-bold border border-[var(--m3-outline-variant)] transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Abmelden</span>
                </button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={loginWithGoogle}
                className="m3-btn-filled px-5 py-2.5 text-xs font-black inline-flex items-center gap-2"
              >
                <Cloud className="w-4 h-4" />
                <span>Mit Google anmelden</span>
              </motion.button>
            )}
          </div>
        </div>

        {uploadSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 mb-4"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{uploadSuccess}</span>
          </motion.div>
        )}

        {/* 3 Highlights of live sync */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)]/60 text-xs space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 font-black text-[var(--m3-on-surface)]">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Echtzeit (WebSockets)</span>
            </div>
            <p className="text-[11px] text-[var(--m3-on-surface-variant)] leading-relaxed">
              Trägt ein Familienmitglied eine erledigte Aufgabe ein, aktualisiert sich der Punktestand auf allen anderen Bildschirmen blitzschnell.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)]/60 text-xs space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 font-black text-[var(--m3-on-surface)]">
              <Smartphone className="w-4 h-4 text-[var(--m3-primary)]" />
              <span>Plattform-übergreifend</span>
            </div>
            <p className="text-[11px] text-[var(--m3-on-surface-variant)] leading-relaxed">
              Funktioniert gleichzeitig auf iPhones, Android-Smartphones, Tablets, Mac und Windows im Browser oder als installierte PWA.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)]/60 text-xs space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 font-black text-[var(--m3-on-surface)]">
              <Database className="w-4 h-4 text-emerald-500" />
              <span>Offline-First</span>
            </div>
            <p className="text-[11px] text-[var(--m3-on-surface-variant)] leading-relaxed">
              Punkte eintragen funktioniert auch ohne Empfang im Waschkeller. Die App synchronisiert alles nach, sobald wieder WLAN da ist.
            </p>
          </div>
        </div>
      </div>

      {/* 2. MANUELLER WORKAROUND: JSON EXPORT/IMPORT */}
      <div className="p-6 rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm">
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-xs">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[var(--m3-on-surface)]">
              Manueller Datentransfer (Workaround)
            </h2>
            <p className="text-xs text-[var(--m3-on-surface-variant)] mt-0.5">
              Wenn die Cloud-Synchronisation nicht funktioniert, kannst du deine Daten hier manuell sichern oder übertragen.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Export */}
          <div className="p-4 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] flex flex-col gap-3">
            <div>
              <h3 className="text-sm font-black text-[var(--m3-on-surface)] flex items-center gap-2">
                <FileDown className="w-4 h-4 text-emerald-500" />
                Daten exportieren
              </h3>
              <p className="text-[11px] text-[var(--m3-on-surface-variant)] mt-1">
                Lade alle Aufgaben, Mitglieder und Logs als Datei herunter.
              </p>
            </div>
            <button
              onClick={() => {
                const json = exportDataJSON();
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `haushalt_backup_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
              }}
              className="m3-btn-tonal py-2 text-xs font-black w-full"
            >
              Backup herunterladen
            </button>
          </div>

          {/* Import */}
          <div className="p-4 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] flex flex-col gap-3">
            <div>
              <h3 className="text-sm font-black text-[var(--m3-on-surface)] flex items-center gap-2">
                <FileUp className="w-4 h-4 text-amber-500" />
                Daten importieren
              </h3>
              <p className="text-[11px] text-[var(--m3-on-surface-variant)] mt-1">
                Wähle eine Backup-Datei aus, um Daten in diesen Browser zu laden.
              </p>
            </div>
            <label className="m3-btn-tonal py-2 text-xs font-black w-full text-center cursor-pointer">
              Datei auswählen
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (re) => {
                    const content = re.target?.result as string;
                    if (importDataJSON(content)) {
                      setJsonSuccess('Daten erfolgreich importiert! Die App wird neu geladen...');
                      setJsonError(null);
                      setTimeout(() => window.location.reload(), 2000);
                    } else {
                      setJsonError('Fehler beim Importieren. Ungültige Datei.');
                      setJsonSuccess(null);
                    }
                  };
                  reader.readAsText(file);
                }}
              />
            </label>
          </div>
        </div>

        {(jsonError || jsonSuccess) && (
          <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 text-xs font-bold ${
            jsonError ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
          }`}>
            {jsonError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{jsonError || jsonSuccess}</span>
          </div>
        )}
      </div>

      {/* 3. TRANSPARENTE KOSTENERKLÄRUNG (SPARK-PLAN) */}
      <div className="p-6 rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm">
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-xs">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[var(--m3-on-surface)]">
              Kostet die Live-Synchronisation Geld?
            </h2>
            <p className="text-xs text-[var(--m3-on-surface-variant)] mt-0.5">
              Die vollständige, ehrliche Antwort: <strong>Nein, für normale Familienhaushalte ist es 100% kostenlos!</strong>
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-[var(--m3-on-surface)]">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-black text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Firebase Spark-Tarif (Kostenloses Kontingent jeden Tag)</span>
            </div>
            <p className="leading-relaxed text-[11px] text-[var(--m3-on-surface-variant)]">
              Google Firebase stellt im Standard-Tarif ("Spark Plan") jedem Projekt großzügige, täglich erneuernde Freikontingente zur Verfügung:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 font-mono text-[11px]">
              <div className="p-3 rounded-xl bg-[var(--m3-surface)] border border-emerald-500/20 shadow-2xs">
                <strong className="block text-[var(--m3-on-surface)]">50.000 Lesevorgänge</strong>
                <span className="text-[var(--m3-outline)] font-bold">pro Tag kostenlos</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--m3-surface)] border border-emerald-500/20 shadow-2xs">
                <strong className="block text-[var(--m3-on-surface)]">20.000 Schreibvorgänge</strong>
                <span className="text-[var(--m3-outline)] font-bold">pro Tag kostenlos</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--m3-surface)] border border-emerald-500/20 shadow-2xs">
                <strong className="block text-[var(--m3-on-surface)]">1 GB Cloud-Speicher</strong>
                <span className="text-[var(--m3-outline)] font-bold">dauerhaft kostenlos</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] shadow-2xs">
            <h3 className="font-black text-[var(--m3-on-surface)] mb-1 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[var(--m3-primary)]" />
              Wieviel verbraucht ein typischer 4- bis 6-Personen-Haushalt?
            </h3>
            <p className="text-[11px] text-[var(--m3-on-surface-variant)] leading-relaxed">
              Wenn jedes Familienmitglied jeden Tag 5 Aufgaben erledigt und 10-mal die App öffnet, erzeugt das ca. <strong>80 bis 250 Operationen pro Tag</strong>.
              Das entspricht <strong>weniger als 0,5%</strong> der kostenlosen Grenze. Selbst wenn ihr 10 Jahre lang jeden Tag Aufgaben protokolliert, bleibt ihr im kostenlosen Rahmen und zahlt <strong>0,00 €</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* 3. SCHRITT-FÜR-SCHRITT ANLEITUNG: FAMILIE VERBINDEN */}
      <div className="p-6 rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm">
        <h2 className="text-lg font-black text-[var(--m3-on-surface)] mb-1 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-[var(--m3-primary)]" />
          So richtest du die Synchronisation für deine Familie ein
        </h2>
        <p className="text-xs text-[var(--m3-on-surface-variant)] mb-5">
          In 3 einfachen Schritten synchron auf allen Smartphones und Computern:
        </p>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] shadow-2xs">
            <div className="w-7 h-7 rounded-xl bg-[var(--m3-primary)] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
              1
            </div>
            <div className="text-xs">
              <strong className="block text-[var(--m3-on-surface)] mb-0.5">
                Admin meldet sich an & sichert die Basisdaten
              </strong>
              <p className="text-[var(--m3-on-surface-variant)] leading-relaxed text-[11px]">
                Klicke oben auf "Mit Google anmelden". Nach erfolgreichem Login klickst du einmal auf "In Cloud pushen", damit alle bisherigen Aufgaben, Mitglieder und Ziele in deiner Firestore-Datenbank gespeichert sind.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] shadow-2xs">
            <div className="w-7 h-7 rounded-xl bg-[var(--m3-primary)] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
              2
            </div>
            <div className="text-xs flex-1">
              <strong className="block text-[var(--m3-on-surface)] mb-0.5">
                Link an die Familienmitglieder senden
              </strong>
              <p className="text-[var(--m3-on-surface-variant)] leading-relaxed text-[11px] mb-2.5">
                Teile den Link dieser App per WhatsApp, iMessage, Signal oder E-Mail mit deinen Mitbewohnern oder deiner Familie.
              </p>
              <button
                type="button"
                onClick={handleCopyAppUrl}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--m3-surface-container)] hover:bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface)] text-xs font-black transition cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link kopiert!' : 'App-Link kopieren'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] shadow-2xs">
            <div className="w-7 h-7 rounded-xl bg-[var(--m3-primary)] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
              3
            </div>
            <div className="text-xs">
              <strong className="block text-[var(--m3-on-surface)] mb-0.5">
                Auf dem Smartphone öffnen & Profil wählen
              </strong>
              <p className="text-[var(--m3-on-surface-variant)] leading-relaxed text-[11px]">
                Öffnen deine Familienmitglieder den Link auf ihrem Handy, wählen sie einfach ihr Profil aus. Auf iOS tippt man auf "Teilen &gt; Zum Home-Bildschirm", auf Android auf "App installieren". Schon läuft die Haushalts-App wie eine native App!
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
