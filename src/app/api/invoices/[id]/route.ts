import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { getPrimaryOrgId } from "@/lib/auth/get-user-orgs";
import {
  getInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  recordPayment,
  cancelInvoice,
  createFinalInvoice,
} from "@/lib/services/invoice.service";
import { updateInvoiceSchema } from "@/lib/validators/invoice.validator";
import { success, error } from "@/lib/utils/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  const { id } = await params;
  const orgId = await getPrimaryOrgId(user.id);
  const invoice = await getInvoice(id, orgId);

  if (!invoice) return error("Facture non trouvée", 404);
  return success(invoice);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  const { id } = await params;
  const body = await request.json();
  const orgId = await getPrimaryOrgId(user.id);

  // Handle actions
  if (body.action) {
    try {
      switch (body.action) {
        case "send":
          return success(
            await updateInvoiceStatus(id, "sent", orgId, user.id)
          );
        case "cancel":
          return success(
            await cancelInvoice(id, orgId, user.id)
          );
        case "mark_overdue":
          return success(
            await updateInvoiceStatus(id, "overdue", orgId, user.id)
          );
        case "record_payment":
          return success(
            await recordPayment(
              id,
              body.amount,
              body.method || "bank_transfer",
              body.paymentDate || new Date().toISOString().split("T")[0],
              orgId,
              user.id,
              body.reference,
              body.notes
            )
          );
        case "create_final":
          return success(
            await createFinalInvoice(id, orgId, user.id)
          );
        default:
          return error("Action inconnue", 400);
      }
    } catch (err) {
      return error(
        err instanceof Error ? err.message : "Erreur interne",
        400
      );
    }
  }

  // Standard update
  const parsed = updateInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0].message, 422);
  }

  try {
    const updated = await updateInvoice(id, parsed.data, orgId, user.id);
    if (!updated) return error("Facture non trouvée", 404);
    return success(updated);
  } catch (err) {
    return error(
      err instanceof Error ? err.message : "Erreur interne",
      400
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  const { id } = await params;
  const orgId = await getPrimaryOrgId(user.id);

  try {
    const deleted = await deleteInvoice(id, orgId, user.id);
    if (!deleted) return error("Facture non trouvée", 404);
    return success({ deleted: true });
  } catch (err) {
    return error(
      err instanceof Error ? err.message : "Erreur interne",
      400
    );
  }
}
