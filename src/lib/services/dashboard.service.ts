import { db } from "@/lib/db";
import { invoices, quotes, payments, clients, contracts } from "@/lib/db/schema";
import { eq, and, sql, gte, desc } from "drizzle-orm";

export interface DashboardStats {
  revenue: {
    thisMonth: number;
    lastMonth: number;
    thisYear: number;
  };
  invoices: {
    total: number;
    unpaid: number;
    overdue: number;
    totalDue: number;
  };
  quotes: {
    total: number;
    pending: number;
    acceptedThisMonth: number;
    conversionRate: number;
  };
  contracts: {
    active: number;
    renewalPending: number;
    monthlyRecurring: number;
  };
  clients: {
    total: number;
    newThisMonth: number;
  };
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    clientName: string | null;
    totalTtc: string | null;
    status: string;
    dueDate: string;
  }>;
  recentPayments: Array<{
    id: string;
    amount: string;
    paymentDate: string;
    method: string;
    invoiceNumber: string | null;
    clientName: string | null;
  }>;
  monthlyRevenue: Array<{
    month: string;
    amount: number;
  }>;
}

export async function getDashboardStats(
  organizationId: string
): Promise<DashboardStats> {
  const now = new Date();
  const thisMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStart = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}-01`;
  const lastMonthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const yearStart = `${now.getFullYear()}-01-01`;

  const [
    revenueThisMonth,
    revenueLastMonth,
    revenueThisYear,
    invoiceStats,
    quoteStats,
    contractStats,
    clientStats,
    recentInvoices,
    recentPayments,
    monthlyRevenue,
  ] = await Promise.all([
    // Revenue this month
    db
      .select({
        total: sql<string>`COALESCE(SUM(${payments.amount}::numeric), 0)`,
      })
      .from(payments)
      .where(
        and(
          eq(payments.organizationId, organizationId),
          eq(payments.status, "received"),
          gte(payments.paymentDate, thisMonthStart)
        )
      ),

    // Revenue last month
    db
      .select({
        total: sql<string>`COALESCE(SUM(${payments.amount}::numeric), 0)`,
      })
      .from(payments)
      .where(
        and(
          eq(payments.organizationId, organizationId),
          eq(payments.status, "received"),
          gte(payments.paymentDate, lastMonthStart),
          sql`${payments.paymentDate} < ${lastMonthEnd}`
        )
      ),

    // Revenue this year
    db
      .select({
        total: sql<string>`COALESCE(SUM(${payments.amount}::numeric), 0)`,
      })
      .from(payments)
      .where(
        and(
          eq(payments.organizationId, organizationId),
          eq(payments.status, "received"),
          gte(payments.paymentDate, yearStart)
        )
      ),

    // Invoice stats
    db
      .select({
        total: sql<number>`count(*)`,
        unpaid: sql<number>`SUM(CASE WHEN ${invoices.status} IN ('sent','viewed','partially_paid') THEN 1 ELSE 0 END)`,
        overdue: sql<number>`SUM(CASE WHEN ${invoices.status} = 'overdue' THEN 1 ELSE 0 END)`,
        totalDue: sql<string>`COALESCE(SUM(CASE WHEN ${invoices.status} IN ('sent','viewed','partially_paid','overdue') THEN ${invoices.amountDue}::numeric ELSE 0 END), 0)`,
      })
      .from(invoices)
      .where(eq(invoices.organizationId, organizationId)),

    // Quote stats
    db
      .select({
        total: sql<number>`count(*)`,
        pending: sql<number>`SUM(CASE WHEN ${quotes.status} IN ('sent','viewed') THEN 1 ELSE 0 END)`,
        acceptedThisMonth: sql<number>`SUM(CASE WHEN ${quotes.status} = 'accepted' AND ${quotes.acceptedDate} >= ${thisMonthStart} THEN 1 ELSE 0 END)`,
        accepted: sql<number>`SUM(CASE WHEN ${quotes.status} IN ('accepted','converted') THEN 1 ELSE 0 END)`,
      })
      .from(quotes)
      .where(eq(quotes.organizationId, organizationId)),

    // Contract stats
    db
      .select({
        active: sql<number>`SUM(CASE WHEN ${contracts.status} = 'active' THEN 1 ELSE 0 END)`,
        renewalPending: sql<number>`SUM(CASE WHEN ${contracts.status} = 'renewal_pending' THEN 1 ELSE 0 END)`,
        monthlyRecurring: sql<string>`COALESCE(SUM(CASE WHEN ${contracts.status} = 'active' THEN ${contracts.annualAmountHt}::numeric / 12 ELSE 0 END), 0)`,
      })
      .from(contracts)
      .where(eq(contracts.organizationId, organizationId)),

    // Client stats
    db
      .select({
        total: sql<number>`count(*)`,
        newThisMonth: sql<number>`SUM(CASE WHEN ${clients.createdAt} >= ${thisMonthStart}::timestamptz THEN 1 ELSE 0 END)`,
      })
      .from(clients)
      .where(
        and(
          eq(clients.organizationId, organizationId),
          eq(clients.isActive, true)
        )
      ),

    // Recent invoices
    db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        clientName: clients.companyName,
        totalTtc: invoices.totalTtc,
        status: invoices.status,
        dueDate: invoices.dueDate,
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoices.organizationId, organizationId))
      .orderBy(desc(invoices.createdAt))
      .limit(5),

    // Recent payments
    db
      .select({
        id: payments.id,
        amount: payments.amount,
        paymentDate: payments.paymentDate,
        method: payments.method,
        invoiceNumber: invoices.invoiceNumber,
        clientName: clients.companyName,
      })
      .from(payments)
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(payments.organizationId, organizationId))
      .orderBy(desc(payments.paymentDate))
      .limit(5),

    // Monthly revenue (last 12 months)
    db
      .select({
        month: sql<string>`TO_CHAR(${payments.paymentDate}::date, 'YYYY-MM')`,
        amount: sql<string>`COALESCE(SUM(${payments.amount}::numeric), 0)`,
      })
      .from(payments)
      .where(
        and(
          eq(payments.organizationId, organizationId),
          eq(payments.status, "received"),
          gte(
            payments.paymentDate,
            new Date(now.getFullYear(), now.getMonth() - 11, 1)
              .toISOString()
              .split("T")[0]
          )
        )
      )
      .groupBy(sql`TO_CHAR(${payments.paymentDate}::date, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${payments.paymentDate}::date, 'YYYY-MM')`),
  ]);

  const totalQuotes = Number(quoteStats[0].total);
  const acceptedQuotes = Number(quoteStats[0].accepted);

  return {
    revenue: {
      thisMonth: parseFloat(revenueThisMonth[0].total),
      lastMonth: parseFloat(revenueLastMonth[0].total),
      thisYear: parseFloat(revenueThisYear[0].total),
    },
    invoices: {
      total: Number(invoiceStats[0].total),
      unpaid: Number(invoiceStats[0].unpaid),
      overdue: Number(invoiceStats[0].overdue),
      totalDue: parseFloat(invoiceStats[0].totalDue),
    },
    quotes: {
      total: totalQuotes,
      pending: Number(quoteStats[0].pending),
      acceptedThisMonth: Number(quoteStats[0].acceptedThisMonth),
      conversionRate: totalQuotes > 0 ? (acceptedQuotes / totalQuotes) * 100 : 0,
    },
    contracts: {
      active: Number(contractStats[0].active),
      renewalPending: Number(contractStats[0].renewalPending),
      monthlyRecurring: parseFloat(contractStats[0].monthlyRecurring),
    },
    clients: {
      total: Number(clientStats[0].total),
      newThisMonth: Number(clientStats[0].newThisMonth),
    },
    recentInvoices,
    recentPayments,
    monthlyRevenue: monthlyRevenue.map((r) => ({
      month: r.month,
      amount: parseFloat(r.amount),
    })),
  };
}
