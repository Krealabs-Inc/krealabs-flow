import { db } from "@/lib/db";
import { invoices, payments, quotes, clients, contracts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { success } from "@/lib/utils/api-response";

const DEFAULT_ORG_ID = "ab33997e-aa9b-4fcd-ab56-657971f81e8a";

export interface ActivityItem {
  id: string;
  type: "invoice" | "payment" | "quote" | "client" | "contract";
  action: string;
  label: string;
  amount?: string;
  date: string;
  href: string;
}

export async function GET() {
  const items: ActivityItem[] = [];

  try {
    // Recent invoices
    const recentInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.organizationId, DEFAULT_ORG_ID))
      .orderBy(desc(invoices.createdAt))
      .limit(5);

    for (const inv of recentInvoices) {
      items.push({
        id: `invoice-${inv.id}`,
        type: "invoice",
        action: inv.status === "paid" ? "Facture payée" : "Facture créée",
        label: `${inv.invoiceNumber}`,
        amount: inv.totalTtc || undefined,
        date: String(inv.createdAt || inv.issueDate || ""),
        href: `/invoices/${inv.id}`,
      });
    }

    // Recent payments
    const recentPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.organizationId, DEFAULT_ORG_ID))
      .orderBy(desc(payments.createdAt))
      .limit(5);

    for (const p of recentPayments) {
      items.push({
        id: `payment-${p.id}`,
        type: "payment",
        action: "Paiement reçu",
        label: "Règlement",
        amount: p.amount,
        date: String(p.createdAt || p.paymentDate || ""),
        href: `/payments`,
      });
    }

    // Recent quotes
    const recentQuotes = await db
      .select()
      .from(quotes)
      .where(eq(quotes.organizationId, DEFAULT_ORG_ID))
      .orderBy(desc(quotes.createdAt))
      .limit(3);

    for (const q of recentQuotes) {
      items.push({
        id: `quote-${q.id}`,
        type: "quote",
        action: "Devis créé",
        label: `${q.quoteNumber}`,
        amount: q.totalTtc || undefined,
        date: String(q.createdAt || q.issueDate || ""),
        href: `/quotes/${q.id}`,
      });
    }

    // Recent clients
    const recentClients = await db
      .select()
      .from(clients)
      .where(eq(clients.organizationId, DEFAULT_ORG_ID))
      .orderBy(desc(clients.createdAt))
      .limit(3);

    for (const c of recentClients) {
      items.push({
        id: `client-${c.id}`,
        type: "client",
        action: "Nouveau client",
        label:
          c.companyName ||
          `${c.contactFirstName || ""} ${c.contactLastName || ""}`.trim() ||
          "Client",
        date: String(c.createdAt || ""),
        href: `/clients/${c.id}`,
      });
    }

    // Recent contracts
    const recentContracts = await db
      .select()
      .from(contracts)
      .where(eq(contracts.organizationId, DEFAULT_ORG_ID))
      .orderBy(desc(contracts.createdAt))
      .limit(3);

    for (const ct of recentContracts) {
      items.push({
        id: `contract-${ct.id}`,
        type: "contract",
        action: "Contrat créé",
        label: ct.name,
        date: String(ct.createdAt || ""),
        href: `/contracts/${ct.id}`,
      });
    }
  } catch {
    // DB not available
  }

  // Sort all by date desc
  items.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return success(items.slice(0, 15));
}
