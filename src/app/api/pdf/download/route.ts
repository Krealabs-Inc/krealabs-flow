import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { getPrimaryOrgId } from "@/lib/auth/get-user-orgs";
import { getInvoicePdfData, getQuotePdfData } from "@/lib/services/pdf.service";
import { renderToStream } from "@react-pdf/renderer";
import { InvoicePdf } from "@/components/pdf/invoice-pdf";
import { QuotePdf } from "@/components/pdf/quote-pdf";

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
    const orgId = await getPrimaryOrgId(user.id);

    if (type === "invoice") {
      const data = await getInvoicePdfData(id, orgId);
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
      const data = await getQuotePdfData(id, orgId);
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
