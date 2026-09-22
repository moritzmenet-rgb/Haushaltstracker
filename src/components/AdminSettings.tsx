import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  User, 
  Palette, 
  Building2, 
  Users, 
  Calculator, 
  Layers, 
  Cloud, 
  Download 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AccountSettingsTab } from './AccountSettingsTab';
import { ThemeSettingsTab } from './ThemeSettingsTab';
import { GeneralSettingsTab } from './admin/GeneralSettingsTab';
import { UserManagementTab } from './admin/UserManagementTab';
import { RuleSettingsTab } from './admin/RuleSettingsTab';
import { CategoryManagementTab } from './admin/CategoryManagementTab';
import { SyncSettingsTab } from './admin/SyncSettingsTab';
import { DataManagementTab } from './admin/DataManagementTab';

type SubTabId = 'profile' | 'theme' | 'general' | 'users' | 'rules' | 'categories' | 'sync' | 'data';

export const AdminSettings: React.FC = () => {
  const { data, isAdmin, firebaseUser } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<SubTabId>('profile');

  const ALL_TABS: Array<{
    id: SubTabId;
    label: string;
    icon: React.ReactNode;
    adminOnly?: boolean;
  }> = [
    { id: 'profile', label: 'Mein Profil', icon: <User className="w-4 h-4" /> },
    { id: 'theme', label: 'Farben & Design', icon: <Palette className="w-4 h-4" /> },
    { id: 'general', label: 'Haushalt & Basis', icon: <Building2 className="w-4 h-4" />, adminOnly: true },
    { id: 'users', label: 'Mitglieder & Rollen', icon: <Users className="w-4 h-4" />, adminOnly: true },
    { id: 'rules', label: 'Sterne & Roll-Over', icon: <Calculator className="w-4 h-4" />, adminOnly: true },
    { id: 'categories', label: 'Kategorien', icon: <Layers className="w-4 h-4" />, adminOnly: true },
    { id: 'sync', label: 'Live-Sync & Cloud', icon: <Cloud className="w-4 h-4" />, adminOnly: true },
    { id: 'data', label: 'Backup & Reset', icon: <Download className="w-4 h-4" />, adminOnly: true },
  ];

  // Filter tabs: non-admins simply do not see admin tabs at all
  const visibleTabs = useMemo(() => {
    return ALL_TABS.filter(tab => !tab.adminOnly || isAdmin);
  }, [isAdmin]);

  // If a non-admin is active and activeSubTab is an admin-only tab, revert to profile
  useEffect(() => {
    if (!isAdmin && ['general', 'users', 'rules', 'categories', 'sync', 'data'].includes(activeSubTab)) {
      setActiveSubTab('profile');
    }
  }, [isAdmin, activeSubTab]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--m3-surface-container-high)] text-[var(--m3-primary)] border border-[var(--m3-outline-variant)] text-xs font-black uppercase tracking-wider mb-2">
          {isAdmin ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>Administrator-Zentrale</span>
            </>
          ) : (
            <>
              <User className="w-3.5 h-3.5 text-[var(--m3-primary)]" />
              <span>Persönlicher Bereich</span>
            </>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--m3-on-surface)]">
          {isAdmin ? 'Einstellungen & Administration' : 'Mein Profil & Einstellungen'}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--m3-on-surface-variant)] mt-0.5">
          {isAdmin 
            ? `${data.settings.household_name || 'Haushalt'} • Profil, Farben, Regeln, Roll-Over und Cloud-Synchronisation`
            : `${data.settings.household_name || 'Haushalt'} • Passe dein Profil, Avatar und das Farbdesign an`}
        </p>
      </div>

      {/* Material 3 Segment / Chips Carousel - Only showing available tabs */}
      <div className="p-2 rounded-[24px] bg-[var(--m3-surface-container-low)] border border-[var(--m3-outline-variant)] shadow-sm flex items-center gap-2 overflow-x-auto scrollbar-none">
        {visibleTabs.map((tab) => {
          const isActive = activeSubTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveSubTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'm3-chip-selected'
                  : 'bg-[var(--m3-surface)] text-[var(--m3-on-surface-variant)] border border-[var(--m3-outline-variant)] hover:bg-[var(--m3-surface-container-high)]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>

              {tab.id === 'sync' && firebaseUser && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 ml-0.5" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Tab Content Rendering in M3 Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {activeSubTab === 'profile' && <AccountSettingsTab />}
          {activeSubTab === 'theme' && <ThemeSettingsTab />}
          {isAdmin && (
            <>
              {activeSubTab === 'general' && <GeneralSettingsTab />}
              {activeSubTab === 'users' && <UserManagementTab />}
              {activeSubTab === 'rules' && <RuleSettingsTab />}
              {activeSubTab === 'categories' && <CategoryManagementTab />}
              {activeSubTab === 'sync' && <SyncSettingsTab />}
              {activeSubTab === 'data' && <DataManagementTab />}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
