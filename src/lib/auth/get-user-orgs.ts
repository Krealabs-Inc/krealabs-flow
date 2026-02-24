import "server-only";
import { db } from "@/lib/db";
import { userOrganizations } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getOrCreateDefaultOrg } from "@/lib/services/organization.service";

const DEFAULT_ORG_ID = "ab33997e-aa9b-4fcd-ab56-657971f81e8a";

/**
 * Retourne tous les IDs d'organisations auxquelles appartient le user.
 * Si le user n'a aucune org, bootstrap avec DEFAULT_ORG_ID.
 */
export async function getUserOrgIds(stackUserId: string): Promise<string[]> {
  const rows = await db
    .select({ orgId: userOrganizations.orgId })
    .from(userOrganizations)
    .where(eq(userOrganizations.stackUserId, stackUserId));

  if (rows.length === 0) {
    await ensureUserHasOrg(stackUserId);
    return [DEFAULT_ORG_ID];
  }

  return rows.map((r) => r.orgId);
}

/**
 * Retourne l'ID de l'org primaire du user (ou la première disponible).
 * Si le user n'a aucune org, bootstrap avec DEFAULT_ORG_ID.
 */
export async function getPrimaryOrgId(stackUserId: string): Promise<string> {
  const [primary] = await db
    .select({ orgId: userOrganizations.orgId })
    .from(userOrganizations)
    .where(
      and(
        eq(userOrganizations.stackUserId, stackUserId),
        eq(userOrganizations.isPrimary, true)
      )
    )
    .limit(1);

  if (primary) return primary.orgId;

  const [first] = await db
    .select({ orgId: userOrganizations.orgId })
    .from(userOrganizations)
    .where(eq(userOrganizations.stackUserId, stackUserId))
    .limit(1);

  if (first) return first.orgId;

  await ensureUserHasOrg(stackUserId);
  return DEFAULT_ORG_ID;
}

/**
 * S'assure qu'un user a au moins une organisation (bootstrap premier login).
 */
export async function ensureUserHasOrg(stackUserId: string): Promise<void> {
  const [existing] = await db
    .select()
    .from(userOrganizations)
    .where(eq(userOrganizations.stackUserId, stackUserId))
    .limit(1);

  if (existing) return;

  await getOrCreateDefaultOrg(DEFAULT_ORG_ID);
  await db
    .insert(userOrganizations)
    .values({
      stackUserId,
      orgId: DEFAULT_ORG_ID,
      role: "owner",
      isPrimary: true,
    })
    .onConflictDoNothing();
}
