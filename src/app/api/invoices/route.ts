import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { resolveOrgId } from "@/lib/auth/resolve-org-id";
import { listInvoices, createInvoice } from "@/lib/services/invoice.service";
import { createInvoiceSchema } from "@/lib/validators/invoice.validator";
import { success, error, paginated } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || undefined;
  const clientId = searchParams.get("clientId") || undefined;
  const unpaidOnly = searchParams.get("unpaid") === "true";
  const overdueOnly = searchParams.get("overdue") === "true";

  try {
    const orgId = await resolveOrgId(request, user.id);
    const result = await listInvoices({
      organizationId: orgId,
      page,
      limit,
      search,
      status,
      clientId,
      unpaidOnly,
      overdueOnly,
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
  const parsed = createInvoiceSchema.safeParse(body);

  if (!parsed.success) {
    return error(parsed.error.issues[0].message, 422);
  }

  try {
    const orgId = await resolveOrgId(request, user.id);
    const invoice = await createInvoice(parsed.data, orgId, user.id);
    return success(invoice, 201);
  } catch (err) {
    return error(err instanceof Error ? err.message : "Erreur interne", 500);
  }
}
