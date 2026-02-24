/**
 * Service obligations fiscales.
 *
 * Combine le générateur pur (calendar.generator.ts) avec la persistance DB.
 * Le générateur produit les obligations algorithmiquement ; la DB ne stocke
 * que les overrides (statut payé, montant réel, notes).
 */

import { db } from "@/lib/db";
import { fiscalConfig, fiscalObligations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  generateObligations,
  generateMultiYearObligations,
} from "@/lib/fiscal/calendar.generator";
import type {
  CompanyConfig,
  Obligation,
  ObligationStatus,
  GenerateObligationsResult,
} from "@/lib/fiscal/obligation.types";

const DEFAULT_ORG_ID = "ab33997e-aa9b-4fcd-ab56-657971f81e8a";

// ─── Config GIE par défaut ────────────────────────────────────────────────────
// Correspond au contexte métier : GIE créé en 2026, clôture 31/12/2026,
// régime réel simplifié TVA.
// Remplacé dès qu'une entrée existe dans fiscal_config en DB.

const DEFAULT_GIE_CONFIG: Omit<CompanyConfig, "tvaByFiscalYear"> = {
  creationDate: new Date("2026-01-01"),
  firstClosingDate: new Date("2026-12-31"),
  closingMonth: 12,
  closingDay: 31,
  tvaRegime: "reel_simplifie",
  urssafEnabled: false,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convertit une ligne DB fiscal_config en CompanyConfig */
function dbRowToCompanyConfig(
  row: typeof fiscalConfig.$inferSelect
): CompanyConfig {
  return {
    creationDate: new Date(row.creationDate),
    firstClosingDate: new Date(row.firstClosingDate),
    closingMonth: row.closingMonth,
    closingDay: row.closingDay,
    tvaRegime: row.tvaRegime as CompanyConfig["tvaRegime"],
    urssafEnabled: row.urssafEnabled ?? false,
    tvaByFiscalYear: (row.tvaByFiscalYear as Record<string, number> | null)
      ? Object.fromEntries(
          Object.entries(row.tvaByFiscalYear as Record<string, number>).map(
            ([k, v]) => [parseInt(k), v]
          )
        )
      : {},
    cfeEstimatedAmount: row.cfeEstimatedAmount
      ? parseFloat(row.cfeEstimatedAmount)
      : undefined,
  };
}

// ─── Config ───────────────────────────────────────────────────────────────────

/**
 * Lit la config fiscale depuis la DB.
 * Si aucune config n'existe, insère et retourne la config GIE par défaut.
 */
export async function getOrCreateFiscalConfig(
  organizationId: string = DEFAULT_ORG_ID
): Promise<CompanyConfig> {
  const [existing] = await db
    .select()
    .from(fiscalConfig)
    .where(eq(fiscalConfig.organizationId, organizationId));

  if (existing) return dbRowToCompanyConfig(existing);

  // Créer la config par défaut
  const [created] = await db
    .insert(fiscalConfig)
    .values({
      organizationId,
      creationDate: "2026-01-01",
      firstClosingDate: "2026-12-31",
      closingMonth: 12,
      closingDay: 31,
      tvaRegime: "reel_simplifie",
      urssafEnabled: false,
      tvaByFiscalYear: {},
    })
    .returning();

  return dbRowToCompanyConfig(created);
}

export interface FiscalConfigInput {
  creationDate?: string;
  firstClosingDate?: string;
  closingMonth?: number;
  closingDay?: number;
  tvaRegime?: string;
  urssafEnabled?: boolean;
  /** TVA nette par exercice. Ex : { 2026: 12000 } */
  tvaByFiscalYear?: Record<number, number>;
  cfeEstimatedAmount?: number | null;
}

/**
 * Met à jour la config fiscale (upsert).
 * Permet de renseigner la TVA N-1, le montant CFE, etc.
 */
export async function upsertFiscalConfig(
  organizationId: string = DEFAULT_ORG_ID,
  partial: FiscalConfigInput
): Promise<CompanyConfig> {
  // Convertir les clés number en string pour le stockage JSONB
  const tvaByFiscalYearStr: Record<string, number> | undefined =
    partial.tvaByFiscalYear
      ? Object.fromEntries(
          Object.entries(partial.tvaByFiscalYear).map(([k, v]) => [String(k), v])
        )
      : undefined;

  const [existing] = await db
    .select()
    .from(fiscalConfig)
    .where(eq(fiscalConfig.organizationId, organizationId));

  if (existing) {
    const [updated] = await db
      .update(fiscalConfig)
      .set({
        ...(partial.creationDate && { creationDate: partial.creationDate }),
        ...(partial.firstClosingDate && { firstClosingDate: partial.firstClosingDate }),
        ...(partial.closingMonth !== undefined && { closingMonth: partial.closingMonth }),
        ...(partial.closingDay !== undefined && { closingDay: partial.closingDay }),
        ...(partial.tvaRegime && { tvaRegime: partial.tvaRegime }),
        ...(partial.urssafEnabled !== undefined && { urssafEnabled: partial.urssafEnabled }),
        ...(tvaByFiscalYearStr && { tvaByFiscalYear: tvaByFiscalYearStr }),
        ...(partial.cfeEstimatedAmount !== undefined && {
          cfeEstimatedAmount: partial.cfeEstimatedAmount != null
            ? String(partial.cfeEstimatedAmount)
            : null,
        }),
        updatedAt: new Date(),
      })
      .where(eq(fiscalConfig.organizationId, organizationId))
      .returning();
    return dbRowToCompanyConfig(updated);
  } else {
    const [created] = await db
      .insert(fiscalConfig)
      .values({
        organizationId,
        creationDate: partial.creationDate ?? "2026-01-01",
        firstClosingDate: partial.firstClosingDate ?? "2026-12-31",
        closingMonth: partial.closingMonth ?? 12,
        closingDay: partial.closingDay ?? 31,
        tvaRegime: partial.tvaRegime ?? "reel_simplifie",
        urssafEnabled: partial.urssafEnabled ?? false,
        tvaByFiscalYear: tvaByFiscalYearStr ?? {},
        cfeEstimatedAmount:
          partial.cfeEstimatedAmount != null
            ? String(partial.cfeEstimatedAmount)
            : undefined,
      })
      .returning();
    return dbRowToCompanyConfig(created);
  }
}

// ─── Obligations ──────────────────────────────────────────────────────────────

/**
 * Retourne les obligations pour une année civile donnée,
 * avec les overrides DB (statut, montant, notes) mergés.
 */
export async function getObligationsForYear(
  year: number,
  organizationId: string = DEFAULT_ORG_ID
): Promise<GenerateObligationsResult> {
  // 1. Récupérer la config
  const config = await getOrCreateFiscalConfig(organizationId);

  // 2. Générer algorithmiquement
  const result = generateObligations(year, config);

  // 3. Charger les overrides DB
  const overrides = await db
    .select()
    .from(fiscalObligations)
    .where(eq(fiscalObligations.organizationId, organizationId));

  const overrideMap = new Map(
    overrides.map((o) => [o.obligationKey, o])
  );

  // 4. Merger les overrides dans les obligations générées
  for (const obligation of result.obligations) {
    const override = overrideMap.get(obligation.obligationKey);
    if (override) {
      obligation.status = override.status as ObligationStatus;
      if (override.amountOverride !== null && override.amountOverride !== undefined) {
        obligation.amount = parseFloat(override.amountOverride);
      }
      // Notes disponibles via l'override (non dans le type Obligation — à étendre si besoin)
    }
  }

  return result;
}

/**
 * Retourne les obligations pour plusieurs années.
 */
export async function getObligationsRange(
  fromYear: number,
  toYear: number,
  organizationId: string = DEFAULT_ORG_ID
): Promise<GenerateObligationsResult[]> {
  const config = await getOrCreateFiscalConfig(organizationId);

  const results = generateMultiYearObligations(fromYear, toYear, config);

  // Charger tous les overrides en une seule requête
  const overrides = await db
    .select()
    .from(fiscalObligations)
    .where(eq(fiscalObligations.organizationId, organizationId));

  const overrideMap = new Map(overrides.map((o) => [o.obligationKey, o]));

  for (const result of results) {
    for (const obligation of result.obligations) {
      const override = overrideMap.get(obligation.obligationKey);
      if (override) {
        obligation.status = override.status as ObligationStatus;
        if (override.amountOverride !== null && override.amountOverride !== undefined) {
          obligation.amount = parseFloat(override.amountOverride);
        }
      }
    }
  }

  return results;
}

/**
 * Met à jour le statut (et optionnellement le montant/notes) d'une obligation.
 * Crée l'override s'il n'existe pas encore.
 */
export async function updateObligationStatus(
  organizationId: string = DEFAULT_ORG_ID,
  obligationKey: string,
  status: ObligationStatus,
  amountOverride?: number,
  notes?: string
): Promise<void> {
  const now = new Date();
  const paidAt = status === "paid" ? now : null;

  const [existing] = await db
    .select()
    .from(fiscalObligations)
    .where(
      and(
        eq(fiscalObligations.organizationId, organizationId),
        eq(fiscalObligations.obligationKey, obligationKey)
      )
    );

  if (existing) {
    await db
      .update(fiscalObligations)
      .set({
        status,
        amountOverride:
          amountOverride !== undefined ? String(amountOverride) : existing.amountOverride,
        notes: notes !== undefined ? notes : existing.notes,
        paidAt: paidAt ?? existing.paidAt,
        updatedAt: now,
      })
      .where(
        and(
          eq(fiscalObligations.organizationId, organizationId),
          eq(fiscalObligations.obligationKey, obligationKey)
        )
      );
  } else {
    await db.insert(fiscalObligations).values({
      organizationId,
      obligationKey,
      status,
      amountOverride: amountOverride !== undefined ? String(amountOverride) : undefined,
      notes,
      paidAt: paidAt ?? undefined,
    });
  }
}
