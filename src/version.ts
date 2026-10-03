/**
 * Fish & Wish Central Version and Release Changelog System
 * Whenever this file is bumped, every account in the household automatically
 * receives the "Was ist neu?" announcement upon their first visit!
 */

export const CURRENT_VERSION = '2.6.0';
export const RELEASE_DATE = 'Oktober 2026';
export const RELEASE_NAME = 'Großes Familien-Update: Pinnwand, Menüplaner & Zentrale';

export interface ReleaseFeature {
  title: string;
  description: string;
  iconName: 'sparkles' | 'sliders' | 'bell' | 'tag' | 'award' | 'pin' | 'shield' | 'zap' | 'utensils' | 'compass' | 'book';
  badge?: string;
  category: 'Neu' | 'Verbessert' | 'Behoben';
}

export interface ReleaseLog {
  version: string;
  title: string;
  subtitle: string;
  date: string;
  isLatest?: boolean;
  highlights: string[];
  features: ReleaseFeature[];
}

export const VERSION_HISTORY: ReleaseLog[] = [
  {
    version: '2.6.0',
    title: 'Was ist neu in Version 2.6.0?',
    subtitle: 'Familien-Pinnwand, Menüplanung, neue Zentrale & automatisches Tutorial! 🎉',
    date: '3. Oktober 2026',
    isLatest: true,
    highlights: [
      '📌 Interaktive Pinnwand mit Notizen, bunten Fäden & Abstimmungen',
      '🍽️ Neuer Menüplaner mit Wochen-Speiseplan & Einkaufslisten-Export',
      '🧭 Neue Familien-Zentrale über das F&W Logo mit Liquid-Glass-Design',
      '🎓 Automatisches Mini-Tutorial beim ersten Start jedes Accounts'
    ],
    features: [
      {
        title: '📌 Interaktive Familien-Pinnwand',
        description: 'Heftet farbige Post-its an, erstellt schnelle Umfragen, reagiert mit Emojis und verbindet thematisch passende Notizen mit roten Fäden – alles in Echtzeit für die ganze Familie synchronisiert.',
        iconName: 'pin',
        badge: 'Neu',
        category: 'Neu'
      },
      {
        title: '🍽️ Wochen-Menüplaner & Rezepte',
        description: 'Nie wieder die Frage "Was kochen wir heute?": Plant Mahlzeiten für Mittag- und Abendessen, sammelt Rezeptideen mit Upvotes und übertragt Zutaten mit 1-Klick als Einkaufszettel direkt auf die Pinnwand!',
        iconName: 'utensils',
        badge: 'Neu',
        category: 'Neu'
      },
      {
        title: '🧭 Neue Familien-Zentrale (App Hub)',
        description: 'Klickt einfach oben auf das F&W App-Logo, um blitzschnell zwischen Aufgaben (Fish & Wish), Pinnwand und Menüplaner zu wechseln. Der Hub erstrahlt im eleganten Liquid-Glassmorphism der mobilen Button Bar.',
        iconName: 'compass',
        badge: 'Design',
        category: 'Neu'
      },
      {
        title: '🎓 Automatisches Mini-Tutorial für neue Profile',
        description: 'Jedes Haushaltsmitglied erhält beim ersten Einloggen ein interaktives Mini-Tutorial, das Schritt für Schritt zeigt, wie Punkte gesammelt werden und wie man sofort zu Pinnwand und Menüplaner gelangt.',
        iconName: 'book',
        badge: 'Onboarding',
        category: 'Neu'
      },
      {
        title: '⚡ Optimierte Cloud-Synchronisation',
        description: 'Echtzeit-Synchronisierung von Notizen, Speiseplänen und Aufgaben für alle Haushaltsmitglieder mit nahtloser Offline-Unterstützung.',
        iconName: 'zap',
        badge: 'System',
        category: 'Verbessert'
      }
    ]
  },
  {
    version: '2.5.0',
    title: 'Version 2.5.0: Verspielte Animationen & Auto-Erkennung',
    subtitle: 'Liebevolle Animationen, automatische Update-Erkennung & fehlerfreie Sterne-Einstellungen! ✨',
    date: '27. September 2026',
    highlights: [
      'Automatische Erkennung neuer Updates für jeden Account einzeln',
      'Behebung des Synchronisationsfehlers bei Sternen & Punkten im Admin-Bereich',
      'Aktuelle Versionsanzeige mit Sofortklick im Footer & mobilen Menü',
      'Verspielte & hochwertige Animationen (Konfetti, Bounces, schwebende Punkte-Münzen)'
    ],
    features: [
      {
        title: 'Sterne- & Punkteanpassung synchronisiert fehlerfrei',
        description: 'Beim Verschieben der Multiplikator-Regler in den Admin-Einstellungen gibt es keinen Synchronisationsfehler mehr. Dank intelligentem Debouncing und optimierter Cloud-Regeln speichern deine Werte blitzschnell und stabil.',
        iconName: 'sliders',
        badge: 'Behoben',
        category: 'Behoben'
      },
      {
        title: 'Automatische Erkennung: Was ist neu?',
        description: 'Jedes Haushaltsmitglied erfährt beim ersten Öffnen nach einem Update automatisch, welche tollen Neuerungen es gibt. Der Status wird pro Account gespeichert – so verpasst niemand etwas!',
        iconName: 'bell',
        badge: 'Neu',
        category: 'Neu'
      },
      {
        title: 'Aktuelle Version immer im Blick',
        description: 'Unten im Footer und in den Einstellungen siehst du nun immer die aktive Version. Ein Klick darauf öffnet jederzeit diese praktische Übersicht mit allen vergangenen Updates.',
        iconName: 'tag',
        badge: 'Neu',
        category: 'Neu'
      },
      {
        title: 'Liebevolle, verspielte Animationen',
        description: 'Erlebe ein noch lebendigeres Gefühl mit bunten Konfetti-Regen bei erreichten Zielen, schwebenden Münzen, geschmeidigen Wackeleffekten auf Buttons und sanft federnden Karten.',
        iconName: 'sparkles',
        badge: 'Design',
        category: 'Neu'
      },
      {
        title: 'Glanzvoller Wochenziel-Balken',
        description: 'Erreicht ein Mitglied 100% seines Wochenziels, erstrahlt der Fortschrittsbalken mit einem festlichen Schimmer und belohnt den Fleiß mit extra Freude!',
        iconName: 'award',
        badge: 'Gamification',
        category: 'Verbessert'
      }
    ]
  },
  {
    version: '2.4.0',
    title: 'Version 2.4.0: Roll-Over & Pinnwand-Threads',
    subtitle: 'Automatischer Wochen-Reset, Übertrag ins neue Ziel und interaktive Familien-Pinnwand.',
    date: 'September 2026',
    highlights: [
      'Dynamischer Roll-Over Überschuss/Defizit Rechner',
      'Familien-Pinnwand mit Post-its, Fäden und Abstimmungen',
      'Automatische Reset-Planung zu Wunschzeiten'
    ],
    features: [
      {
        title: 'Dynamischer Roll-Over Rechner',
        description: 'Punkte-Überschuss oder Defizit werden prozentual in das nächste Wochenziel übernommen.',
        iconName: 'zap',
        badge: 'Funktion',
        category: 'Neu'
      },
      {
        title: 'Familien-Pinnwand 2.0',
        description: 'Hänge Zettel auf, erstelle Umfragen und antworte in bunten Threads auf andere Notizen.',
        iconName: 'pin',
        badge: 'Pinnwand',
        category: 'Neu'
      }
    ]
  }
];

export function getLatestRelease(): ReleaseLog {
  return VERSION_HISTORY[0];
}

export function hasSeenCurrentVersion(lastSeenVersion: string | null | undefined): boolean {
  if (!lastSeenVersion) return false;
  return lastSeenVersion === CURRENT_VERSION;
}
