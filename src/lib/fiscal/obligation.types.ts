/**
 * Types pour le module de gestion des obligations fiscales.
 * Applicable au régime réel simplifié TVA (France).
 *
 * Aucune dépendance interne — ce fichier peut être importé partout,
 * y compris dans les tests unitaires.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type ObligationType =
  | "TVA_ACOMPTE" // Acompte TVA semestriel (55 % juil. / 40 % déc.)
  | "TVA_CA12" // Déclaration annuelle CA12 (réel simplifié)
  | "LIASSE" // Liasse fiscale annuelle (IS ou IR)
  | "CFE" // Cotisation Foncière des Entreprises
  | "URSSAF" // Cotisations sociales (si activé)
  | "OTHER"; // Obligation paramétrée manuellement

export type ObligationStatus = "pending" | "paid" | "overdue";

export type TvaRegime =
  | "reel_simplifie" // CA12 + 2 acomptes — art. 287 III CGI
  | "reel_normal" // CA3 mensuelle ou trimestrielle
  | "franchise_base"; // Pas de TVA facturée ni déclarée

// ─── Config entreprise ────────────────────────────────────────────────────────

/**
 * Configuration fiscale de l'entité (GIE, société...).
 * Doit être fournie à chaque appel du générateur.
 */
export interface CompanyConfig {
  /** Date de création juridique (immatriculation) */
  creationDate: Date;

  /** Date de première clôture comptable (ex : 31/12/2026) */
  firstClosingDate: Date;

  /** Mois de clôture de l'exercice (1-12). 12 = décembre. */
  closingMonth: number;

  /** Jour de clôture (1-31). 31 pour les exercices au 31/12. */
  closingDay: number;

  /** Régime TVA applicable */
  tvaRegime: TvaRegime;

  /** Activer le calcul des cotisations URSSAF */
  urssafEnabled: boolean;

  /**
   * TVA nette annuelle par exercice fiscal.
   * Nécessaire pour calculer les acomptes de l'année suivante.
   * Ex : { 2026: 12000, 2027: 15000 }
   */
  tvaByFiscalYear?: Record<number, number>;

  /** Montant CFE estimé en euros (fourni par la commune, pour information) */
  cfeEstimatedAmount?: number;
}

// ─── Obligation ───────────────────────────────────────────────────────────────

export interface Obligation {
  /** Identifiant unique (généré) */
  id: string;

  /**
   * Clé déterministe pour identifier l'obligation de façon stable.
   * Utilisée pour les overrides DB et la déduplication.
   * Exemples : "TVA_CA12_2027", "TVA_ACOMPTE_JUILLET_2027", "CFE_2027"
   */
  obligationKey: string;

  /** Catégorie d'obligation */
  type: ObligationType;

  /** Libellé court (affiché en badge ou titre de carte) */
  label: string;

  /** Description détaillée avec contexte fiscal et règle applicable */
  description: string;

  /** Date limite de règlement ou de dépôt */
  dueDate: Date;

  /** Exercice fiscal de référence (l'exercice auquel se rattache l'obligation) */
  fiscalYear: number;

  /** Année civile pendant laquelle l'échéance tombe */
  calendarYear: number;

  /** Vrai si l'obligation est récurrente d'une année sur l'autre */
  recurring: boolean;

  /** Vrai si cette obligation concerne la première année d'activité */
  isFirstYear: boolean;

  /** Statut de traitement */
  status: ObligationStatus;

  /**
   * Montant estimé en euros.
   * Calculé si `tvaByFiscalYear` est renseigné, sinon undefined.
   */
  amount?: number;

  /** Date d'alerte = dueDate - 30 jours */
  warningDate: Date;

  /** Tags pour le filtrage et la recherche */
  tags: string[];

  /** Référence légale (CGI, BOFiP) */
  legalReference?: string;
}

// ─── Résultat du générateur ───────────────────────────────────────────────────

export interface GenerateObligationsResult {
  /** Année civile pour laquelle les obligations ont été générées */
  year: number;

  /** Liste triée par date d'échéance */
  obligations: Obligation[];

  /** Config utilisée pour la génération */
  config: CompanyConfig;

  /**
   * Avertissements non bloquants.
   * Ex : "TVA 2026 non renseignée — montants acomptes 2027 non calculables."
   */
  warnings: string[];
}
