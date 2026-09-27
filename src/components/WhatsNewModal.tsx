import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  X, 
  Check, 
  Sliders, 
  Bell, 
  Tag, 
  Award, 
  Pin, 
  Shield, 
  Zap, 
  History, 
  ChevronRight,
  PartyPopper
} from 'lucide-react';
import { CURRENT_VERSION, RELEASE_NAME, VERSION_HISTORY, ReleaseFeature } from '../version';
import { fireConfetti } from '../utils/confetti';
import { useApp } from '../context/AppContext';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: () => void;
  activeUserName?: string;
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({
  isOpen,
  onClose,
  onAcknowledge,
  activeUserName
}) => {
  const [selectedVersion, setSelectedVersion] = useState<string>(CURRENT_VERSION);
  const [showHistory, setShowHistory] = useState(false);

  // Trigger playful confetti burst when the modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        fireConfetti({ particleCount: 70, spread: 80 });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentRelease = VERSION_HISTORY.find(v => v.version === selectedVersion) || VERSION_HISTORY[0];

  const getFeatureIcon = (iconName: ReleaseFeature['iconName']) => {
    const iconClass = "w-5 h-5";
    switch (iconName) {
      case 'sliders':
        return <Sliders className={`${iconClass} text-indigo-500`} />;
      case 'bell':
        return <Bell className={`${iconClass} text-amber-500`} />;
      case 'tag':
        return <Tag className={`${iconClass} text-emerald-500`} />;
      case 'sparkles':
        return <Sparkles className={`${iconClass} text-purple-500`} />;
      case 'award':
        return <Award className={`${iconClass} text-rose-500`} />;
      case 'pin':
        return <Pin className={`${iconClass} text-amber-600`} />;
      case 'shield':
        return <Shield className={`${iconClass} text-blue-500`} />;
      case 'zap':
        return <Zap className={`${iconClass} text-yellow-500`} />;
      default:
        return <Sparkles className={`${iconClass} text-indigo-500`} />;
    }
  };

  const getCategoryBadgeClass = (category: ReleaseFeature['category']) => {
    switch (category) {
      case 'Neu':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
      case 'Behoben':
        return 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30';
      case 'Verbessert':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
      default:
        return 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30';
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="whats-new-modal-title"
      >
        {/* Soft frosted ambient backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/55 backdrop-blur-md transition-opacity"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 25 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          className="relative w-full max-w-2xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] rounded-[32px] sm:rounded-[36px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10"
        >
          {/* Decorative festive top aura */}
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-indigo-500/15 via-purple-500/10 to-transparent pointer-events-none -z-0" />

          {/* Modal Header */}
          <div className="relative z-10 px-6 sm:px-8 pt-7 pb-4 border-b border-[var(--m3-outline-variant)]/60">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                {/* Playful Animated Icon Bubble */}
                <motion.div 
                  animate={{ 
                    rotate: [-3, 4, -2, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/25 shrink-0"
                >
                  <PartyPopper className="w-7 h-7 drop-shadow-sm" />
                </motion.div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-[11px] font-black tracking-wide uppercase">
                      v{currentRelease.version}
                    </span>
                    <span className="text-[11px] font-semibold text-[var(--m3-on-surface-variant)]">
                      {currentRelease.date}
                    </span>
                  </div>

                  <h2 
                    id="whats-new-modal-title" 
                    className="text-xl sm:text-2xl font-black text-[var(--m3-on-surface)] tracking-tight leading-snug"
                  >
                    Hey {activeUserName ? activeUserName : 'da'}! Schau mal, was neu ist 🎉
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--m3-on-surface-variant)] mt-0.5">
                    {currentRelease.subtitle}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-[var(--m3-surface-container)] hover:bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface-variant)] flex items-center justify-center transition border border-[var(--m3-outline-variant)]/50 shrink-0"
                aria-label="Schließen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Version Switcher Tabs / Toggle */}
            <div className="mt-4 flex items-center justify-between gap-2 pt-2 border-t border-[var(--m3-outline-variant)]/30">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                {VERSION_HISTORY.map((rel) => {
                  const isSelected = selectedVersion === rel.version;
                  return (
                    <button
                      key={rel.version}
                      type="button"
                      onClick={() => setSelectedVersion(rel.version)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--m3-primary)] text-[var(--m3-on-primary)] shadow-sm'
                          : 'bg-[var(--m3-surface-container)] text-[var(--m3-on-surface-variant)] hover:bg-[var(--m3-surface-container-high)] border border-[var(--m3-outline-variant)]/40'
                      }`}
                    >
                      <span>v{rel.version}</span>
                      {rel.isLatest && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="hidden sm:flex items-center gap-1 text-[11px] text-[var(--m3-on-surface-variant)] font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Fish & Wish Update</span>
              </div>
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-5 space-y-4">
            {/* Quick Summary Highlights Box */}
            <div className="p-4 rounded-2xl bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)]/60">
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--m3-primary)] mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Highlights in diesem Update
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[var(--m3-on-surface)]">
                {currentRelease.highlights.map((h, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black">
                      ✓
                    </span>
                    <span className="font-medium">{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Feature Cards Grid */}
            <div className="space-y-3 pt-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--m3-on-surface-variant)] px-1">
                Alle Details & Verbesserungen
              </h3>

              {currentRelease.features.map((feat, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.01, y: -2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="p-4 rounded-2xl bg-[var(--m3-surface-container)] border border-[var(--m3-outline-variant)]/60 flex items-start gap-3.5 shadow-xs transition-shadow hover:shadow-md"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)]/60 flex items-center justify-center shrink-0 shadow-2xs">
                    {getFeatureIcon(feat.iconName)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="text-sm font-extrabold text-[var(--m3-on-surface)] tracking-tight">
                        {feat.title}
                      </h4>
                      {feat.badge && (
                        <span className={`px-2 py-0.2 rounded-md text-[10px] font-black uppercase tracking-wide border ${getCategoryBadgeClass(feat.category)}`}>
                          {feat.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--m3-on-surface-variant)] leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Modal Footer with Primary Button */}
          <div className="p-4 sm:p-6 bg-[var(--m3-surface-container-low)] border-t border-[var(--m3-outline-variant)]/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-center sm:text-left">
              <span className="text-xs text-[var(--m3-on-surface-variant)] flex items-center justify-center sm:justify-start gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Wird für Account <strong>{activeUserName || 'dieses Profil'}</strong> als gelesen markiert</span>
              </span>
            </div>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={onAcknowledge}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[var(--m3-primary)] hover:bg-[var(--m3-primary-hover)] text-[var(--m3-on-primary)] font-black text-sm shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <span>Verstanden & Loslegen! 🚀</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
