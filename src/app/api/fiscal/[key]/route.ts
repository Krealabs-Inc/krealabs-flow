import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { success, error } from "@/lib/utils/api-response";
import { updateObligationStatus } from "@/lib/services/obligation.service";
import type { ObligationStatus } from "@/lib/fiscal/obligation.types";

const DEFAULT_ORG_ID = "ab33997e-aa9b-4fcd-ab56-657971f81e8a";
const VALID_STATUSES: ObligationStatus[] = ["pending", "paid", "overdue"];

/**
 * PUT /api/fiscal/:key
 * Met à jour le statut d'une obligation (et optionnellement son montant réel).
 *
 * Body :
 * {
 *   status: "pending" | "paid" | "overdue"
 *   amountOverride?: number
 *   notes?: string
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  const { key } = await params;
  const body = await request.json();

  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return error(
      `Statut invalide. Valeurs acceptées : ${VALID_STATUSES.join(", ")}`,
      422
    );
  }

  try {
    await updateObligationStatus(
      DEFAULT_ORG_ID,
      key,
      body.status as ObligationStatus,
      body.amountOverride !== undefined ? Number(body.amountOverride) : undefined,
      body.notes
    );
    return success({ obligationKey: key, status: body.status });
  } catch (err) {
    return error(
      err instanceof Error ? err.message : "Erreur interne",
      500
    );
  }
}
