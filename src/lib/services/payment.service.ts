import { db } from "@/lib/db";
import { payments, invoices, clients } from "@/lib/db/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { createAuditLog } from "./audit.service";

// ---------------------------------------------------------------------------
// List payments
// ---------------------------------------------------------------------------

interface ListPaymentsParams {
  organizationId: string;
  page?: number;
  limit?: number;
  invoiceId?: string;
  method?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function listPayments({
  organizationId,
  page = 1,
  limit = 20,
  invoiceId,
  method,
  dateFrom,
  dateTo,
}: ListPaymentsParams) {
  const offset = (page - 1) * limit;

  const conditions = [eq(payments.organizationId, organizationId)];

  if (invoiceId) {
    conditions.push(eq(payments.invoiceId, invoiceId));
  }
  if (method) {
    conditions.push(
      eq(
        payments.method,
        method as (typeof payments.method.enumValues)[number]
      )
    );
  }
  if (dateFrom) {
    conditions.push(gte(payments.paymentDate, dateFrom));
  }
  if (dateTo) {
    conditions.push(lte(payments.paymentDate, dateTo));
  }

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: payments.id,
        organizationId: payments.organizationId,
        invoiceId: payments.invoiceId,
        amount: payments.amount,
        paymentDate: payments.paymentDate,
        method: payments.method,
        status: payments.status,
        reference: payments.reference,
        notes: payments.notes,
        refundOf: payments.refundOf,
        createdBy: payments.createdBy,
        createdAt: payments.createdAt,
        updatedAt: payments.updatedAt,
        invoiceNumber: invoices.invoiceNumber,
        clientName: clients.companyName,
        clientId: invoices.clientId,
      })
      .from(payments)
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(and(...conditions))
      .orderBy(desc(payments.paymentDate))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .where(and(...conditions)),
  ]);

  return {
    data,
    total: Number(countResult[0].count),
    page,
    limit,
  };
}

// ---------------------------------------------------------------------------
// Get payment
// ---------------------------------------------------------------------------

export async function getPayment(id: string, organizationId: string) {
  const [payment] = await db
    .select({
      id: payments.id,
      organizationId: payments.organizationId,
      invoiceId: payments.invoiceId,
      amount: payments.amount,
      paymentDate: payments.paymentDate,
      method: payments.method,
      status: payments.status,
      reference: payments.reference,
      notes: payments.notes,
      refundOf: payments.refundOf,
      createdBy: payments.createdBy,
      createdAt: payments.createdAt,
      updatedAt: payments.updatedAt,
      invoiceNumber: invoices.invoiceNumber,
      clientName: clients.companyName,
      clientId: invoices.clientId,
    })
    .from(payments)
    .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(
      and(eq(payments.id, id), eq(payments.organizationId, organizationId))
    );
  return payment ?? null;
}

// ---------------------------------------------------------------------------
// Refund payment
// ---------------------------------------------------------------------------

export async function refundPayment(
  id: string,
  organizationId: string,
  userId?: string
) {
  const payment = await getPayment(id, organizationId);
  if (!payment) return null;

  if (payment.status === "refunded") {
    throw new Error("Ce paiement est déjà remboursé");
  }

  // Create refund payment
  const [refund] = await db
    .insert(payments)
    .values({
      organizationId,
      invoiceId: payment.invoiceId,
      amount: `-${payment.amount}`,
      paymentDate: new Date().toISOString().split("T")[0],
      method: payment.method,
      status: "refunded",
      reference: `Remboursement de ${payment.reference || payment.id}`,
      refundOf: id,
      createdBy: userId,
    })
    .returning();

  // Update original payment status
  await db
    .update(payments)
    .set({ status: "refunded", updatedAt: new Date() })
    .where(eq(payments.id, id));

  // Update invoice amounts
  const amount = parseFloat(payment.amount);
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, payment.invoiceId));

  if (invoice) {
    const newAmountPaid = parseFloat(invoice.amountPaid ?? "0") - amount;
    const newAmountDue =
      parseFloat(invoice.totalTtc ?? "0") - Math.max(0, newAmountPaid);

    let newStatus = invoice.status;
    if (newAmountPaid <= 0) {
      newStatus = "sent";
    } else if (newAmountDue > 0) {
      newStatus = "partially_paid";
    }

    await db
      .update(invoices)
      .set({
        amountPaid: Math.max(0, newAmountPaid).toFixed(2),
        amountDue: Math.max(0, newAmountDue).toFixed(2),
        status: newStatus,
        paidDate: null,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, payment.invoiceId));
  }

  await createAuditLog({
    organizationId,
    userId,
    action: "payment_received",
    entityType: "payment",
    entityId: id,
    newValues: { refundId: refund.id, amount: `-${payment.amount}` },
  });

  return getPayment(refund.id, organizationId);
}

// ---------------------------------------------------------------------------
// Treasury stats
// ---------------------------------------------------------------------------

export async function getTreasuryStats(organizationId: string) {
  // Total received this year
  const year = new Date().getFullYear();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const [totalReceivedResult] = await db
    .select({
      total: sql<string>`COALESCE(SUM(CASE WHEN ${payments.status} = 'received' THEN ${payments.amount}::numeric ELSE 0 END), 0)`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.organizationId, organizationId),
        gte(payments.paymentDate, yearStart),
        lte(payments.paymentDate, yearEnd)
      )
    );

  // Total pending (unpaid invoices)
  const [totalPendingResult] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${invoices.amountDue}::numeric), 0)`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.organizationId, organizationId),
        sql`${invoices.status} IN ('sent', 'viewed', 'partially_paid')`
      )
    );

  // Total overdue
  const [totalOverdueResult] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${invoices.amountDue}::numeric), 0)`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.organizationId, organizationId),
        eq(invoices.status, "overdue")
      )
    );

  // Monthly revenue (last 12 months)
  const monthlyRevenue = await db
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
          new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
        )
      )
    )
    .groupBy(sql`TO_CHAR(${payments.paymentDate}::date, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${payments.paymentDate}::date, 'YYYY-MM')`);

  return {
    totalReceived: parseFloat(totalReceivedResult.total),
    totalPending: parseFloat(totalPendingResult.total),
    totalOverdue: parseFloat(totalOverdueResult.total),
    monthlyRevenue: monthlyRevenue.map((r) => ({
      month: r.month,
      amount: parseFloat(r.amount),
    })),
  };
}
