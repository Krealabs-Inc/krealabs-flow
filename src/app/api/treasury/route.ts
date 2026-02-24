import { getAuthUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { invoices, payments, clients } from "@/lib/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { success, error } from "@/lib/utils/api-response";

const DEFAULT_ORG_ID = "ab33997e-aa9b-4fcd-ab56-657971f81e8a";

// French month abbreviations (Jan. starts at index 0)
const MONTH_LABELS = [
  "Jan.", "Fév.", "Mar.", "Avr.", "Mai", "Juin",
  "Juil.", "Août", "Sep.", "Oct.", "Nov.", "Déc.",
];

export async function GET() {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  try {
    // ── Date helpers ──────────────────────────────────────────────
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const startDate = twelveMonthsAgo.toISOString().split("T")[0];

    const thirtyDays = new Date(now);
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    const thirtyDaysDate = thirtyDays.toISOString().split("T")[0];

    // ── Run all queries in parallel ───────────────────────────────
    const [
      receivedThisMonthResult,
      pendingResult,
      overdueResult,
      monthlyReceivedResult,
      topClientsResult,
      unpaidInvoicesResult,
      forecastResult,
    ] = await Promise.all([
      // 1. Encaissé ce mois
      db
        .select({
          total: sql<string>`COALESCE(SUM(${payments.amount}), '0')`,
        })
        .from(payments)
        .where(
          and(
            eq(payments.organizationId, DEFAULT_ORG_ID),
            eq(payments.status, "received"),
            gte(payments.paymentDate, monthStart)
          )
        ),

      // 2. Total en attente (factures non payées)
      db
        .select({
          total: sql<string>`COALESCE(SUM(${invoices.amountDue}), '0')`,
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.organizationId, DEFAULT_ORG_ID),
            sql`${invoices.status} IN ('sent', 'viewed', 'partially_paid')`
          )
        ),

      // 3. Total en retard
      db
        .select({
          total: sql<string>`COALESCE(SUM(${invoices.amountDue}), '0')`,
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.organizationId, DEFAULT_ORG_ID),
            eq(invoices.status, "overdue")
          )
        ),

      // 4. Revenus mensuels sur 12 mois glissants
      db
        .select({
          month: sql<string>`TO_CHAR(${payments.paymentDate}, 'YYYY-MM')`,
          received: sql<string>`COALESCE(SUM(${payments.amount}), '0')`,
        })
        .from(payments)
        .where(
          and(
            eq(payments.organizationId, DEFAULT_ORG_ID),
            eq(payments.status, "received"),
            gte(payments.paymentDate, startDate)
          )
        )
        .groupBy(sql`TO_CHAR(${payments.paymentDate}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${payments.paymentDate}, 'YYYY-MM')`),

      // 5. Top clients par montant encaissé
      db
        .select({
          clientName: sql<string>`COALESCE(${clients.companyName}, ${clients.contactFirstName} || ' ' || ${clients.contactLastName})`,
          totalPaid: sql<string>`COALESCE(SUM(${payments.amount}), '0')`,
          clientId: clients.id,
        })
        .from(payments)
        .leftJoin(invoices, eq(invoices.id, payments.invoiceId))
        .leftJoin(clients, eq(clients.id, invoices.clientId))
        .where(
          and(
            eq(payments.organizationId, DEFAULT_ORG_ID),
            eq(payments.status, "received")
          )
        )
        .groupBy(
          clients.id,
          clients.companyName,
          clients.contactFirstName,
          clients.contactLastName
        )
        .orderBy(sql`SUM(${payments.amount}) DESC`)
        .limit(8),

      // 6. Factures impayées (avec clientName)
      db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          dueDate: invoices.dueDate,
          amountDue: invoices.amountDue,
          status: invoices.status,
          clientName: sql<string>`COALESCE(${clients.companyName}, ${clients.contactFirstName} || ' ' || ${clients.contactLastName})`,
        })
        .from(invoices)
        .leftJoin(clients, eq(clients.id, invoices.clientId))
        .where(
          and(
            eq(invoices.organizationId, DEFAULT_ORG_ID),
            sql`${invoices.status} IN ('sent', 'viewed', 'partially_paid', 'overdue')`
          )
        )
        .orderBy(invoices.dueDate)
        .limit(10),

      // 7. Prévisionnel 30 jours
      db
        .select({
          dueDate: invoices.dueDate,
          amountDue: invoices.amountDue,
          invoiceNumber: invoices.invoiceNumber,
          clientName: sql<string>`COALESCE(${clients.companyName}, ${clients.contactFirstName} || ' ' || ${clients.contactLastName})`,
        })
        .from(invoices)
        .leftJoin(clients, eq(clients.id, invoices.clientId))
        .where(
          and(
            eq(invoices.organizationId, DEFAULT_ORG_ID),
            sql`${invoices.status} IN ('sent', 'viewed', 'partially_paid', 'overdue')`,
            gte(invoices.dueDate, today),
            lte(invoices.dueDate, thirtyDaysDate)
          )
        )
        .orderBy(invoices.dueDate),
    ]);

    // ── Build the 12-month continuous series (fill missing months with 0) ──
    const receivedByMonth = new Map<string, number>(
      monthlyReceivedResult.map((r) => [r.month, parseFloat(r.received)])
    );

    const monthly = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(twelveMonthsAgo.getFullYear(), twelveMonthsAgo.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return {
        month: key,
        label: MONTH_LABELS[d.getMonth()],
        received: receivedByMonth.get(key) ?? 0,
      };
    });

    // ── Shape the response ────────────────────────────────────────
    return success({
      summary: {
        receivedThisMonth: parseFloat(receivedThisMonthResult[0]?.total ?? "0"),
        pending: parseFloat(pendingResult[0]?.total ?? "0"),
        overdue: parseFloat(overdueResult[0]?.total ?? "0"),
        mrr: 0,
      },
      monthly,
      topClients: topClientsResult.map((c) => ({
        clientId: c.clientId,
        clientName: c.clientName ?? "Client inconnu",
        totalPaid: parseFloat(c.totalPaid),
      })),
      unpaidInvoices: unpaidInvoicesResult,
      forecast: forecastResult,
    });
  } catch (err) {
    console.error(err);
    return error(
      err instanceof Error ? err.message : "Erreur de chargement de la trésorerie",
      500
    );
  }
}
