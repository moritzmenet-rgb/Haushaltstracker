import { ColorTheme } from './types';

export interface ThemeConfig {
  id: ColorTheme;
  name: string;
  subtitle: string;
  description: string;
  primaryHex: string;
  hoverHex: string;
  lightBgHex: string;
  borderHex: string;
  dotColor: string;
  gradient: string;
}

export const COLOR_THEMES: Record<ColorTheme, ThemeConfig> = {
  indigo: {
    id: 'indigo',
    name: 'Indigo Modern',
    subtitle: 'Klassisch & Fokussiert',
    description: 'Minimalistisch, professionell und kontrastreich für den täglichen Überblick.',
    primaryHex: '#4F46E5',
    hoverHex: '#4338CA',
    lightBgHex: '#EEF2FF',
    borderHex: '#C7D2FE',
    dotColor: '#6366F1',
    gradient: 'from-indigo-600 to-violet-600'
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Garden',
    subtitle: 'Frisch & Natürlich',
    description: 'Beruhigende Grüntöne für eine harmonische, entspannte Haushaltsorganisation.',
    primaryHex: '#059669',
    hoverHex: '#047857',
    lightBgHex: '#ECFDF5',
    borderHex: '#A7F3D0',
    dotColor: '#10B981',
    gradient: 'from-emerald-600 to-teal-600'
  },
  rose: {
    id: 'rose',
    name: 'Rose Sunset',
    subtitle: 'Warm & Lebendig',
    description: 'Sinnlich-warme Rosenholz- und Koralltöne für extra Energie und Spaß.',
    primaryHex: '#E11D48',
    hoverHex: '#BE123C',
    lightBgHex: '#FFF1F2',
    borderHex: '#FECDD3',
    dotColor: '#F43F5E',
    gradient: 'from-rose-600 to-pink-600'
  },
  amber: {
    id: 'amber',
    name: 'Amber Glow',
    subtitle: 'Sonnig & Gemütlich',
    description: 'Warme Bernstein- und Goldnuancen für ein freundliches, wohnliches Gefühl.',
    primaryHex: '#D97706',
    hoverHex: '#B45309',
    lightBgHex: '#FFFBEB',
    borderHex: '#FDE68A',
    dotColor: '#F59E0B',
    gradient: 'from-amber-600 to-orange-600'
  },
  bayern: {
    id: 'bayern',
    name: 'FC Bayern Matchday',
    subtitle: 'Rot-Weiß-Blau • Mia san mia',
    description: 'Exklusives Spieltags-Design für Fans des FC Bayern München in edlem Bayern-Rot, reinem Weiß und traditionellem Königsblau.',
    primaryHex: '#DC052D',
    hoverHex: '#B80024',
    lightBgHex: '#FFEBEF',
    borderHex: '#FFCCD5',
    dotColor: '#0066B2',
    gradient: 'from-[#DC052D] via-[#B80024] to-[#0066B2]'
  }
};

export interface PaletteScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export const THEME_SCALES: Record<ColorTheme, PaletteScale> = {
  indigo: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
    950: '#1E1B4B'
  },
  emerald: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
    950: '#022C22'
  },
  rose: {
    50: '#FFF1F2',
    100: '#FFE4E6',
    200: '#FECDD3',
    300: '#FDA4AF',
    400: '#FB7185',
    500: '#F43F5E',
    600: '#E11D48',
    700: '#BE123C',
    800: '#9F1239',
    900: '#881337',
    950: '#4C0519'
  },
  amber: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
    950: '#451A03'
  },
  bayern: {
    50: '#FFF0F2',
    100: '#FFE1E6',
    200: '#FFC7D1',
    300: '#FFA0B0',
    400: '#FF6B85',
    500: '#EF2346',
    600: '#DC052D',
    700: '#B80024',
    800: '#99021F',
    900: '#80051E',
    950: '#48000C'
  }
};

export function applyColorTheme(theme: ColorTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  const cfg = COLOR_THEMES[theme] || COLOR_THEMES.indigo;
  const scale = THEME_SCALES[theme] || THEME_SCALES.indigo;

  // Set primary semantic variables
  root.style.setProperty('--color-primary', cfg.primaryHex);
  root.style.setProperty('--color-primary-hover', cfg.hoverHex);
  root.style.setProperty('--color-primary-light', cfg.lightBgHex);
  root.style.setProperty('--color-primary-border', cfg.borderHex);
  root.style.setProperty('--color-primary-dot', cfg.dotColor);

  // Set Tailwind indigo-* color overrides so 100% of all UI elements adopt the chosen theme
  root.style.setProperty('--color-indigo-50', scale[50]);
  root.style.setProperty('--color-indigo-100', scale[100]);
  root.style.setProperty('--color-indigo-200', scale[200]);
  root.style.setProperty('--color-indigo-300', scale[300]);
  root.style.setProperty('--color-indigo-400', scale[400]);
  root.style.setProperty('--color-indigo-500', scale[500]);
  root.style.setProperty('--color-indigo-600', scale[600]);
  root.style.setProperty('--color-indigo-700', scale[700]);
  root.style.setProperty('--color-indigo-800', scale[800]);
  root.style.setProperty('--color-indigo-900', scale[900]);
  root.style.setProperty('--color-indigo-950', scale[950]);
}
