import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { success, error } from "@/lib/utils/api-response";
import {
  getObligationsForYear,
  upsertFiscalConfig,
  getOrCreateFiscalConfig,
} from "@/lib/services/obligation.service";

const DEFAULT_ORG_ID = "ab33997e-aa9b-4fcd-ab56-657971f81e8a";

/**
 * GET /api/fiscal?year=2027
 * Retourne les obligations fiscales pour une année civile donnée.
 * Les statuts overrides (payé, etc.) sont mergés depuis la DB.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  const { searchParams } = request.nextUrl;
  const yearParam = searchParams.get("year");
  const year = yearParam
    ? parseInt(yearParam)
    : new Date().getFullYear();

  if (isNaN(year) || year < 2020 || year > 2060) {
    return error("Année invalide (doit être entre 2020 et 2060)", 400);
  }

  try {
    const result = await getObligationsForYear(year, DEFAULT_ORG_ID);
    // Sérialiser les Dates en ISO string pour JSON
    return success({
      year: result.year,
      warnings: result.warnings,
      obligations: result.obligations.map((o) => ({
        ...o,
        dueDate: o.dueDate.toISOString(),
        warningDate: o.warningDate.toISOString(),
      })),
    });
  } catch (err) {
    return error(
      err instanceof Error ? err.message : "Erreur interne",
      500
    );
  }
}

/**
 * PUT /api/fiscal
 * Met à jour la configuration fiscale (TVA par exercice, CFE, dates...).
 * Body : Partial<CompanyConfig sérialisé>
 */
export async function PUT(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  const body = await request.json();

  try {
    const updated = await upsertFiscalConfig(DEFAULT_ORG_ID, body);
    return success({
      ...updated,
      creationDate: updated.creationDate.toISOString(),
      firstClosingDate: updated.firstClosingDate.toISOString(),
    });
  } catch (err) {
    return error(
      err instanceof Error ? err.message : "Erreur interne",
      400
    );
  }
}
