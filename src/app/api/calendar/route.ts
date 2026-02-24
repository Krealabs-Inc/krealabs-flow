import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { resolveOrgId } from "@/lib/auth/resolve-org-id";
import { success, error } from "@/lib/utils/api-response";
import { db } from "@/lib/db";
import { invoices, quotes, payments, contracts, clients } from "@/lib/db/schema";
import { eq, and, gte, lte, ne, or, sql } from "drizzle-orm";
import { getObligationsForYear } from "@/lib/services/obligation.service";

export interface CalendarEvent {
  id: string;
  type: "invoice_due" | "quote_validity" | "payment" | "contract_renewal" | "fiscal_obligation";
  date: string;
  title: string;
  amount?: number;
  status: string;
  href: string;
  color: string;
}

const EVENT_COLORS: Record<CalendarEvent["type"], string> = {
  invoice_due: "#F97316",
  quote_validity: "#3B82F6",
  payment: "#22C55E",
  contract_renewal: "#A855F7",
  fiscal_obligation: "#8B89F7",
};

function clientDisplayName(
  companyName: string | null,
  firstName: string | null,
  lastName: string | null
): string {
  if (companyName) return companyName;
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Client inconnu";
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month");

  let year: number;
  let monthNum: number;

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    monthNum = m;
  } else {
    const now = new Date();
    year = now.getFullYear();
    monthNum = now.getMonth() + 1;
  }

  const startOfMonth = `${year}-${String(monthNum).padStart(2, "0")}-01`;
  // Last day of the month: day 0 of next month = last day of current month
  const lastDay = new Date(year, monthNum, 0).getDate();
  const endOfMonth = `${year}-${String(monthNum).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  try {
    const orgId = await resolveOrgId(request, user.id);
    const events: CalendarEvent[] = [];

    // --- Factures avec dueDate dans le mois (status != cancelled) ---
    const invoiceRows = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        status: invoices.status,
        dueDate: invoices.dueDate,
        totalTtc: invoices.totalTtc,
        amountDue: invoices.amountDue,
        clientName: sql<string>`COALESCE(${clients.companyName}, ${clients.contactFirstName} || ' ' || ${clients.contactLastName})`,
      })
      .from(invoices)
      .leftJoin(clients, eq(clients.id, invoices.clientId))
      .where(
        and(
          eq(invoices.organizationId, orgId),
          gte(invoices.dueDate, startOfMonth),
          lte(invoices.dueDate, endOfMonth),
          ne(invoices.status, "cancelled")
        )
      );

    for (const row of invoiceRows) {
      const clientName = row.clientName ?? "Client inconnu";
      events.push({
        id: `invoice-${row.id}`,
        type: "invoice_due",
        date: row.dueDate,
        title: `${row.invoiceNumber} \u2014 ${clientName}`,
        amount: row.amountDue ? parseFloat(row.amountDue) : parseFloat(row.totalTtc ?? "0"),
        status: row.status,
        href: `/invoices/${row.id}`,
        color: EVENT_COLORS.invoice_due,
      });
    }

    // --- Devis avec validityDate dans le mois (status != rejected) ---
    const quoteRows = await db
      .select({
        id: quotes.id,
        quoteNumber: quotes.quoteNumber,
        status: quotes.status,
        validityDate: quotes.validityDate,
        totalTtc: quotes.totalTtc,
        clientName: sql<string>`COALESCE(${clients.companyName}, ${clients.contactFirstName} || ' ' || ${clients.contactLastName})`,
      })
      .from(quotes)
      .leftJoin(clients, eq(clients.id, quotes.clientId))
      .where(
        and(
          eq(quotes.organizationId, orgId),
          gte(quotes.validityDate, startOfMonth),
          lte(quotes.validityDate, endOfMonth),
          ne(quotes.status, "rejected")
        )
      );

    for (const row of quoteRows) {
      const clientName = row.clientName ?? "Client inconnu";
      events.push({
        id: `quote-${row.id}`,
        type: "quote_validity",
        date: row.validityDate,
        title: `${row.quoteNumber} \u2014 ${clientName}`,
        amount: parseFloat(row.totalTtc ?? "0"),
        status: row.status,
        href: `/quotes/${row.id}`,
        color: EVENT_COLORS.quote_validity,
      });
    }

    // --- Paiements avec paymentDate dans le mois ---
    const paymentRows = await db
      .select({
        id: payments.id,
        invoiceId: payments.invoiceId,
        amount: payments.amount,
        paymentDate: payments.paymentDate,
        status: payments.status,
        invoiceNumber: invoices.invoiceNumber,
        clientName: sql<string>`COALESCE(${clients.companyName}, ${clients.contactFirstName} || ' ' || ${clients.contactLastName})`,
      })
      .from(payments)
      .leftJoin(invoices, eq(invoices.id, payments.invoiceId))
      .leftJoin(clients, eq(clients.id, invoices.clientId))
      .where(
        and(
          eq(payments.organizationId, orgId),
          gte(payments.paymentDate, startOfMonth),
          lte(payments.paymentDate, endOfMonth)
        )
      );

    for (const row of paymentRows) {
      const clientName = row.clientName ?? "Client inconnu";
      const invoiceNum = row.invoiceNumber ?? "Facture";
      events.push({
        id: `payment-${row.id}`,
        type: "payment",
        date: row.paymentDate,
        title: `${invoiceNum} \u2014 ${clientName}`,
        amount: parseFloat(row.amount),
        status: row.status,
        href: `/invoices/${row.invoiceId}`,
        color: EVENT_COLORS.payment,
      });
    }

    // --- Contrats avec nextBillingDate OU endDate dans le mois (status = active) ---
    const contractRows = await db
      .select({
        id: contracts.id,
        contractNumber: contracts.contractNumber,
        name: contracts.name,
        status: contracts.status,
        endDate: contracts.endDate,
        nextBillingDate: contracts.nextBillingDate,
        annualAmountHt: contracts.annualAmountHt,
        clientName: sql<string>`COALESCE(${clients.companyName}, ${clients.contactFirstName} || ' ' || ${clients.contactLastName})`,
      })
      .from(contracts)
      .leftJoin(clients, eq(clients.id, contracts.clientId))
      .where(
        and(
          eq(contracts.organizationId, orgId),
          eq(contracts.status, "active"),
          or(
            and(
              gte(contracts.nextBillingDate, startOfMonth),
              lte(contracts.nextBillingDate, endOfMonth)
            ),
            and(
              gte(contracts.endDate, startOfMonth),
              lte(contracts.endDate, endOfMonth)
            )
          )
        )
      );

    // Track which contract ids have already been added to avoid duplicates
    const addedContractDates = new Set<string>();

    for (const row of contractRows) {
      const clientName = row.clientName ?? "Client inconnu";

      if (
        row.nextBillingDate &&
        row.nextBillingDate >= startOfMonth &&
        row.nextBillingDate <= endOfMonth
      ) {
        const key = `${row.id}-billing-${row.nextBillingDate}`;
        if (!addedContractDates.has(key)) {
          addedContractDates.add(key);
          events.push({
            id: `contract-billing-${row.id}`,
            type: "contract_renewal",
            date: row.nextBillingDate,
            title: `${row.contractNumber} \u2014 ${clientName}`,
            amount: parseFloat(row.annualAmountHt ?? "0"),
            status: row.status,
            href: `/contracts/${row.id}`,
            color: EVENT_COLORS.contract_renewal,
          });
        }
      }

      if (
        row.endDate &&
        row.endDate >= startOfMonth &&
        row.endDate <= endOfMonth
      ) {
        const key = `${row.id}-end-${row.endDate}`;
        if (!addedContractDates.has(key)) {
          addedContractDates.add(key);
          events.push({
            id: `contract-end-${row.id}`,
            type: "contract_renewal",
            date: row.endDate,
            title: `${row.contractNumber} (fin) \u2014 ${clientName}`,
            amount: parseFloat(row.annualAmountHt ?? "0"),
            status: row.status,
            href: `/contracts/${row.id}`,
            color: EVENT_COLORS.contract_renewal,
          });
        }
      }
    }

    // --- Obligations fiscales du mois ---
    try {
      const fiscalResult = await getObligationsForYear(year, orgId);
      for (const obligation of fiscalResult.obligations) {
        const dueDateStr = obligation.dueDate.toISOString().split("T")[0];
        if (!dueDateStr.startsWith(`${year}-${String(monthNum).padStart(2, "0")}`)) continue;
        events.push({
          id: `fiscal-${obligation.obligationKey}`,
          type: "fiscal_obligation",
          date: dueDateStr,
          title: obligation.label,
          amount: obligation.amount,
          status: obligation.status,
          href: `/fiscal?year=${year}`,
          color: EVENT_COLORS.fiscal_obligation,
        });
      }
    } catch {
      // Table fiscale pas encore migrée — ignorer silencieusement
    }

    // Sort by date
    events.sort((a, b) => a.date.localeCompare(b.date));

    return success(events);
  } catch (err) {
    console.error(err);
    return error(
      err instanceof Error ? err.message : "Erreur de chargement du calendrier",
      500
    );
  }
}
