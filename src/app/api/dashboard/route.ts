import { getAuthUser } from "@/lib/auth/get-user";
import { getDashboardStats } from "@/lib/services/dashboard.service";
import { success, error } from "@/lib/utils/api-response";

const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000000";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  try {
    const stats = await getDashboardStats(DEFAULT_ORG_ID);
    return success(stats);
  } catch (err) {
    return error(
      err instanceof Error ? err.message : "Erreur de chargement du dashboard",
      500
    );
  }
}
