import React from 'react';
import { ShieldAlert, Globe, Monitor, Smartphone, Tablet, Ban, Unlock, Clock, Mail, ShieldX } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { motion } from 'motion/react';

export const SessionsTab: React.FC = () => {
  const { sessions, blockedEmails, blockUserByEmail, unblockUserByEmail, isAdmin } = useApp();

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-[var(--m3-surface-container-low)] rounded-[28px] border border-[var(--m3-outline-variant)]">
        <ShieldX className="w-12 h-12 text-[var(--m3-error)] mx-auto mb-4" />
        <h2 className="text-xl font-black text-[var(--m3-on-surface)]">Zugriff verweigert</h2>
        <p className="text-sm text-[var(--m3-on-surface-variant)] mt-2">Nur Administratoren können Sitzungsprotokolle einsehen.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-[28px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-[var(--m3-on-surface)] mb-1">
              Sicherheit & Aktive Sitzungen
            </h2>
            <p className="text-xs text-[var(--m3-on-surface-variant)] max-w-xl leading-relaxed">
              Hier siehst du alle Geräte und E-Mails, die auf deinen Haushalt zugegriffen haben. Du kannst unerwünschte E-Mails sperren.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {sessions.length === 0 ? (
          <div className="p-12 text-center text-[var(--m3-on-surface-variant)] bg-[var(--m3-surface-container-low)] rounded-[24px] border border-dashed border-[var(--m3-outline-variant)]">
            Keine Sitzungsdaten verfügbar.
          </div>
        ) : (
          sessions.map((session) => {
            const isBlocked = blockedEmails.includes(session.email.toLowerCase());
            const isSelf = session.email === 'moritz.menet.bfsu@gmail.com';

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 rounded-[24px] border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                  isBlocked 
                    ? 'bg-rose-500/5 border-rose-500/20' 
                    : 'bg-[var(--m3-surface-container-low)] border-[var(--m3-outline-variant)]'
                }`}
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    isBlocked ? 'bg-rose-500/10 text-rose-500' : 'bg-[var(--m3-surface-container)] text-[var(--m3-primary)]'
                  }`}>
                    {session.device_type === 'Mobile' && <Smartphone className="w-6 h-6" />}
                    {session.device_type === 'Tablet' && <Tablet className="w-6 h-6" />}
                    {session.device_type === 'Desktop' && <Monitor className="w-6 h-6" />}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-[var(--m3-on-surface)] truncate">
                        {session.email}
                      </span>
                      {isBlocked && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider">
                          Gesperrt
                        </span>
                      )}
                      {isSelf && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider">
                          Eigentümer
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] font-bold text-[var(--m3-on-surface-variant)]">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(session.timestamp).toLocaleString('de-DE')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5" />
                        <span>IP: {session.ip_address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {!isSelf && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => isBlocked ? unblockUserByEmail(session.email) : blockUserByEmail(session.email)}
                    className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition ${
                      isBlocked
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-rose-500 text-white hover:bg-rose-600'
                    }`}
                  >
                    {isBlocked ? (
                      <>
                        <Unlock className="w-4 h-4" />
                        <span>Entsperren</span>
                      </>
                    ) : (
                      <>
                        <Ban className="w-4 h-4" />
                        <span>E-Mail sperren</span>
                      </>
                    )}
                  </motion.button>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {blockedEmails.length > 0 && (
        <div className="p-6 rounded-[28px] bg-rose-500/5 border border-rose-500/20">
          <h3 className="text-sm font-black text-rose-700 dark:text-rose-300 flex items-center gap-2 mb-3">
            <Ban className="w-4 h-4" />
            Aktuell gesperrte E-Mails ({blockedEmails.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {blockedEmails.map(email => (
              <div key={email} className="px-3 py-1.5 rounded-lg bg-white dark:bg-black/20 border border-rose-500/30 text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                <span>{email}</span>
                <button 
                  onClick={() => unblockUserByEmail(email)}
                  className="hover:text-rose-800 dark:hover:text-rose-200"
                >
                  <Unlock className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
