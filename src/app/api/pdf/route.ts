import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { getInvoicePdfData, getQuotePdfData } from "@/lib/services/pdf.service";
import { success, error } from "@/lib/utils/api-response";

const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000000";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!type || !id) {
    return error("Type et ID requis", 400);
  }

  try {
    if (type === "invoice") {
      const data = await getInvoicePdfData(id, DEFAULT_ORG_ID);
      if (!data) return error("Facture non trouvée", 404);
      return success(data);
    }

    if (type === "quote") {
      const data = await getQuotePdfData(id, DEFAULT_ORG_ID);
      if (!data) return error("Devis non trouvé", 404);
      return success(data);
    }

    return error("Type invalide (invoice ou quote)", 400);
  } catch (err) {
    return error(err instanceof Error ? err.message : "Erreur interne", 500);
  }
}
