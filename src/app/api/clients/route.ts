import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { listClients, createClient } from "@/lib/services/client.service";
import { createClientSchema } from "@/lib/validators/client.validator";
import { success, error, paginated } from "@/lib/utils/api-response";

const DEFAULT_ORG_ID = "ab33997e-aa9b-4fcd-ab56-657971f81e8a";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || undefined;

  try {
    const result = await listClients({
      organizationId: DEFAULT_ORG_ID,
      page,
      limit,
      search,
    });
    return paginated(result.data, result.total, result.page, result.limit);
  } catch (err) {
    return error(err instanceof Error ? err.message : "Erreur de connexion à la base de données", 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  const body = await request.json();
  const parsed = createClientSchema.safeParse(body);

  if (!parsed.success) {
    return error(parsed.error.issues[0].message, 422);
  }

  const client = await createClient(parsed.data, DEFAULT_ORG_ID, user.id);
  return success(client, 201);
}
