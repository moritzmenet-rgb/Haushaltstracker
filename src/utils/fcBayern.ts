export interface BayernMatch {
  date: string; // YYYY-MM-DD
  time: string; // e.g. "18:30" or "20:45"
  opponent: string;
  competition: 'Bundesliga' | 'Champions League' | 'DFB-Pokal' | 'Testspiel';
  isHome: boolean;
  location: string;
}

// Sample and actual calendar fixtures for FC Bayern München (Bundesliga / UCL / DFB-Pokal)
export const BAYERN_FIXTURES: BayernMatch[] = [
  // 2024 / 2025 / 2026 fixtures
  { date: '2025-01-18', time: '15:30', opponent: 'VfL Wolfsburg', competition: 'Bundesliga', isHome: true, location: 'Allianz Arena' },
  { date: '2025-01-22', time: '21:00', opponent: 'Feyenoord Rotterdam', competition: 'Champions League', isHome: false, location: 'De Kuip' },
  { date: '2025-01-25', time: '15:30', opponent: 'SC Freiburg', competition: 'Bundesliga', isHome: false, location: 'Europa-Park Stadion' },
  { date: '2025-01-29', time: '21:00', opponent: 'Slovan Bratislava', competition: 'Champions League', isHome: true, location: 'Allianz Arena' },
  { date: '2025-02-01', time: '18:30', opponent: 'Holstein Kiel', competition: 'Bundesliga', isHome: true, location: 'Allianz Arena' },
  { date: '2025-02-08', time: '15:30', opponent: 'SV Werder Bremen', competition: 'Bundesliga', isHome: false, location: 'Weserstadion' },
  { date: '2025-02-15', time: '18:30', opponent: 'Bayer 04 Leverkusen', competition: 'Bundesliga', isHome: false, location: 'BayArena' },
  { date: '2025-02-22', time: '15:30', opponent: 'Eintracht Frankfurt', competition: 'Bundesliga', isHome: true, location: 'Allianz Arena' },
  { date: '2025-03-01', time: '18:30', opponent: 'VfB Stuttgart', competition: 'Bundesliga', isHome: false, location: 'MHP Arena' },
  { date: '2025-03-08', time: '15:30', opponent: 'VfL Bochum', competition: 'Bundesliga', isHome: true, location: 'Allianz Arena' },
  { date: '2025-03-15', time: '15:30', opponent: '1. FC Union Berlin', competition: 'Bundesliga', isHome: false, location: 'An der Alten Försterei' },
  { date: '2025-03-29', time: '18:30', opponent: 'FC St. Pauli', competition: 'Bundesliga', isHome: true, location: 'Allianz Arena' },
  { date: '2025-04-05', time: '15:30', opponent: 'FC Augsburg', competition: 'Bundesliga', isHome: false, location: 'WWK Arena' },
  { date: '2025-04-12', time: '18:30', opponent: 'Borussia Dortmund', competition: 'Bundesliga', isHome: true, location: 'Allianz Arena (Der Klassiker)' },
  { date: '2025-04-19', time: '15:30', opponent: '1. FSV Mainz 05', competition: 'Bundesliga', isHome: false, location: 'Mewa Arena' },
  { date: '2025-04-26', time: '15:30', opponent: 'RB Leipzig', competition: 'Bundesliga', isHome: true, location: 'Allianz Arena' },
  { date: '2025-05-03', time: '15:30', opponent: 'Borussia Mönchengladbach', competition: 'Bundesliga', isHome: false, location: 'Borussia-Park' },
  { date: '2025-05-10', time: '15:30', opponent: 'TSG Hoffenheim', competition: 'Bundesliga', isHome: true, location: 'Allianz Arena' },
  { date: '2025-05-17', time: '15:30', opponent: '1. FC Heidenheim', competition: 'Bundesliga', isHome: false, location: 'Voith-Arena' },
  // 2026/2027 Season & Continuous Matchdays
  { date: '2026-09-19', time: '15:30', opponent: 'Borussia Dortmund', competition: 'Bundesliga', isHome: true, location: 'Allianz Arena' },
  { date: '2026-09-22', time: '21:00', opponent: 'Real Madrid', competition: 'Champions League', isHome: true, location: 'Allianz Arena' },
  { date: '2026-09-26', time: '18:30', opponent: 'Bayer Leverkusen', competition: 'Bundesliga', isHome: false, location: 'BayArena' },
  { date: '2026-10-03', time: '15:30', opponent: 'Eintracht Frankfurt', competition: 'Bundesliga', isHome: true, location: 'Allianz Arena' },
  { date: '2026-10-21', time: '21:00', opponent: 'Arsenal FC', competition: 'Champions League', isHome: false, location: 'Emirates Stadium' }
];

export function getTodayISODate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns whether today is a scheduled matchday for FC Bayern München
 */
export function checkIsBayernMatchdayToday(): { isMatchday: boolean; match?: BayernMatch } {
  const today = getTodayISODate();
  const match = BAYERN_FIXTURES.find(f => f.date === today);

  if (match) {
    return { isMatchday: true, match };
  }

  return { isMatchday: false };
}

/**
 * Returns the next upcoming match (today or in future)
 */
export function getNextBayernMatch(): BayernMatch {
  const today = getTodayISODate();
  const future = BAYERN_FIXTURES.filter(f => f.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  
  if (future.length > 0) {
    return future[0];
  }

  // Fallback match info
  return {
    date: today,
    time: '18:30',
    opponent: 'Borussia Dortmund',
    competition: 'Bundesliga',
    isHome: true,
    location: 'Allianz Arena'
  };
}

/**
 * Formats match date nicely for German UI (e.g. "Samstag, 12.04.2025")
 */
export function formatMatchDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('de-DE', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  } catch {
    // fallback
  }
  return dateStr;
}
