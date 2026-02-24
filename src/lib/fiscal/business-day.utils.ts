/**
 * Utilitaires pour le calcul des jours ouvrés en France.
 *
 * Gère les jours fériés FIXES uniquement.
 * Les fêtes mobiles (Pâques, Ascension, Pentecôte, Lundi de Pâques)
 * ne sont pas incluses pour éviter une dépendance externe.
 * Elles peuvent être ajoutées via la fonction `addMobileHolidays`.
 *
 * Toutes les fonctions sont pures (sans effets de bord).
 */

// ─── Jours fériés fixes ───────────────────────────────────────────────────────

/**
 * Jours fériés français fixes au format [mois (1-12), jour].
 * Source : art. L. 3133-1 Code du travail.
 */
const FIXED_HOLIDAYS_FR: ReadonlyArray<readonly [number, number]> = [
  [1, 1], // Jour de l'An
  [5, 1], // Fête du Travail — TOUJOURS férié, donc le 1er mai n'est JAMAIS un jour ouvré
  [5, 8], // Victoire 1945
  [7, 14], // Fête Nationale
  [8, 15], // Assomption
  [11, 1], // Toussaint
  [11, 11], // Armistice
  [12, 25], // Noël
] as const;

// ─── Fonctions de base ────────────────────────────────────────────────────────

/**
 * Vérifie si une date est un jour férié fixe en France.
 */
export function isFrenchPublicHoliday(date: Date): boolean {
  const m = date.getMonth() + 1; // getMonth() retourne 0-11
  const d = date.getDate();
  return FIXED_HOLIDAYS_FR.some(([hm, hd]) => hm === m && hd === d);
}

/**
 * Vérifie si une date tombe un week-end (samedi ou dimanche).
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay(); // 0 = dimanche, 6 = samedi
  return day === 0 || day === 6;
}

/**
 * Vérifie si une date est un jour ouvré
 * (ni week-end, ni jour férié fixe français).
 */
export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date) && !isFrenchPublicHoliday(date);
}

// ─── Navigation ───────────────────────────────────────────────────────────────

/**
 * Retourne le prochain jour ouvré APRÈS la date donnée.
 * La date elle-même n'est pas comptée.
 */
export function nextBusinessDay(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  while (!isBusinessDay(d)) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

/**
 * Si la date est un jour ouvré, la retourne telle quelle.
 * Sinon, retourne le prochain jour ouvré.
 */
export function adjustToBusinessDay(date: Date): Date {
  if (isBusinessDay(date)) return new Date(date);
  return nextBusinessDay(date);
}

/**
 * Retourne le Nème jour ouvré d'un mois donné.
 *
 * @param year  Année (ex : 2027)
 * @param month Mois 1-12 (ex : 5 pour mai)
 * @param n     Rang : 1 = premier, 2 = deuxième, etc.
 *
 * Exemple : nthBusinessDayOfMonth(2027, 5, 2)
 *   → Le 1er mai est férié (Fête du Travail), jamais ouvré.
 *   → Le 2ème jour ouvré de mai 2027 sera le 3 mai (si lun-ven et non férié).
 */
export function nthBusinessDayOfMonth(
  year: number,
  month: number,
  n: number
): Date {
  if (n < 1) throw new RangeError("n doit être ≥ 1");

  const d = new Date(year, month - 1, 1); // Premier jour du mois
  let count = 0;

  while (true) {
    // Guard : ne pas dépasser le mois demandé
    if (d.getMonth() + 1 !== month) {
      throw new Error(
        `Impossible de trouver le ${n}ème jour ouvré du mois ${month}/${year}`
      );
    }

    if (isBusinessDay(d)) {
      count++;
      if (count === n) return new Date(d);
    }

    d.setDate(d.getDate() + 1);
  }
}

/**
 * Retourne le Nème jour ouvré APRÈS une date donnée.
 * (La date elle-même n'est pas comptée.)
 *
 * @param date Date de départ
 * @param n    Nombre de jours ouvrés à sauter (ex : 2 → 2ème jour ouvré après)
 */
export function nthBusinessDayAfter(date: Date, n: number): Date {
  let d = new Date(date);
  for (let i = 0; i < n; i++) {
    d = nextBusinessDay(d);
  }
  return d;
}
