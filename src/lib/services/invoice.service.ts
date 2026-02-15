import { db } from "@/lib/db";
import { invoices, invoiceLines, payments } from "@/lib/db/schema";
import { eq, and, desc, ilike, or, sql } from "drizzle-orm";
import { createAuditLog } from "./audit.service";
import { generateInvoiceNumber } from "@/lib/utils/numbering";
import type {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceLineInput,
} from "@/lib/validators/invoice.validator";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeLineTotals(line: InvoiceLineInput) {
  if (line.isSection) {
    return { totalHt: "0", totalTva: "0", totalTtc: "0" };
  }
  const totalHt = line.quantity * line.unitPriceHt;
  const totalTva = totalHt * (line.tvaRate / 100);
  return {
    totalHt: totalHt.toFixed(2),
    totalTva: totalTva.toFixed(2),
    totalTtc: (totalHt + totalTva).toFixed(2),
  };
}

function computeInvoiceTotals(
  lines: InvoiceLineInput[],
  discountPercent: number
) {
  let subtotalHt = 0;
  let totalTva = 0;

  for (const line of lines) {
    if (line.isSection) continue;
    const ht = line.quantity * line.unitPriceHt;
    subtotalHt += ht;
    totalTva += ht * (line.tvaRate / 100);
  }

  const discountAmount = subtotalHt * (discountPercent / 100);
  const discountedHt = subtotalHt - discountAmount;
  const discountedTva = totalTva * (1 - discountPercent / 100);
  const totalTtc = discountedHt + discountedTva;

  return {
    subtotalHt: subtotalHt.toFixed(2),
    totalTva: discountedTva.toFixed(2),
    totalTtc: totalTtc.toFixed(2),
    discountAmount: discountAmount.toFixed(2),
  };
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

interface ListInvoicesParams {
  organizationId: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  clientId?: string;
  unpaidOnly?: boolean;
  overdueOnly?: boolean;
}

export async function listInvoices({
  organizationId,
  page = 1,
  limit = 20,
  search,
  status,
  clientId,
  unpaidOnly,
  overdueOnly,
}: ListInvoicesParams) {
  const offset = (page - 1) * limit;

  const conditions = [eq(invoices.organizationId, organizationId)];

  if (status) {
    conditions.push(
      eq(invoices.status, status as (typeof invoices.status.enumValues)[number])
    );
  }
  if (clientId) {
    conditions.push(eq(invoices.clientId, clientId));
  }
  if (unpaidOnly) {
    conditions.push(
      or(
        eq(invoices.status, "sent"),
        eq(invoices.status, "viewed"),
        eq(invoices.status, "partially_paid"),
        eq(invoices.status, "overdue")
      )!
    );
  }
  if (overdueOnly) {
    conditions.push(eq(invoices.status, "overdue"));
  }
  if (search) {
    conditions.push(
      or(
        ilike(invoices.invoiceNumber, `%${search}%`),
        ilike(invoices.reference, `%${search}%`)
      )!
    );
  }

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(invoices)
      .where(and(...conditions))
      .orderBy(desc(invoices.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
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
// Get with lines and payments
// ---------------------------------------------------------------------------

export async function getInvoice(id: string, organizationId: string) {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(
      and(eq(invoices.id, id), eq(invoices.organizationId, organizationId))
    );
  if (!invoice) return null;

  const [lines, paymentsList] = await Promise.all([
    db
      .select()
      .from(invoiceLines)
      .where(eq(invoiceLines.invoiceId, id))
      .orderBy(invoiceLines.sortOrder),
    db.select().from(payments).where(eq(payments.invoiceId, id)),
  ]);

  return { ...invoice, lines, payments: paymentsList };
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createInvoice(
  input: CreateInvoiceInput,
  organizationId: string,
  userId?: string
) {
  const invoiceNumber = await generateInvoiceNumber(organizationId);
  const totals = computeInvoiceTotals(input.lines, input.discountPercent ?? 0);

  const dueDate =
    input.dueDate ||
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [invoice] = await db
    .insert(invoices)
    .values({
      organizationId,
      clientId: input.clientId,
      projectId: input.projectId,
      quoteId: input.quoteId,
      contractId: input.contractId,
      invoiceNumber,
      reference: input.reference,
      type: input.type ?? "standard",
      status: "draft",
      issueDate: input.issueDate || new Date().toISOString().split("T")[0],
      dueDate,
      subtotalHt: totals.subtotalHt,
      totalTva: totals.totalTva,
      totalTtc: totals.totalTtc,
      discountPercent: String(input.discountPercent ?? 0),
      discountAmount: totals.discountAmount,
      amountDue: totals.totalTtc,
      parentInvoiceId: input.parentInvoiceId,
      introduction: input.introduction,
      footerNotes: input.footerNotes,
      notes: input.notes,
      templateId: input.templateId,
      createdBy: userId,
    })
    .returning();

  if (input.lines.length > 0) {
    await db.insert(invoiceLines).values(
      input.lines.map((line, index) => {
        const lt = computeLineTotals(line);
        return {
          invoiceId: invoice.id,
          sortOrder: line.sortOrder ?? index,
          isSection: line.isSection,
          description: line.description,
          details: line.details,
          quantity: String(line.quantity),
          unit: line.unit,
          unitPriceHt: String(line.unitPriceHt),
          tvaRate: String(line.tvaRate),
          totalHt: lt.totalHt,
          totalTva: lt.totalTva,
          totalTtc: lt.totalTtc,
        };
      })
    );
  }

  await createAuditLog({
    organizationId,
    userId,
    action: "create",
    entityType: "invoice",
    entityId: invoice.id,
    newValues: { invoiceNumber, clientId: input.clientId, type: input.type },
  });

  return getInvoice(invoice.id, organizationId);
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateInvoice(
  id: string,
  input: UpdateInvoiceInput,
  organizationId: string,
  userId?: string
) {
  const existing = await getInvoice(id, organizationId);
  if (!existing) return null;

  if (existing.status !== "draft") {
    throw new Error("Seules les factures en brouillon peuvent être modifiées");
  }

  const lines: InvoiceLineInput[] =
    input.lines ??
    existing.lines.map((l) => ({
      sortOrder: l.sortOrder,
      isSection: l.isSection ?? false,
      description: l.description,
      details: l.details ?? undefined,
      quantity: parseFloat(l.quantity ?? "1"),
      unit: l.unit ?? "unit",
      unitPriceHt: parseFloat(l.unitPriceHt ?? "0"),
      tvaRate: parseFloat(l.tvaRate ?? "20"),
    }));

  const discountPercent =
    input.discountPercent ?? parseFloat(existing.discountPercent ?? "0");
  const totals = computeInvoiceTotals(lines, discountPercent);

  await db
    .update(invoices)
    .set({
      clientId: input.clientId ?? existing.clientId,
      projectId: input.projectId ?? existing.projectId,
      reference: input.reference ?? existing.reference,
      issueDate: input.issueDate ?? existing.issueDate,
      dueDate: input.dueDate ?? existing.dueDate,
      subtotalHt: totals.subtotalHt,
      totalTva: totals.totalTva,
      totalTtc: totals.totalTtc,
      discountPercent: String(discountPercent),
      discountAmount: totals.discountAmount,
      amountDue: totals.totalTtc,
      introduction: input.introduction ?? existing.introduction,
      footerNotes: input.footerNotes ?? existing.footerNotes,
      notes: input.notes ?? existing.notes,
      updatedAt: new Date(),
    })
    .where(
      and(eq(invoices.id, id), eq(invoices.organizationId, organizationId))
    );

  if (input.lines) {
    await db.delete(invoiceLines).where(eq(invoiceLines.invoiceId, id));
    if (input.lines.length > 0) {
      await db.insert(invoiceLines).values(
        input.lines.map((line, index) => {
          const lt = computeLineTotals(line);
          return {
            invoiceId: id,
            sortOrder: line.sortOrder ?? index,
            isSection: line.isSection,
            description: line.description,
            details: line.details,
            quantity: String(line.quantity),
            unit: line.unit,
            unitPriceHt: String(line.unitPriceHt),
            tvaRate: String(line.tvaRate),
            totalHt: lt.totalHt,
            totalTva: lt.totalTva,
            totalTtc: lt.totalTtc,
          };
        })
      );
    }
  }

  await createAuditLog({
    organizationId,
    userId,
    action: "update",
    entityType: "invoice",
    entityId: id,
  });

  return getInvoice(id, organizationId);
}

// ---------------------------------------------------------------------------
// Status management
// ---------------------------------------------------------------------------

export async function updateInvoiceStatus(
  id: string,
  status: (typeof invoices.status.enumValues)[number],
  organizationId: string,
  userId?: string
) {
  const existing = await getInvoice(id, organizationId);
  if (!existing) return null;

  const updateData: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  };

  if (status === "sent") {
    updateData.sentAt = new Date();
  }
  if (status === "paid") {
    updateData.paidDate = new Date().toISOString().split("T")[0];
    updateData.amountDue = "0";
  }

  await db
    .update(invoices)
    .set(updateData)
    .where(
      and(eq(invoices.id, id), eq(invoices.organizationId, organizationId))
    );

  await createAuditLog({
    organizationId,
    userId,
    action: "status_change",
    entityType: "invoice",
    entityId: id,
    oldValues: { status: existing.status },
    newValues: { status },
  });

  return getInvoice(id, organizationId);
}

// ---------------------------------------------------------------------------
// Record payment
// ---------------------------------------------------------------------------

export async function recordPayment(
  invoiceId: string,
  amount: number,
  method: string,
  paymentDate: string,
  organizationId: string,
  userId?: string,
  reference?: string,
  notes?: string
) {
  const invoice = await getInvoice(invoiceId, organizationId);
  if (!invoice) return null;

  const [payment] = await db
    .insert(payments)
    .values({
      organizationId,
      invoiceId,
      amount: String(amount),
      paymentDate,
      method: method as (typeof payments.method.enumValues)[number],
      status: "received",
      reference,
      notes,
      createdBy: userId,
    })
    .returning();

  // Recalculate amounts
  const totalPaid =
    parseFloat(invoice.amountPaid ?? "0") + amount;
  const totalTtc = parseFloat(invoice.totalTtc ?? "0");
  const remaining = totalTtc - totalPaid;

  let newStatus = invoice.status;
  if (remaining <= 0) {
    newStatus = "paid";
  } else if (totalPaid > 0) {
    newStatus = "partially_paid";
  }

  await db
    .update(invoices)
    .set({
      amountPaid: totalPaid.toFixed(2),
      amountDue: Math.max(0, remaining).toFixed(2),
      status: newStatus,
      paidDate: remaining <= 0 ? paymentDate : null,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, invoiceId));

  await createAuditLog({
    organizationId,
    userId,
    action: "payment_received",
    entityType: "invoice",
    entityId: invoiceId,
    newValues: { paymentId: payment.id, amount, method, newStatus },
  });

  return getInvoice(invoiceId, organizationId);
}

// ---------------------------------------------------------------------------
// Cancel (generate credit note if already paid)
// ---------------------------------------------------------------------------

export async function cancelInvoice(
  id: string,
  organizationId: string,
  userId?: string
) {
  const invoice = await getInvoice(id, organizationId);
  if (!invoice) return null;

  if (invoice.status === "cancelled") {
    throw new Error("Cette facture est déjà annulée");
  }

  // If already paid/partially paid, create a credit note
  if (
    invoice.status === "paid" ||
    invoice.status === "partially_paid"
  ) {
    const creditNoteNumber = await generateInvoiceNumber(organizationId);

    await db.insert(invoices).values({
      organizationId,
      clientId: invoice.clientId,
      projectId: invoice.projectId,
      invoiceNumber: creditNoteNumber,
      reference: `Avoir sur ${invoice.invoiceNumber}`,
      type: "credit_note",
      status: "paid",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date().toISOString().split("T")[0],
      paidDate: new Date().toISOString().split("T")[0],
      subtotalHt: `-${invoice.subtotalHt ?? "0"}`,
      totalTva: `-${invoice.totalTva ?? "0"}`,
      totalTtc: `-${invoice.totalTtc ?? "0"}`,
      parentInvoiceId: id,
      createdBy: userId,
    });
  }

  await updateInvoiceStatus(id, "cancelled", organizationId, userId);

  return getInvoice(id, organizationId);
}

// ---------------------------------------------------------------------------
// Create final invoice (solde) from deposit
// ---------------------------------------------------------------------------

export async function createFinalInvoice(
  depositInvoiceId: string,
  organizationId: string,
  userId?: string
) {
  const deposit = await getInvoice(depositInvoiceId, organizationId);
  if (!deposit) return null;

  if (deposit.type !== "deposit") {
    throw new Error("Cette facture n'est pas un acompte");
  }

  // Find the original quote to get full amounts
  const quoteId = deposit.quoteId;
  if (!quoteId) {
    throw new Error("Impossible de trouver le devis d'origine");
  }

  const invoiceNumber = await generateInvoiceNumber(organizationId);
  const depositTtc = parseFloat(deposit.totalTtc ?? "0");

  // Get total from quote by looking at original amounts
  // The deposit invoice totalTtc is a fraction — reverse engineer the full amount
  // Use the lines from the deposit to compute the full amount
  // Alternatively, look at the quote total. For simplicity: total = deposit / factor

  // Since we need the remaining, calculate from the deposit's parent context
  // Simplification: get all invoice lines from the deposit and scale back

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const [finalInvoice] = await db
    .insert(invoices)
    .values({
      organizationId,
      clientId: deposit.clientId,
      projectId: deposit.projectId,
      quoteId: deposit.quoteId,
      invoiceNumber,
      reference: deposit.reference
        ? `${deposit.reference} (solde)`
        : "Facture de solde",
      type: "final",
      status: "draft",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: dueDate.toISOString().split("T")[0],
      parentInvoiceId: depositInvoiceId,
      createdBy: userId,
    })
    .returning();

  // Insert a single line for the remaining amount
  const remaining = parseFloat(deposit.totalTtc ?? "0"); // Will need proper calculation
  await db.insert(invoiceLines).values({
    invoiceId: finalInvoice.id,
    sortOrder: 0,
    description: `Solde restant (déduction de l'acompte ${deposit.invoiceNumber})`,
    quantity: "1",
    unit: "forfait",
    unitPriceHt: "0", // To be filled manually
    tvaRate: "20",
    totalHt: "0",
    totalTva: "0",
    totalTtc: "0",
  });

  await createAuditLog({
    organizationId,
    userId,
    action: "create",
    entityType: "invoice",
    entityId: finalInvoice.id,
    newValues: {
      type: "final",
      depositInvoiceId,
      depositAmount: depositTtc,
    },
  });

  return getInvoice(finalInvoice.id, organizationId);
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteInvoice(
  id: string,
  organizationId: string,
  userId?: string
) {
  const existing = await getInvoice(id, organizationId);
  if (!existing) return false;

  if (existing.status !== "draft") {
    throw new Error("Seules les factures en brouillon peuvent être supprimées");
  }

  await db
    .delete(invoices)
    .where(
      and(eq(invoices.id, id), eq(invoices.organizationId, organizationId))
    );

  await createAuditLog({
    organizationId,
    userId,
    action: "delete",
    entityType: "invoice",
    entityId: id,
  });

  return true;
}
