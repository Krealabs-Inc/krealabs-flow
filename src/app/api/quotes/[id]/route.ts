import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { getPrimaryOrgId } from "@/lib/auth/get-user-orgs";
import {
  getQuote,
  updateQuote,
  deleteQuote,
  updateQuoteStatus,
  duplicateQuote,
  convertQuoteToInvoice,
} from "@/lib/services/quote.service";
import { updateQuoteSchema } from "@/lib/validators/quote.validator";
import { success, error } from "@/lib/utils/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  const { id } = await params;
  const orgId = await getPrimaryOrgId(user.id);
  const quote = await getQuote(id, orgId);

  if (!quote) return error("Devis non trouvé", 404);
  return success(quote);
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

  // Handle status changes and actions
  if (body.action) {
    try {
      switch (body.action) {
        case "send":
          return success(
            await updateQuoteStatus(id, "sent", orgId, user.id)
          );
        case "accept":
          return success(
            await updateQuoteStatus(id, "accepted", orgId, user.id)
          );
        case "reject":
          return success(
            await updateQuoteStatus(id, "rejected", orgId, user.id)
          );
        case "duplicate":
          return success(
            await duplicateQuote(id, orgId, user.id)
          );
        case "convert":
          return success(
            await convertQuoteToInvoice(id, orgId, user.id)
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
  const parsed = updateQuoteSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0].message, 422);
  }

  try {
    const updated = await updateQuote(id, parsed.data, orgId, user.id);
    if (!updated) return error("Devis non trouvé", 404);
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
    const deleted = await deleteQuote(id, orgId, user.id);
    if (!deleted) return error("Devis non trouvé", 404);
    return success({ deleted: true });
  } catch (err) {
    return error(
      err instanceof Error ? err.message : "Erreur interne",
      400
    );
  }
}
