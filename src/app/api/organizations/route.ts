import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { getPrimaryOrgId, getUserOrgIds } from "@/lib/auth/get-user-orgs";
import {
  getOrCreateDefaultOrg,
  updateOrganization,
} from "@/lib/services/organization.service";
import { success, error } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  try {
    const { searchParams } = request.nextUrl;
    const orgIdParam = searchParams.get("orgId");
    let orgId: string;

    if (orgIdParam) {
      // Verify user has access to this org
      const userOrgIds = await getUserOrgIds(user.id);
      if (!userOrgIds.includes(orgIdParam)) {
        return error("Accès refusé à cette organisation", 403);
      }
      orgId = orgIdParam;
    } else {
      orgId = await getPrimaryOrgId(user.id);
    }

    const org = await getOrCreateDefaultOrg(orgId);
    return success(org);
  } catch {
    return error("Erreur lors du chargement de l'organisation", 500);
  }
}

export async function PUT(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  try {
    const { searchParams } = request.nextUrl;
    const orgIdParam = searchParams.get("orgId");
    let orgId: string;

    if (orgIdParam) {
      const userOrgIds = await getUserOrgIds(user.id);
      if (!userOrgIds.includes(orgIdParam)) {
        return error("Accès refusé à cette organisation", 403);
      }
      orgId = orgIdParam;
    } else {
      orgId = await getPrimaryOrgId(user.id);
    }

    const body = await request.json();
    await getOrCreateDefaultOrg(orgId);
    const updated = await updateOrganization(orgId, body);
    return success(updated);
  } catch (e) {
    return error(e instanceof Error ? e.message : "Erreur de mise à jour", 500);
  }
}
