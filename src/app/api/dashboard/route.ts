import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { resolveOrgId } from "@/lib/auth/resolve-org-id";
import { getDashboardStats } from "@/lib/services/dashboard.service";
import { success, error } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  try {
    const orgId = await resolveOrgId(request, user.id);
    const stats = await getDashboardStats(orgId);
    return success(stats);
  } catch (err) {
    console.error(err);
    return error(
      err instanceof Error ? err.message : "Erreur de chargement du dashboard",
      500
    );
  }
}
