import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { resolveOrgId } from "@/lib/auth/resolve-org-id";
import { success, error } from "@/lib/utils/api-response";
import {
  getObligationsForYear,
  upsertFiscalConfig,
} from "@/lib/services/obligation.service";

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
    const orgId = await resolveOrgId(request, user.id);
    const result = await getObligationsForYear(year, orgId);
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
    const orgId = await resolveOrgId(request, user.id);
    const updated = await upsertFiscalConfig(orgId, body);
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
