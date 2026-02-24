import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { getPrimaryOrgId } from "@/lib/auth/get-user-orgs";
import {
  markDeclared,
  markPaid,
  refreshDeclaration,
} from "@/lib/services/declaration.service";
import { success, error } from "@/lib/utils/api-response";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  const { id } = await params;

  let body: { action?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return error("Corps de la requête invalide", 400);
  }

  if (!body.action) {
    return error("Action manquante", 400);
  }

  try {
    const orgId = await getPrimaryOrgId(user.id);
    switch (body.action) {
      case "mark_declared": {
        const updated = await markDeclared(id, orgId, body.notes);
        if (!updated) return error("Déclaration non trouvée", 404);
        return success(updated);
      }
      case "mark_paid": {
        const updated = await markPaid(id, orgId);
        if (!updated) return error("Déclaration non trouvée", 404);
        return success(updated);
      }
      case "refresh": {
        const updated = await refreshDeclaration(id, orgId);
        if (!updated) return error("Déclaration non trouvée", 404);
        return success(updated);
      }
      default:
        return error("Action inconnue", 400);
    }
  } catch (err) {
    return error(err instanceof Error ? err.message : "Erreur interne", 500);
  }
}
