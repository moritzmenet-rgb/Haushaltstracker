import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, AlertCircle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AdminUnlockModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AdminUnlockModal: React.FC<AdminUnlockModalProps> = ({
  isOpen,
  onSuccess,
  onCancel
}) => {
  const { data, activeUser, updateMember, setActiveUserId } = useApp();
  const members = Object.values(data.members);
  const adminMembers = members.filter((m) => m.role === 'admin');

  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  if (!isOpen) return null;

  // Check if any admin has a PIN
  const adminsWithPin = adminMembers.filter((m) => !!m.pin_code);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        // Verify
        const matchingAdmin = adminMembers.find((a) => a.pin_code === nextPin);
        if (matchingAdmin) {
          // Success! Switch to that admin or authorize
          setActiveUserId(matchingAdmin.id);
          onSuccess();
        } else {
          setError(true);
          setIsShaking(true);
          setTimeout(() => {
            setIsShaking(false);
            setPin('');
          }, 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handlePromoteSelf = () => {
    if (activeUser) {
      updateMember(activeUser.id, { role: 'admin' });
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 15 }}
        className="w-full max-w-sm m3-dialog p-6 shadow-2xl relative overflow-hidden"
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 rounded-full text-[var(--m3-outline)] hover:text-[var(--m3-on-surface)] hover:bg-[var(--m3-surface-container-highest)] transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5">
          <div className="w-13 h-13 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-xs border border-amber-500/30">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-[var(--m3-on-surface)]">
            Administrator-Bereich geschützt
          </h3>
          <p className="text-xs text-[var(--m3-on-surface-variant)] mt-1">
            {adminsWithPin.length > 0
              ? 'Gib den 4-stelligen Admin-PIN ein, um administrative Einstellungen zu öffnen.'
              : 'Aktuell ist kein PIN-Schutz für Admins eingerichtet.'}
          </p>
        </div>

        {adminsWithPin.length > 0 ? (
          <div className="space-y-4">
            {/* PIN Dots Display */}
            <motion.div
              animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="flex justify-center gap-3 py-2"
            >
              {[0, 1, 2, 3].map((idx) => {
                const filled = idx < pin.length;
                return (
                  <div
                    key={`admin-dot-${idx}`}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                      filled
                        ? error
                          ? 'bg-rose-500 scale-125 shadow-xs shadow-rose-500/50'
                          : 'bg-[var(--m3-primary)] scale-125 shadow-xs'
                        : 'bg-[var(--m3-surface-container-highest)] border border-[var(--m3-outline)]'
                    }`}
                  />
                );
              })}
            </motion.div>

            {error && (
              <p className="text-xs text-rose-500 text-center font-black flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Falscher PIN! Bitte erneut versuchen.
              </p>
            )}

            {/* Numpad with Material 3 Keys */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key, i) => {
                if (key === '') return <div key={`admin-keypad-blank-${i}`} />;
                if (key === 'del') {
                  return (
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      key="admin-keypad-del"
                      onClick={handleDelete}
                      className="p-3.5 rounded-2xl bg-[var(--m3-surface-container)] hover:bg-[var(--m3-surface-container-highest)] border border-[var(--m3-outline-variant)] text-xs font-black text-[var(--m3-on-surface)] transition shadow-2xs"
                    >
                      Löschen
                    </motion.button>
                  );
                }
                return (
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    key={`admin-keypad-num-${key}`}
                    onClick={() => handleDigit(key)}
                    className="p-3.5 rounded-2xl bg-[var(--m3-surface)] hover:bg-[var(--m3-surface-container-high)] border border-[var(--m3-outline-variant)] text-base font-black text-[var(--m3-on-surface)] transition shadow-2xs"
                  >
                    {key}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <p className="text-xs text-[var(--m3-on-surface-variant)] leading-relaxed text-center font-medium">
              Möchtest du dein Profil <strong className="text-[var(--m3-on-surface)]">{activeUser?.name}</strong> zum Administrator ernennen?
            </p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePromoteSelf}
              className="m3-btn-filled w-full py-3 text-xs font-black"
            >
              Zum Administrator ernennen
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
