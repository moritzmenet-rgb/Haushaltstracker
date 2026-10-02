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
  isDynamic?: boolean;
}

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

/**
 * Converts HSL color values to a hex string.
 * h: 0-360, s: 0-100, l: 0-100
 */
export function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Returns a human-friendly poetic design name based on hue angle.
 */
function getPoeticNameForHue(hue: number): { name: string; subtitle: string } {
  const normalized = ((hue % 360) + 360) % 360;
  if (normalized < 25) return { name: 'Rubin-Morgen', subtitle: 'Kraftvoll & Belebend' };
  if (normalized < 50) return { name: 'Kupfer-Glanz', subtitle: 'Warm & Behaglich' };
  if (normalized < 85) return { name: 'Sonnen-Topas', subtitle: 'Goldig & Hell' };
  if (normalized < 145) return { name: 'Smaragd-Aura', subtitle: 'Harmonisch & Natürlich' };
  if (normalized < 175) return { name: 'Salbei-Breeze', subtitle: 'Frisch & Sanft' };
  if (normalized < 205) return { name: 'Nordlicht-Cyan', subtitle: 'Klar & Fokussiert' };
  if (normalized < 240) return { name: 'Saphir-Traum', subtitle: 'Elegant & Tiefgründig' };
  if (normalized < 275) return { name: 'Königs-Kobalt', subtitle: 'Klassisch & Erhaben' };
  if (normalized < 310) return { name: 'Amethyst-Dämmerung', subtitle: 'Magisch & Inspirierend' };
  if (normalized < 340) return { name: 'Orchideen-Fuchsia', subtitle: 'Lebendig & Stilvoll' };
  return { name: 'Korallen-Glut', subtitle: 'Feurig & Vital' };
}

/**
 * Deterministically generates a unique, gorgeous, and balanced daily theme based on current date.
 * Uses the Golden Ratio (137.5077°) hue distribution to guarantee maximum day-to-day variety.
 * Never produces the same look two days in a row!
 */
export function getDailyThemeData(targetDate?: Date): { config: ThemeConfig; scale: PaletteScale; formattedDate: string } {
  const d = targetDate || new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();

  // Day number since epoch to ensure every day in human history has a unique seed
  const dayNumber = Math.floor(Date.UTC(year, month - 1, day) / 86400000);

  // Golden ratio angle step (~137.5077 degrees) creates an optimal, non-repeating hue cycle
  const baseHue = Math.round((dayNumber * 137.507764) % 360);
  const saturation = 74;

  const primaryHex = hslToHex(baseHue, saturation, 50);
  const hoverHex = hslToHex(baseHue, saturation + 4, 42);
  const lightBgHex = hslToHex(baseHue, 60, 96);
  const borderHex = hslToHex(baseHue, 65, 84);
  const dotColor = hslToHex(baseHue, saturation, 56);

  const scale: PaletteScale = {
    50: hslToHex(baseHue, 70, 97),
    100: hslToHex(baseHue, 70, 93),
    200: hslToHex(baseHue, 68, 86),
    300: hslToHex(baseHue, 68, 76),
    400: hslToHex(baseHue, 70, 64),
    500: hslToHex(baseHue, saturation, 54),
    600: hslToHex(baseHue, saturation, 46),
    700: hslToHex(baseHue, saturation + 4, 38),
    800: hslToHex(baseHue, saturation + 6, 30),
    900: hslToHex(baseHue, saturation + 8, 22),
    950: hslToHex(baseHue, saturation + 10, 12),
  };

  const { name: poeticName, subtitle: poeticSubtitle } = getPoeticNameForHue(baseHue);
  const formattedDate = d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });

  const config: ThemeConfig = {
    id: 'daily',
    name: `Täglicher Zauber: ${poeticName}`,
    subtitle: `Heute (${formattedDate}) • Nie zweimal das Gleiche!`,
    description: `Jeden Tag ein neues, exklusiv generiertes Designer-Farbkonzept. Mathematisch harmonisch abgestimmt – morgen erwartet dich schon die nächste Überraschung!`,
    primaryHex,
    hoverHex,
    lightBgHex,
    borderHex,
    dotColor,
    gradient: `from-[${primaryHex}] to-[${scale[700]}]`,
    isDynamic: true,
  };

  return { config, scale, formattedDate };
}

// Pre-computed static theme configurations
export const COLOR_THEMES: Record<ColorTheme, ThemeConfig> = {
  // --- 1. TÄGLICH WECHSELND (Dynamic Chameleon) ---
  daily: getDailyThemeData().config,

  // --- 2. CYBERPUNK NEON (Neu) ---
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    subtitle: 'Elektrisierend & Modern',
    description: 'Leuchtendes Cyber-Cyan mit pulsierenden Neon-Akzenten für ein futuristisches, stylishes Interface.',
    primaryHex: '#06B6D4',
    hoverHex: '#0891B2',
    lightBgHex: '#ECFEFF',
    borderHex: '#A5F3FC',
    dotColor: '#22D3EE',
    gradient: 'from-cyan-500 to-indigo-600'
  },

  // --- 3. SUNSET HORIZON (Neu) ---
  sunset: {
    id: 'sunset',
    name: 'Sunset Horizon',
    subtitle: 'Terracotta & Abendgold',
    description: 'Warme toskanische Abendsonne, Kupfer und Terrakotta für pure Gemütlichkeit und Motivation.',
    primaryHex: '#EA580C',
    hoverHex: '#C2410C',
    lightBgHex: '#FFF7ED',
    borderHex: '#FED7AA',
    dotColor: '#F97316',
    gradient: 'from-orange-600 to-amber-600'
  },

  // --- 4. NORDIC PINE (Neu) ---
  forest: {
    id: 'forest',
    name: 'Nordic Pine',
    subtitle: 'Salbei & Waldkiefer',
    description: 'Tiefes, beruhigendes Nordwald-Grün mit frischen Salbeinuancen – maximal augenfreundlich.',
    primaryHex: '#0F766E',
    hoverHex: '#115E59',
    lightBgHex: '#F0FDFA',
    borderHex: '#99F6E4',
    dotColor: '#14B8A6',
    gradient: 'from-teal-700 to-emerald-700'
  },

  // --- 5. INDIGO MODERN (Klassiker) ---
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

  // --- 6. EMERALD GARDEN ---
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

  // --- 7. ROSE SUNSET ---
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

  // --- 8. AMBER GLOW ---
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
  }
};

export const THEME_SCALES: Record<ColorTheme, PaletteScale> = {
  daily: getDailyThemeData().scale,
  cyberpunk: {
    50: '#ECFEFF',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#22D3EE',
    500: '#06B6D4',
    600: '#0891B2',
    700: '#0E7490',
    800: '#155E75',
    900: '#164E63',
    950: '#083344'
  },
  sunset: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
    950: '#431407'
  },
  forest: {
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6',
    600: '#0D9488',
    700: '#0F766E',
    800: '#115E59',
    900: '#134E4A',
    950: '#042F2E'
  },
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
  }
};

export function applyColorTheme(theme: ColorTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  const isDark = root.classList.contains('dark');

  let cfg: ThemeConfig;
  let scale: PaletteScale;

  if (theme === 'daily') {
    const daily = getDailyThemeData();
    cfg = daily.config;
    scale = daily.scale;
  } else {
    cfg = COLOR_THEMES[theme] || COLOR_THEMES.indigo;
    scale = THEME_SCALES[theme] || THEME_SCALES.indigo;
  }

  // Determine primary tokens based on light/dark mode
  const primaryColor = isDark ? scale[300] : (cfg.primaryHex || scale[600]);
  const primaryHover = isDark ? scale[200] : (cfg.hoverHex || scale[700]);
  const primaryContainer = isDark ? scale[800] : scale[100];
  const onPrimary = isDark ? scale[950] : '#FFFFFF';
  const onPrimaryContainer = isDark ? scale[100] : scale[900];
  const secondaryContainer = isDark ? scale[900] : scale[200];
  const onSecondaryContainer = isDark ? scale[200] : scale[950];

  // Set Material 3 CSS variables
  root.style.setProperty('--m3-primary', primaryColor);
  root.style.setProperty('--m3-primary-hover', primaryHover);
  root.style.setProperty('--m3-primary-container', primaryContainer);
  root.style.setProperty('--m3-on-primary', onPrimary);
  root.style.setProperty('--m3-on-primary-container', onPrimaryContainer);
  root.style.setProperty('--m3-secondary-container', secondaryContainer);
  root.style.setProperty('--m3-on-secondary-container', onSecondaryContainer);

  // Set primary semantic variables
  root.style.setProperty('--color-primary', primaryColor);
  root.style.setProperty('--color-primary-hover', primaryHover);
  root.style.setProperty('--color-primary-light', isDark ? `rgba(255,255,255,0.08)` : cfg.lightBgHex);
  root.style.setProperty('--color-primary-border', cfg.borderHex);
  root.style.setProperty('--color-primary-dot', cfg.dotColor);

  // Set Tailwind indigo-* color overrides so 100% of UI elements adopt the theme
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
