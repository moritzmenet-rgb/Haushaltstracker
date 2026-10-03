import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  RotateCcw, 
  Trophy, 
  Palette, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Home,
  Clock,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Pin,
  Utensils,
  Compass,
  Layers,
  HelpCircle
} from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  userName?: string;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  userName = 'Haushalts-Held'
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const handleFinish = () => {
    if (onComplete) {
      onComplete();
    } else {
      onClose();
    }
  };

  const steps = [
    {
      step: 1,
      badge: 'Grundprinzip',
      icon: <Home className="w-8 h-8 text-white" />,
      colorGradient: 'from-indigo-600 to-violet-600',
      title: `Willkommen bei Haushalt, ${userName}!`,
      subtitle: 'Gamifiziertes Haushaltsmanagement ohne Streit',
      description: 'Schluss mit unklaren Zuständigkeiten! Diese App verwandelt alltägliche Haushaltsaufgaben in ein transparentes, faires Punktesystem für Familie & WG.',
      highlights: [
        { 
          title: 'Eigenes Profil mit Wochenziel', 
          desc: 'Jedes Mitglied wählt sein Profil aus. Du siehst sofort dein Wochenziel, deinen Fortschritt und deine erledigten Aufgaben.' 
        },
        { 
          title: 'Transparenz für alle', 
          desc: 'Im gemeinsamen Dashboard sieht jeder in Echtzeit, wer was beigetragen hat – fair, nachvollziehbar und motivierend.' 
        }
      ]
    },
    {
      step: 2,
      badge: 'Aufgaben & Punkte',
      icon: <Star className="w-8 h-8 text-white" />,
      colorGradient: 'from-amber-500 to-orange-500',
      title: 'Arbeit erfassen & Sterne-System',
      subtitle: 'Qualität & Extrameilen werden direkt belohnt',
      description: 'Klicke auf den Plus-Button (+) oder "Gönnen", um erledigte Arbeiten einzutragen:',
      highlights: [
        { 
          title: '★ 1 Stern (50% Punkte)', 
          desc: 'Aufgabe ordentlich und normal erledigt ("solide").' 
        },
        { 
          title: '★★ 2 Sterne (75% Punkte)', 
          desc: 'Besonders gründlich erledigt (z. B. alle Ecken sauber mitgewischt).' 
        },
        { 
          title: '★★★ 3 Sterne (100% Voller Bonus)', 
          desc: 'Die Extrameile gegangen und unaufgefordert noch mehr getan (z. B. Müll rausgebracht und Eimer ausgewaschen).' 
        }
      ]
    },
    {
      step: 3,
      badge: '📌 Pinnwand',
      icon: <Pin className="w-8 h-8 text-white rotate-12 fill-current" />,
      colorGradient: 'from-amber-600 to-amber-700',
      title: 'Wie du zur Familien-Pinnwand kommst',
      subtitle: 'Notizen, Abstimmungen, Fäden & Einkaufslisten',
      description: 'Du erreichst die Pinnwand jederzeit über zwei einfache Wege:',
      highlights: [
        { 
          title: '1. Klick auf das F&W Logo (oben links)', 
          desc: 'Tippe oben links auf das "F&W" Logo. In der geöffneten Familien-Zentrale wählst du direkt die "Pinnwand" an.' 
        },
        { 
          title: '2. Post-its, rote Fäden & Umfragen', 
          desc: 'Hefte bunte Zettel auf das Korkbrett, verbinde zusammengehörende Notizen mit roten Wollfäden oder starte Familien-Abstimmungen!' 
        }
      ]
    },
    {
      step: 4,
      badge: '🍽️ Menüplaner',
      icon: <Utensils className="w-8 h-8 text-white" />,
      colorGradient: 'from-emerald-600 to-teal-600',
      title: 'Wie du zum Menüplaner kommst',
      subtitle: 'Gemeinsame Speisepläne, Rezeptideen & Einkäufe',
      description: 'Auch den Menüplaner erreichst du blitzschnell über die App-Zentrale:',
      highlights: [
        { 
          title: '1. Öffnen über das F&W Logo', 
          desc: 'Klicke oben links auf das "F&W" Logo und wähle die Karte "Menüplanung". Schon bist du im Wochen-Speiseplan!' 
        },
        { 
          title: '2. Mahlzeiten planen & Wünsche einreichen', 
          desc: 'Trage Mittag- und Abendessen für jeden Tag ein, stimme über Essenswünsche ab und schicke Zutaten mit 1 Klick als Einkaufsliste an die Pinnwand.' 
        }
      ]
    },
    {
      step: 5,
      badge: '🧭 Familien-Zentrale',
      icon: <Compass className="w-8 h-8 text-white" />,
      colorGradient: 'from-indigo-600 to-blue-600',
      title: 'Die Familien-Zentrale (App Hub)',
      subtitle: 'Alles an einem Ort – immer griffbereit',
      description: 'Die Zentrale verbindet alle 3 Bereiche deiner Haushalts-App:',
      highlights: [
        { 
          title: 'Universal-Wechsler', 
          desc: 'Ein Klick auf das "F&W" Logo bringt dich immer direkt zur 3-teiligen Auswahl (Fish & Wish, Pinnwand, Menüplaner).' 
        },
        { 
          title: 'Feste Mobile Bottom Bar', 
          desc: 'Am Smartphone ist die Navigationsleiste immer fest verankert, damit du mit dem Daumen mühelos alle Tabs erreichst.' 
        }
      ]
    }
  ];

  const current = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-lg m3-dialog overflow-hidden my-auto relative flex flex-col"
        >
          {/* Top Bar with Indicators & Skip Button */}
          <div className="flex items-center justify-between px-6 pt-5 pb-2">
            <div className="flex items-center gap-1.5">
              {steps.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentStep
                      ? 'w-7 bg-[var(--m3-primary)]'
                      : idx < currentStep
                      ? 'w-2.5 bg-[var(--m3-outline)]'
                      : 'w-2 bg-[var(--m3-surface-container-highest)]'
                  }`}
                  aria-label={`Schritt ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handleFinish}
              className="text-xs font-bold text-[var(--m3-on-surface-variant)] hover:text-[var(--m3-on-surface)] px-2.5 py-1 rounded-full hover:bg-[var(--m3-surface-container-highest)] transition"
            >
              Überspringen
            </button>
          </div>

          {/* Slide Content with Animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="px-6 sm:px-8 pt-4 pb-6 flex-1"
            >
              {/* Header Badge & Icon */}
              <div className="flex items-center gap-3.5 mb-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${current.colorGradient} flex items-center justify-center shadow-lg shadow-black/10 shrink-0`}>
                  {current.icon}
                </div>
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-[var(--m3-surface)] text-[var(--m3-on-surface-variant)] mb-1 border border-[var(--m3-outline-variant)]">
                    Schritt {current.step} von {steps.length} • {current.badge}
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-[var(--m3-on-surface)] leading-tight">
                    {current.title}
                  </h2>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[var(--m3-on-surface-variant)] mb-4 leading-relaxed font-medium">
                {current.description}
              </p>

              {/* Highlights cards */}
              <div className="space-y-2.5 mb-2">
                {current.highlights.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] text-left shadow-2xs"
                  >
                    <div className="font-black text-xs text-[var(--m3-on-surface)] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[var(--m3-primary)] shrink-0" />
                      {item.title}
                    </div>
                    <div className="text-[11px] text-[var(--m3-on-surface-variant)] mt-1 pl-4 leading-normal">
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Footer Navigation Controls */}
          <div className="px-6 py-4 bg-[var(--m3-surface-container)] border-t border-[var(--m3-outline-variant)] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                currentStep === 0
                  ? 'opacity-0 pointer-events-none'
                  : 'text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-high)]'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Zurück
            </button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleNext}
              className="m3-btn-filled px-5 py-2.5 text-xs font-black inline-flex items-center gap-2"
            >
              {isLast ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  Alles verstanden – Los geht's!
                </>
              ) : (
                <>
                  Weiter
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
