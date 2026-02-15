import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { listPayments, getTreasuryStats } from "@/lib/services/payment.service";
import { recordPayment } from "@/lib/services/invoice.service";
import { createPaymentSchema } from "@/lib/validators/payment.validator";
import { success, error, paginated } from "@/lib/utils/api-response";

const DEFAULT_ORG_ID = "ab33997e-aa9b-4fcd-ab56-657971f81e8a";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  const { searchParams } = request.nextUrl;

  try {
    // Treasury stats endpoint
    if (searchParams.get("stats") === "true") {
      const stats = await getTreasuryStats(DEFAULT_ORG_ID);
      return success(stats);
    }

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const invoiceId = searchParams.get("invoiceId") || undefined;
    const method = searchParams.get("method") || undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;

    const result = await listPayments({
      organizationId: DEFAULT_ORG_ID,
      page,
      limit,
      invoiceId,
      method,
      dateFrom,
      dateTo,
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
  const parsed = createPaymentSchema.safeParse(body);

  if (!parsed.success) {
    return error(parsed.error.issues[0].message, 422);
  }

  try {
    const result = await recordPayment(
      parsed.data.invoiceId,
      parsed.data.amount,
      parsed.data.method,
      parsed.data.paymentDate,
      DEFAULT_ORG_ID,
      user.id,
      parsed.data.reference,
      parsed.data.notes
    );
    return success(result, 201);
  } catch (err) {
    return error(err instanceof Error ? err.message : "Erreur interne", 500);
  }
}
