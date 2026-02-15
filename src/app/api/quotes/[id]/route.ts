import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
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

const DEFAULT_ORG_ID = "ab33997e-aa9b-4fcd-ab56-657971f81e8a";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  const { id } = await params;
  const quote = await getQuote(id, DEFAULT_ORG_ID);

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

  // Handle status changes and actions
  if (body.action) {
    try {
      switch (body.action) {
        case "send":
          return success(
            await updateQuoteStatus(id, "sent", DEFAULT_ORG_ID, user.id)
          );
        case "accept":
          return success(
            await updateQuoteStatus(id, "accepted", DEFAULT_ORG_ID, user.id)
          );
        case "reject":
          return success(
            await updateQuoteStatus(id, "rejected", DEFAULT_ORG_ID, user.id)
          );
        case "duplicate":
          return success(
            await duplicateQuote(id, DEFAULT_ORG_ID, user.id)
          );
        case "convert":
          return success(
            await convertQuoteToInvoice(id, DEFAULT_ORG_ID, user.id)
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
    const updated = await updateQuote(id, parsed.data, DEFAULT_ORG_ID, user.id);
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

  try {
    const deleted = await deleteQuote(id, DEFAULT_ORG_ID, user.id);
    if (!deleted) return error("Devis non trouvé", 404);
    return success({ deleted: true });
  } catch (err) {
    return error(
      err instanceof Error ? err.message : "Erreur interne",
      400
    );
  }
}
