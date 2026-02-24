import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import {
  getUserOrganizationsWithStats,
  createOrganization,
} from "@/lib/services/organization.service";
import { success, error } from "@/lib/utils/api-response";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  try {
    const orgs = await getUserOrganizationsWithStats(user.id);
    return success(orgs);
  } catch (err) {
    return error(err instanceof Error ? err.message : "Erreur interne", 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  try {
    const body = await request.json();

    if (!body.name?.trim()) {
      return error("Le nom de l'entreprise est requis", 422);
    }

    const org = await createOrganization(body, user.id);
    return success(org, 201);
  } catch (err) {
    return error(err instanceof Error ? err.message : "Erreur interne", 500);
  }
}
