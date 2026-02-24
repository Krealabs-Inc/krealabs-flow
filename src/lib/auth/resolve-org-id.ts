import "server-only";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { userOrganizations } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getPrimaryOrgId } from "./get-user-orgs";

/**
 * Résout l'orgId à utiliser pour une requête :
 * - Si `?orgId=` est fourni et que le user en est membre → retourne cet orgId
 * - Sinon → retourne l'orgId primaire du user
 */
export async function resolveOrgId(
  request: NextRequest,
  userId: string
): Promise<string> {
  const orgId = request.nextUrl.searchParams.get("orgId");

  if (orgId) {
    const [membership] = await db
      .select({ orgId: userOrganizations.orgId })
      .from(userOrganizations)
      .where(
        and(
          eq(userOrganizations.stackUserId, userId),
          eq(userOrganizations.orgId, orgId)
        )
      )
      .limit(1);

    if (membership) return membership.orgId;
  }

  return getPrimaryOrgId(userId);
}
