/**
 * Moteur de génération des obligations fiscales — Régime réel simplifié TVA.
 *
 * Ce module est PURE : aucun accès base de données, aucun effet de bord.
 * Toutes les fonctions sont testables unitairement.
 *
 * ─── Règles implémentées ────────────────────────────────────────────────────
 *
 * [TVA — Réel simplifié] (art. 287 III CGI — BOFiP TVA-DECLA-20-20)
 *
 *   Première année d'activité (création → première clôture) :
 *   └─ Pas d'acomptes (aucune TVA N-1 de référence)
 *   └─ Pas de CA12 pendant l'année (déposée en mai N+1)
 *
 *   Années suivantes :
 *   ├─ Mai N+1    : CA12 — déclaration annuelle pour exercice N
 *   │               (2ème jour ouvré de mai, le 1er mai étant toujours férié)
 *   ├─ 15 juillet : Acompte 1 = 55 % × TVA nette exercice N-1
 *   └─ 15 déc.    : Acompte 2 = 40 % × TVA nette exercice N-1
 *                   (ajustés au jour ouvré suivant si week-end/férié)
 *
 * [CFE — Cotisation Foncière des Entreprises] (art. 1478 CGI)
 *   └─ Exonération totale la première année civile de création
 *   └─ Paiement ≤ 15 décembre des années suivantes
 *
 * [Liasse fiscale] (art. 223 CGI)
 *   └─ Clôture 31/12 → dépôt 2ème jour ouvré de mai N+1
 *      (même délai que CA12 pour les exercices calés sur l'année civile)
 *
 * ─── Extensibilité ─────────────────────────────────────────────────────────
 *   Pour ajouter un régime (ex : réel normal → CA3 mensuelle), créer une
 *   fonction `generateTvaReelNormal(year, config, warnings)` et l'appeler
 *   dans le switch de `generateObligations()`.
 */

import type {
  CompanyConfig,
  Obligation,
  ObligationType,
  GenerateObligationsResult,
} from "./obligation.types";
import {
  adjustToBusinessDay,
  nthBusinessDayOfMonth,
} from "./business-day.utils";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Part de TVA N-1 exigée au 15 juillet (art. 287 III CGI) */
const TVA_ACOMPTE_JUILLET_RATE = 0.55; // 55 %

/** Part de TVA N-1 exigée au 15 décembre (art. 287 III CGI) */
const TVA_ACOMPTE_DECEMBRE_RATE = 0.4; // 40 %

/** Nombre de jours avant l'échéance pour déclencher l'alerte */
const WARNING_DAYS_BEFORE = 30;

// ─── Helpers internes ────────────────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function makeId(): string {
  // crypto.randomUUID() disponible Node ≥ 14.17 et tous navigateurs modernes
  return crypto.randomUUID();
}

/**
 * Construit une Obligation avec les champs calculés (id, warningDate, status=pending).
 */
function makeObligation(
  partial: Omit<Obligation, "id" | "warningDate" | "status"> &
    Partial<Pick<Obligation, "status">>
): Obligation {
  return {
    id: makeId(),
    status: "pending",
    warningDate: addDays(partial.dueDate, -WARNING_DAYS_BEFORE),
    ...partial,
  };
}

// ─── Dates fiscales ───────────────────────────────────────────────────────────

/**
 * Date limite de dépôt CA12 pour un exercice clos au 31/12.
 * Régl. : 2ème jour ouvré de mai (le 1er mai est toujours férié).
 */
function getCA12DueDate(year: number): Date {
  return nthBusinessDayOfMonth(year, 5, 2);
}

/**
 * Date limite de dépôt de la liasse fiscale pour un exercice clos au 31/12.
 * En pratique identique à CA12 pour les exercices calés sur l'année civile.
 */
function getLiasseDueDate(year: number): Date {
  return nthBusinessDayOfMonth(year, 5, 2);
}

// ─── Prédicats métier ─────────────────────────────────────────────────────────

/**
 * Vrai si `fiscalYear` est le premier exercice (entre création et première clôture).
 */
function isFirstFiscalYear(fiscalYear: number, config: CompanyConfig): boolean {
  return fiscalYear === config.firstClosingDate.getFullYear();
}

/**
 * Vrai si `calendarYear` est la première année civile de l'entité.
 * Utilisé pour l'exonération CFE (art. 1478 CGI).
 */
function isFirstCalendarYear(
  calendarYear: number,
  config: CompanyConfig
): boolean {
  return calendarYear === config.creationDate.getFullYear();
}

// ─── Générateurs par type ────────────────────────────────────────────────────

/**
 * Génère les obligations TVA réel simplifié dues pendant `year`.
 *
 * Schéma temporel (exemple : création mars 2026, clôture 31/12/2026) :
 *
 *  Année 2026 : RIEN (première année, pas d'acomptes, CA12 non encore due)
 *
 *  Année 2027 :
 *    ├─ Mai 2027    → CA12 exercice 2026 (isFirstYear = true)
 *    ├─ 15 juil 27 → Acompte 55 % × TVA(2026)
 *    └─ 15 déc 27  → Acompte 40 % × TVA(2026)
 *
 *  Année 2028 :
 *    ├─ Mai 2028    → CA12 exercice 2027
 *    ├─ 15 juil 28 → Acompte 55 % × TVA(2027)
 *    └─ 15 déc 28  → Acompte 40 % × TVA(2027)
 */
function generateTvaReelSimplifie(
  year: number,
  config: CompanyConfig,
  warnings: string[]
): Obligation[] {
  const obligations: Obligation[] = [];
  const creationYear = config.creationDate.getFullYear();

  // ── CA12 : déposée en mai `year` pour exercice `year - 1` ────────────────
  const prevFiscalYear = year - 1;

  if (prevFiscalYear >= creationYear) {
    const isFirst = isFirstFiscalYear(prevFiscalYear, config);

    obligations.push(
      makeObligation({
        obligationKey: `TVA_CA12_${year}`,
        type: "TVA_CA12",
        label: isFirst
          ? `CA12 — Première déclaration annuelle (exercice ${prevFiscalYear})`
          : `CA12 — Déclaration annuelle TVA (exercice ${prevFiscalYear})`,
        description:
          `Déclaration annuelle de TVA (formulaire CA12) pour l'exercice clos le ` +
          `31/12/${prevFiscalYear}. ` +
          (isFirst
            ? `Première déclaration suite à la création — aucun acompte n'a été versé en ${prevFiscalYear}. `
            : `Solde = TVA annuelle ${prevFiscalYear} − acomptes versés (55 % + 40 %). `) +
          `Dépôt en ligne obligatoire.`,
        dueDate: getCA12DueDate(year),
        fiscalYear: prevFiscalYear,
        calendarYear: year,
        recurring: true,
        isFirstYear: isFirst,
        tags: ["TVA", "CA12", "annuel"],
        legalReference: "Art. 287 III CGI — BOFiP TVA-DECLA-20-20",
      })
    );
  }

  // ── Acomptes : versés en juillet et décembre de `year` ───────────────────
  // Règle : PAS d'acomptes la première année d'activité
  // (isFirstFiscalYear(year) = true quand year = première clôture)
  const isFirstYear = isFirstFiscalYear(year, config);
  const isBeforeCreation = year < creationYear;

  if (!isFirstYear && !isBeforeCreation) {
    const baseTva = config.tvaByFiscalYear?.[year - 1];

    if (baseTva === undefined) {
      warnings.push(
        `TVA nette de l'exercice ${year - 1} non renseignée — ` +
          `montants des acomptes ${year} non calculables. ` +
          `Renseigner tvaByFiscalYear[${year - 1}] dans la configuration.`
      );
    }

    // Acompte juillet (55 %) — art. 287 III CGI
    const julyDate = adjustToBusinessDay(new Date(year, 6, 15)); // 15 juillet
    obligations.push(
      makeObligation({
        obligationKey: `TVA_ACOMPTE_JUILLET_${year}`,
        type: "TVA_ACOMPTE",
        label: `Acompte TVA — Juillet ${year} (55 %)`,
        description:
          `Premier acompte TVA réel simplifié : 55 % de la TVA nette de l'exercice ${year - 1}. ` +
          `Versement au plus tard le 15 juillet ${year} (ou jour ouvré suivant). ` +
          `Art. 287 III CGI.`,
        dueDate: julyDate,
        fiscalYear: year,
        calendarYear: year,
        recurring: true,
        isFirstYear: false,
        amount:
          baseTva !== undefined
            ? Math.round(baseTva * TVA_ACOMPTE_JUILLET_RATE * 100) / 100
            : undefined,
        tags: ["TVA", "acompte", "juillet"],
        legalReference: "Art. 287 III CGI",
      })
    );

    // Acompte décembre (40 %) — art. 287 III CGI
    const decDate = adjustToBusinessDay(new Date(year, 11, 15)); // 15 décembre
    obligations.push(
      makeObligation({
        obligationKey: `TVA_ACOMPTE_DECEMBRE_${year}`,
        type: "TVA_ACOMPTE",
        label: `Acompte TVA — Décembre ${year} (40 %)`,
        description:
          `Deuxième acompte TVA réel simplifié : 40 % de la TVA nette de l'exercice ${year - 1}. ` +
          `Versement au plus tard le 15 décembre ${year} (ou jour ouvré suivant). ` +
          `Art. 287 III CGI.`,
        dueDate: decDate,
        fiscalYear: year,
        calendarYear: year,
        recurring: true,
        isFirstYear: false,
        amount:
          baseTva !== undefined
            ? Math.round(baseTva * TVA_ACOMPTE_DECEMBRE_RATE * 100) / 100
            : undefined,
        tags: ["TVA", "acompte", "décembre"],
        legalReference: "Art. 287 III CGI",
      })
    );
  }

  return obligations;
}

/**
 * Génère l'obligation de dépôt de la liasse fiscale.
 *
 * Pour un exercice clos au 31/12, la liasse est déposée en mai N+1
 * (2ème jour ouvré de mai, délai identique à CA12).
 */
function generateLiasse(year: number, config: CompanyConfig): Obligation[] {
  const creationYear = config.creationDate.getFullYear();
  const prevFiscalYear = year - 1;

  if (prevFiscalYear < creationYear) return [];

  const isFirst = isFirstFiscalYear(prevFiscalYear, config);

  return [
    makeObligation({
      obligationKey: `LIASSE_${year}`,
      type: "LIASSE",
      label: isFirst
        ? `Liasse fiscale — Première clôture (exercice ${prevFiscalYear})`
        : `Liasse fiscale (exercice ${prevFiscalYear})`,
      description:
        `Dépôt de la liasse fiscale pour l'exercice clos le 31/12/${prevFiscalYear}. ` +
        `Délai légal : 2ème jour ouvré de mai. Dépôt EDI (télétransmission) obligatoire ` +
        `pour les entités soumises à l'IS. Formulaire 2065 + annexes.`,
      dueDate: getLiasseDueDate(year),
      fiscalYear: prevFiscalYear,
      calendarYear: year,
      recurring: true,
      isFirstYear: isFirst,
      tags: ["liasse", "IS", "annuel", "comptabilité"],
      legalReference: "Art. 223 CGI — Formulaire DGFiP 2065",
    }),
  ];
}

/**
 * Génère l'obligation CFE.
 *
 * Art. 1478 CGI : exonération totale la première année civile de création.
 * Paiement ≤ 15 décembre des années suivantes.
 */
function generateCfe(year: number, config: CompanyConfig): Obligation[] {
  // Exonération première année civile
  if (isFirstCalendarYear(year, config)) return [];

  const creationYear = config.creationDate.getFullYear();
  const isFirstTimeDue = year === creationYear + 1;

  const cfeDate = adjustToBusinessDay(new Date(year, 11, 15)); // 15 décembre

  return [
    makeObligation({
      obligationKey: `CFE_${year}`,
      type: "CFE",
      label: `CFE — Cotisation Foncière des Entreprises ${year}`,
      description:
        `Paiement de la CFE au plus tard le 15 décembre ${year}. ` +
        (isFirstTimeDue
          ? `Première CFE due (exonération accordée en ${creationYear}, première année civile — art. 1478 CGI). `
          : "") +
        `Montant fixé par avis d'imposition de la commune (reçu en novembre). ` +
        `Paiement obligatoirement en ligne via impots.gouv.fr.`,
      dueDate: cfeDate,
      fiscalYear: year,
      calendarYear: year,
      recurring: true,
      isFirstYear: isFirstTimeDue,
      amount: config.cfeEstimatedAmount,
      tags: ["CFE", "impôts locaux", "décembre"],
      legalReference: "Art. 1447 et 1478 CGI",
    }),
  ];
}

// ─── API publique ─────────────────────────────────────────────────────────────

/**
 * Génère toutes les obligations fiscales DUEs pendant une année civile donnée.
 *
 * @param year   Année civile (ex : 2027)
 * @param config Configuration de l'entité
 * @returns      Obligations triées par date d'échéance + warnings
 *
 * @example
 * // GIE créé en 2026, clôture 31/12/2026, réel simplifié
 * const config: CompanyConfig = {
 *   creationDate: new Date("2026-01-01"),
 *   firstClosingDate: new Date("2026-12-31"),
 *   closingMonth: 12, closingDay: 31,
 *   tvaRegime: "reel_simplifie",
 *   urssafEnabled: false,
 *   tvaByFiscalYear: { 2026: 12000 },
 *   cfeEstimatedAmount: 800,
 * }
 *
 * generateObligations(2026, config) // → 0 obligation (première année)
 * generateObligations(2027, config) // → 5 obligations : CA12, 2 acomptes, liasse, CFE
 */
export function generateObligations(
  year: number,
  config: CompanyConfig
): GenerateObligationsResult {
  const warnings: string[] = [];
  const obligations: Obligation[] = [];

  // TVA
  switch (config.tvaRegime) {
    case "reel_simplifie":
      obligations.push(...generateTvaReelSimplifie(year, config, warnings));
      break;
    case "reel_normal":
      // TODO : CA3 mensuelle ou trimestrielle
      warnings.push(
        "Régime réel normal non encore implémenté — ajouter generateTvaReelNormal()."
      );
      break;
    case "franchise_base":
      // Pas de TVA à déclarer
      break;
  }

  // Liasse fiscale
  obligations.push(...generateLiasse(year, config));

  // CFE
  obligations.push(...generateCfe(year, config));

  // URSSAF (si activé — à implémenter selon type de structure juridique)
  if (config.urssafEnabled) {
    warnings.push(
      "Module URSSAF activé mais non encore implémenté — à compléter selon la structure juridique."
    );
  }

  // Tri chronologique
  obligations.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  // Mise à jour des statuts overdue
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const o of obligations) {
    if (o.status === "pending" && o.dueDate < today) {
      o.status = "overdue";
    }
  }

  return { year, obligations, config, warnings };
}

/**
 * Génère les obligations pour plusieurs années consécutives.
 * Utile pour un planning pluriannuel ou des simulations.
 *
 * @param fromYear Première année (incluse)
 * @param toYear   Dernière année (incluse)
 * @param config   Configuration de l'entité
 */
export function generateMultiYearObligations(
  fromYear: number,
  toYear: number,
  config: CompanyConfig
): GenerateObligationsResult[] {
  if (fromYear > toYear) throw new RangeError("fromYear doit être ≤ toYear");

  const results: GenerateObligationsResult[] = [];
  for (let year = fromYear; year <= toYear; year++) {
    results.push(generateObligations(year, config));
  }
  return results;
}
