import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { clients, invoices, payments, quotes } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

const DEFAULT_ORG_ID = "ab33997e-aa9b-4fcd-ab56-657971f81e8a";

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(";"),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const v = row[h];
          if (v === null || v === undefined) return "";
          const str = String(v);
          if (str.includes(";") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(";")
    ),
  ];
  return lines.join("\n");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  const { entity } = await params;
  let csv = "";
  let filename = `export-${entity}`;

  try {
    if (entity === "clients") {
      const rows = await db
        .select()
        .from(clients)
        .where(eq(clients.organizationId, DEFAULT_ORG_ID))
        .orderBy(desc(clients.createdAt));
      csv = toCsv(
        rows.map((r) => ({
          "Entreprise": r.companyName || "",
          "Raison sociale": r.legalName || "",
          "Prénom contact": r.contactFirstName || "",
          "Nom contact": r.contactLastName || "",
          "Email": r.contactEmail || "",
          "Téléphone": r.contactPhone || "",
          "SIRET": r.siret || "",
          "Ville": r.city || "",
          "Actif": r.isActive ? "Oui" : "Non",
          "Créé le": r.createdAt ? new Date(r.createdAt).toLocaleDateString("fr-FR") : "",
        }))
      );
      filename = `clients-${new Date().toISOString().split("T")[0]}`;
    } else if (entity === "invoices") {
      const rows = await db
        .select()
        .from(invoices)
        .where(eq(invoices.organizationId, DEFAULT_ORG_ID))
        .orderBy(desc(invoices.issueDate));
      csv = toCsv(
        rows.map((r) => ({
          "Numéro": r.invoiceNumber,
          "Type": r.type,
          "Statut": r.status,
          "Date émission": r.issueDate || "",
          "Échéance": r.dueDate || "",
          "Total HT": r.subtotalHt || "",
          "TVA": r.totalTva || "",
          "Total TTC": r.totalTtc || "",
          "Payé": r.amountPaid || "0",
          "Restant dû": r.amountDue || "",
        }))
      );
      filename = `factures-${new Date().toISOString().split("T")[0]}`;
    } else if (entity === "payments") {
      const rows = await db
        .select()
        .from(payments)
        .where(eq(payments.organizationId, DEFAULT_ORG_ID))
        .orderBy(desc(payments.paymentDate));
      csv = toCsv(
        rows.map((r) => ({
          "Date": r.paymentDate || "",
          "Montant": r.amount || "",
          "Méthode": r.method,
          "Statut": r.status,
          "Référence": r.reference || "",
          "Notes": r.notes || "",
        }))
      );
      filename = `paiements-${new Date().toISOString().split("T")[0]}`;
    } else if (entity === "quotes") {
      const rows = await db
        .select()
        .from(quotes)
        .where(eq(quotes.organizationId, DEFAULT_ORG_ID))
        .orderBy(desc(quotes.issueDate));
      csv = toCsv(
        rows.map((r) => ({
          "Numéro": r.quoteNumber,
          "Statut": r.status,
          "Date": r.issueDate || "",
          "Validité": r.validityDate || "",
          "Total HT": r.subtotalHt || "",
          "Total TTC": r.totalTtc || "",
        }))
      );
      filename = `devis-${new Date().toISOString().split("T")[0]}`;
    } else {
      return new Response("Entity not supported", { status: 400 });
    }
  } catch {
    return new Response("Export error", { status: 500 });
  }

  return new Response("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}
