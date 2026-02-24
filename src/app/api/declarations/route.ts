import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { resolveOrgId } from "@/lib/auth/resolve-org-id";
import { listDeclarations } from "@/lib/services/declaration.service";
import { success, error } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  try {
    const orgId = await resolveOrgId(request, user.id);
    const declarations = await listDeclarations(orgId);
    return success(declarations);
  } catch (err) {
    return error(err instanceof Error ? err.message : "Erreur interne", 500);
  }
}
