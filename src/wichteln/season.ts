/**
 * A Wichtel season runs from October to the end of September of the next year,
 * named after the Christmas it belongs to ("2026"). A new season therefore starts
 * automatically every October with empty lists; nothing has to be deleted.
 */
export function currentSeason(now: Date = new Date()): string {
  const year = now.getFullYear();
  return String(now.getMonth() >= 9 ? year : year - 1);
}

/** Whole days until 24 December of the current season (0 on the day itself, negative after). */
export function daysUntilChristmasEve(now: Date = new Date()): number {
  const season = Number(currentSeason(now));
  const eve = new Date(season, 11, 24);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((eve.getTime() - today.getTime()) / 86_400_000);
}

export function countdownText(now: Date = new Date()): string {
  const days = daysUntilChristmasEve(now);
  if (days > 1) return `Noch ${days} Tage bis Weihnachten`;
  if (days === 1) return 'Morgen ist Heiligabend';
  if (days === 0) return 'Heute ist Heiligabend';
  return 'Frohe Weihnachten';
}
