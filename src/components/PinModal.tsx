import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Delete, X, AlertCircle } from 'lucide-react';
import { FamilyMember } from '../types';
import { getInitials } from '../utils';

interface PinModalProps {
  isOpen: boolean;
  member: FamilyMember | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  member,
  onSuccess,
  onCancel
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Reset state on open/close or member change
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
      setIsShaking(false);
    }
  }, [isOpen, member]);

  const verifyPin = useCallback((enteredPin: string) => {
    if (!member) return;
    if (enteredPin === member.pin_code) {
      setError(false);
      onSuccess();
    } else {
      setError(true);
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        setPin('');
      }, 500);
    }
  }, [member, onSuccess]);

  const handleDigit = useCallback((digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);
      if (nextPin.length === 4) {
        // Auto-verify when 4 digits are entered
        setTimeout(() => verifyPin(nextPin), 50);
      }
    }
  }, [pin, verifyPin]);

  const handleDelete = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  }, []);

  const handleClear = useCallback(() => {
    setPin('');
    setError(false);
  }, []);

  // Handle hardware keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleDigit, handleDelete, onCancel]);

  if (!isOpen || !member) return null;

  const initials = getInitials(member.name);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
            x: isShaking ? [-8, 8, -6, 6, -3, 3, 0] : 0 
          }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-xs rounded-[28px] bg-[var(--m3-surface-container-high)] border border-[var(--m3-outline-variant)] shadow-2xl p-6 text-center relative"
        >
          {/* Close button */}
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 rounded-full text-[var(--m3-outline)] hover:text-[var(--m3-on-surface)] hover:bg-[var(--m3-surface-container-highest)] transition"
            aria-label="Abbrechen"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Member avatar */}
          <div className="flex justify-center mb-3">
            <div className="relative">
              <div
                style={{ backgroundColor: member.avatar_color }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md ring-2 ring-white/20"
              >
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-1 shadow-xs">
                <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </div>
          </div>

          <h2 className="text-base font-black text-[var(--m3-on-surface)] mb-0.5">
            {member.name}
          </h2>
          <p className="text-xs text-[var(--m3-on-surface-variant)] mb-5 font-medium">
            Bitte gib deinen 4-stelligen PIN-Code ein
          </p>

          {/* PIN Dots display */}
          <div className="flex justify-center items-center gap-3.5 mb-6">
            {[0, 1, 2, 3].map((index) => {
              const isFilled = pin.length > index;
              return (
                <div
                  key={index}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                    isFilled
                      ? error
                        ? 'bg-rose-500 scale-125 shadow-xs shadow-rose-500/50'
                        : 'bg-[var(--m3-primary)] scale-125 shadow-xs'
                      : 'bg-[var(--m3-surface-container-highest)] border border-[var(--m3-outline)]'
                  }`}
                />
              );
            })}
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-bold text-rose-500 flex items-center justify-center gap-1 mb-4"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Falscher PIN-Code
            </motion.div>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2.5 max-w-[220px] mx-auto mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <motion.button
                whileTap={{ scale: 0.92 }}
                key={num}
                type="button"
                onClick={() => handleDigit(num.toString())}
                className="w-16 h-12 rounded-2xl bg-[var(--m3-surface)] hover:bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface)] font-black text-lg transition shadow-2xs border border-[var(--m3-outline-variant)]"
              >
                {num}
              </motion.button>
            ))}
            <motion.button
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={handleClear}
              className="w-16 h-12 rounded-2xl text-xs font-black text-[var(--m3-outline)] hover:text-[var(--m3-on-surface)] hover:bg-[var(--m3-surface-container)] transition"
            >
              C
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={() => handleDigit('0')}
              className="w-16 h-12 rounded-2xl bg-[var(--m3-surface)] hover:bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface)] font-black text-lg transition shadow-2xs border border-[var(--m3-outline-variant)]"
            >
              0
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={handleDelete}
              className="w-16 h-12 rounded-2xl flex items-center justify-center text-[var(--m3-on-surface-variant)] hover:text-[var(--m3-on-surface)] hover:bg-[var(--m3-surface-container)] transition"
              aria-label="Löschen"
            >
              <Delete className="w-5 h-5" />
            </motion.button>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-bold text-[var(--m3-primary)] hover:underline transition"
          >
            Anderes Profil wählen
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
