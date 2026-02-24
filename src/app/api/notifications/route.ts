import { db } from "@/lib/db";
import { invoices, contracts } from "@/lib/db/schema";
import { and, eq, lt, lte, sql } from "drizzle-orm";
import { success } from "@/lib/utils/api-response";
import { getObligationsForYear } from "@/lib/services/obligation.service";

const DEFAULT_ORG_ID = "ab33997e-aa9b-4fcd-ab56-657971f81e8a";

export interface AppNotification {
  id: string;
  type: "overdue_invoice" | "upcoming_invoice" | "contract_renewal" | "fiscal_deadline" | "quote_expiring";
  title: string;
  description: string;
  href: string;
  urgency: "high" | "medium" | "low";
  date: string;
}

export async function GET() {
  const notifications: AppNotification[] = [];
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const in7Days = new Date(today);
  in7Days.setDate(today.getDate() + 7);
  const in30Days = new Date(today);
  in30Days.setDate(today.getDate() + 30);

  try {
    // 1. Overdue invoices
    const overdueInvoices = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        dueDate: invoices.dueDate,
        amountDue: invoices.amountDue,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.organizationId, DEFAULT_ORG_ID),
          sql`${invoices.status} IN ('sent', 'viewed', 'partially_paid')`,
          lt(invoices.dueDate, todayStr)
        )
      )
      .limit(10);

    for (const inv of overdueInvoices) {
      const daysLate = Math.floor(
        (today.getTime() - new Date(inv.dueDate!).getTime()) / (1000 * 60 * 60 * 24)
      );
      notifications.push({
        id: `overdue-${inv.id}`,
        type: "overdue_invoice",
        title: `Facture ${inv.invoiceNumber} en retard`,
        description: `${daysLate} jour${daysLate > 1 ? "s" : ""} de retard · ${parseFloat(inv.amountDue || "0").toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}`,
        href: `/invoices/${inv.id}`,
        urgency: daysLate > 30 ? "high" : daysLate > 7 ? "medium" : "low",
        date: inv.dueDate!,
      });
    }

    // 2. Invoices due in 7 days
    const dueSoon = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        dueDate: invoices.dueDate,
        amountDue: invoices.amountDue,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.organizationId, DEFAULT_ORG_ID),
          sql`${invoices.status} IN ('sent', 'viewed', 'partially_paid')`,
          sql`${invoices.dueDate} >= ${todayStr}`,
          lte(invoices.dueDate, in7Days.toISOString().split("T")[0])
        )
      )
      .limit(5);

    for (const inv of dueSoon) {
      const daysLeft = Math.ceil(
        (new Date(inv.dueDate!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      notifications.push({
        id: `due-soon-${inv.id}`,
        type: "upcoming_invoice",
        title: `Facture ${inv.invoiceNumber} bientôt due`,
        description: `Échéance dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""} · ${parseFloat(inv.amountDue || "0").toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}`,
        href: `/invoices/${inv.id}`,
        urgency: daysLeft <= 2 ? "high" : "medium",
        date: inv.dueDate!,
      });
    }

    // 3. Contract renewals coming up
    const renewals = await db
      .select({
        id: contracts.id,
        name: contracts.name,
        endDate: contracts.endDate,
        renewalNoticeDays: contracts.renewalNoticeDays,
      })
      .from(contracts)
      .where(
        and(
          eq(contracts.organizationId, DEFAULT_ORG_ID),
          eq(contracts.status, "active"),
          eq(contracts.autoRenew, true),
          sql`(${contracts.endDate}::date - ${contracts.renewalNoticeDays} * interval '1 day') <= ${in30Days.toISOString().split("T")[0]}::date`,
          sql`${contracts.endDate}::date >= ${todayStr}::date`
        )
      )
      .limit(5);

    for (const c of renewals) {
      const daysUntil = Math.ceil(
        (new Date(c.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      notifications.push({
        id: `renewal-${c.id}`,
        type: "contract_renewal",
        title: `Renouvellement : ${c.name}`,
        description: `Fin de contrat dans ${daysUntil} jour${daysUntil > 1 ? "s" : ""}`,
        href: `/contracts/${c.id}`,
        urgency: daysUntil <= 7 ? "high" : daysUntil <= 30 ? "medium" : "low",
        date: c.endDate,
      });
    }

    // 4. Fiscal obligations due in 30 days
    try {
      const year = today.getFullYear();
      const fiscalResult = await getObligationsForYear(year, DEFAULT_ORG_ID);
      for (const obl of fiscalResult.obligations) {
        if (obl.status !== "pending") continue;
        const dueDateObj = new Date(obl.dueDate);
        const daysLeft = Math.ceil(
          (dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysLeft < 0 || daysLeft > 30) continue;
        notifications.push({
          id: `fiscal-${obl.obligationKey}`,
          type: "fiscal_deadline",
          title: obl.label,
          description: daysLeft === 0
            ? "Échéance aujourd'hui"
            : `Échéance dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`,
          href: `/fiscal?year=${year}`,
          urgency: daysLeft <= 3 ? "high" : daysLeft <= 10 ? "medium" : "low",
          date: obl.dueDate.toISOString().split("T")[0],
        });
      }
    } catch {
      // Fiscal table not yet migrated — skip
    }

  } catch {
    // DB not available — return empty
  }

  // Sort: high urgency first, then by date
  const urgencyOrder = { high: 0, medium: 1, low: 2 };
  notifications.sort((a, b) => {
    const u = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    if (u !== 0) return u;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return success(notifications.slice(0, 20));
}
