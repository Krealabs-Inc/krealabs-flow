import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { getPayment, refundPayment } from "@/lib/services/payment.service";
import { success, error } from "@/lib/utils/api-response";

const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000000";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  const { id } = await params;
  const payment = await getPayment(id, DEFAULT_ORG_ID);

  if (!payment) return error("Paiement non trouvé", 404);
  return success(payment);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  const { id } = await params;
  const body = await request.json();

  if (body.action === "refund") {
    try {
      const result = await refundPayment(id, DEFAULT_ORG_ID, user.id);
      if (!result) return error("Paiement non trouvé", 404);
      return success(result);
    } catch (err) {
      return error(
        err instanceof Error ? err.message : "Erreur interne",
        400
      );
    }
  }

  return error("Action inconnue", 400);
}
