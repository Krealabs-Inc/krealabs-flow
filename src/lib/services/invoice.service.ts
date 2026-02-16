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
// Get with lines, payments and related documents
// ---------------------------------------------------------------------------

export async function getInvoice(id: string, organizationId: string) {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(
      and(eq(invoices.id, id), eq(invoices.organizationId, organizationId))
    );
  if (!invoice) return null;

  const lines = await db
    .select()
    .from(invoiceLines)
    .where(eq(invoiceLines.invoiceId, id))
    .orderBy(invoiceLines.sortOrder);

  const paymentsList = await db
    .select()
    .from(payments)
    .where(eq(payments.invoiceId, id));

  // Get related quote if exists
  let relatedQuote = null;
  if (invoice.quoteId) {
    const { quotes } = await import("@/lib/db/schema");
    [relatedQuote] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.id, invoice.quoteId));
  }

  // Get parent invoice if exists (for final invoices)
  let relatedParent = null;
  if (invoice.parentInvoiceId) {
    [relatedParent] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoice.parentInvoiceId));
  }

  // Get final invoice if this is a deposit
  let relatedFinal = null;
  if (invoice.type === "deposit") {
    [relatedFinal] = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.parentInvoiceId, id),
          eq(invoices.type, "final")
        )
      );
  }

  return {
    ...invoice,
    lines,
    payments: paymentsList,
    relatedQuote,
    relatedParentInvoice: relatedParent,
    relatedFinalInvoice: relatedFinal,
  };
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

  if (deposit.status !== "paid" && deposit.status !== "partially_paid") {
    throw new Error("L'acompte doit être payé avant de créer la facture de solde");
  }

  // Check if a final invoice already exists for this deposit
  const [existing] = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.parentInvoiceId, depositInvoiceId),
        eq(invoices.type, "final")
      )
    );

  if (existing) {
    throw new Error("Une facture de solde existe déjà pour cet acompte");
  }

  // Find the original quote to get full amounts
  const quoteId = deposit.quoteId;
  if (!quoteId) {
    throw new Error("Impossible de trouver le devis d'origine");
  }

  // Get the quote to calculate the remaining amount
  const { getQuote } = await import("./quote.service");
  const quote = await getQuote(quoteId, organizationId);
  if (!quote) {
    throw new Error("Devis d'origine introuvable");
  }

  const invoiceNumber = await generateInvoiceNumber(organizationId);
  const depositTtc = parseFloat(deposit.totalTtc ?? "0");
  const quoteTotalTtc = parseFloat(quote.totalTtc ?? "0");

  // Calculate remaining amounts
  const remainingTtc = quoteTotalTtc - depositTtc;
  const depositPercent = quote.depositPercent ? parseFloat(quote.depositPercent) : 0;
  const remainingPercent = 100 - depositPercent;
  const factor = remainingPercent / 100;

  const remainingSubtotalHt = parseFloat(quote.subtotalHt ?? "0") * factor;
  const remainingTva = parseFloat(quote.totalTva ?? "0") * factor;

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
        ? `${deposit.reference} - Solde`
        : "Facture de solde",
      type: "final",
      status: "draft",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: dueDate.toISOString().split("T")[0],
      subtotalHt: remainingSubtotalHt.toFixed(2),
      totalTva: remainingTva.toFixed(2),
      totalTtc: remainingTtc.toFixed(2),
      discountPercent: quote.discountPercent,
      discountAmount: quote.discountAmount ? (parseFloat(quote.discountAmount) * factor).toFixed(2) : "0",
      amountDue: remainingTtc.toFixed(2),
      parentInvoiceId: depositInvoiceId,
      introduction: quote.introduction,
      footerNotes: `Facture de solde suite à l'acompte ${deposit.invoiceNumber} de ${depositTtc.toFixed(2)} € TTC`,
      createdBy: userId,
    })
    .returning();

  // Copy lines from quote with remaining quantities
  if (quote.lines.length > 0) {
    await db.insert(invoiceLines).values(
      quote.lines
        .filter((l) => !l.isOptional)
        .map((line, index) => {
          const lineRemainingHt = parseFloat(line.totalHt ?? "0") * factor;
          const lineRemainingTva = parseFloat(line.totalTva ?? "0") * factor;
          const lineRemainingTtc = parseFloat(line.totalTtc ?? "0") * factor;

          return {
            invoiceId: finalInvoice.id,
            sortOrder: line.sortOrder ?? index,
            isSection: line.isSection,
            description: line.description,
            details: line.details,
            quantity: line.isSection ? "0" : String(parseFloat(line.quantity ?? "1") * factor),
            unit: line.unit,
            unitPriceHt: line.unitPriceHt,
            tvaRate: line.tvaRate,
            totalHt: lineRemainingHt.toFixed(2),
            totalTva: lineRemainingTva.toFixed(2),
            totalTtc: lineRemainingTtc.toFixed(2),
          };
        })
    );
  }

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
      remainingAmount: remainingTtc,
    },
  });

  // Update quote status to fully_invoiced
  if (quoteId) {
    const { updateQuoteStatus } = await import("./quote.service");
    await updateQuoteStatus(quoteId, "fully_invoiced", organizationId, userId);
  }

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
