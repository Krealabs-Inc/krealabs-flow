import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { userOrganizations } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { success, error } from "@/lib/utils/api-response";

export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  const { id } = await params;

  // Verify user belongs to this org
  const [membership] = await db
    .select()
    .from(userOrganizations)
    .where(
      and(
        eq(userOrganizations.stackUserId, user.id),
        eq(userOrganizations.orgId, id)
      )
    )
    .limit(1);

  if (!membership) return error("Organisation introuvable", 404);

  // Remove primary from all user orgs, then set this one
  await db
    .update(userOrganizations)
    .set({ isPrimary: false })
    .where(eq(userOrganizations.stackUserId, user.id));

  await db
    .update(userOrganizations)
    .set({ isPrimary: true })
    .where(
      and(
        eq(userOrganizations.stackUserId, user.id),
        eq(userOrganizations.orgId, id)
      )
    );

  return success({ id, isPrimary: true });
}
