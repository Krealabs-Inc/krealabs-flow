import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { listProjects, createProject } from "@/lib/services/project.service";
import { createProjectSchema } from "@/lib/validators/project.validator";
import { success, error, paginated } from "@/lib/utils/api-response";

const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000000";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || undefined;
  const clientId = searchParams.get("clientId") || undefined;

  try {
    const result = await listProjects({
      organizationId: DEFAULT_ORG_ID,
      page,
      limit,
      search,
      status,
      clientId,
    });
    return paginated(result.data, result.total, result.page, result.limit);
  } catch (err) {
    return error(err instanceof Error ? err.message : "Erreur de connexion DB", 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  const body = await request.json();
  const parsed = createProjectSchema.safeParse(body);

  if (!parsed.success) {
    return error(parsed.error.issues[0].message, 422);
  }

  try {
    const project = await createProject(parsed.data, DEFAULT_ORG_ID, user.id);
    return success(project, 201);
  } catch (err) {
    return error(err instanceof Error ? err.message : "Erreur interne", 500);
  }
}
