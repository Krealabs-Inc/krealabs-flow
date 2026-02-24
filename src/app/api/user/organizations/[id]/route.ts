import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { removeUserFromOrg } from "@/lib/services/organization.service";
import { success, error } from "@/lib/utils/api-response";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  const { id } = await params;

  try {
    await removeUserFromOrg(user.id, id);
    return success({ removed: true });
  } catch (err) {
    return error(err instanceof Error ? err.message : "Erreur interne", 400);
  }
}
