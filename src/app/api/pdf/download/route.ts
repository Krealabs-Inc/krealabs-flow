import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { getInvoicePdfData, getQuotePdfData } from "@/lib/services/pdf.service";
import { renderToStream } from "@react-pdf/renderer";
import { InvoicePdf } from "@/components/pdf/invoice-pdf";
import { QuotePdf } from "@/components/pdf/quote-pdf";

const DEFAULT_ORG_ID = "ab33997e-aa9b-4fcd-ab56-657971f81e8a";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!type || !id) {
    return NextResponse.json(
      { error: "Type et ID requis" },
      { status: 400 }
    );
  }

  try {
    if (type === "invoice") {
      const data = await getInvoicePdfData(id, DEFAULT_ORG_ID);
      if (!data) {
        return NextResponse.json(
          { error: "Facture non trouvée" },
          { status: 404 }
        );
      }

      const { invoice, organization, client } = data;
      const doc = InvoicePdf({ invoice, organization, client });
      const stream = await renderToStream(doc);

      return new NextResponse(stream as any, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="facture-${invoice.invoiceNumber}.pdf"`,
        },
      });
    }

    if (type === "quote") {
      const data = await getQuotePdfData(id, DEFAULT_ORG_ID);
      if (!data) {
        return NextResponse.json(
          { error: "Devis non trouvé" },
          { status: 404 }
        );
      }

      const { quote, organization, client } = data;
      const doc = QuotePdf({ quote, organization, client });
      const stream = await renderToStream(doc);

      return new NextResponse(stream as any, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="devis-${quote.quoteNumber}.pdf"`,
        },
      });
    }

    return NextResponse.json(
      { error: "Type invalide (invoice ou quote)" },
      { status: 400 }
    );
  } catch (err) {
    console.error("Error generating PDF:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
