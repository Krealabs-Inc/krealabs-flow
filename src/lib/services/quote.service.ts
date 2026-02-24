import { db } from "@/lib/db";
import { quotes, quoteLines, invoices, invoiceLines } from "@/lib/db/schema";
import { eq, and, desc, ilike, or, inArray, sql } from "drizzle-orm";
import { createAuditLog } from "./audit.service";
import { generateQuoteNumber, generateInvoiceNumber } from "@/lib/utils/numbering";
import type {
  CreateQuoteInput,
  UpdateQuoteInput,
  QuoteLineInput,
} from "@/lib/validators/quote.validator";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeLineTotals(line: QuoteLineInput) {
  if (line.isSection) {
    return { totalHt: "0", totalTva: "0", totalTtc: "0" };
  }
  const totalHt = line.quantity * line.unitPriceHt;
  const totalTva = totalHt * (line.tvaRate / 100);
  const totalTtc = totalHt + totalTva;
  return {
    totalHt: totalHt.toFixed(2),
    totalTva: totalTva.toFixed(2),
    totalTtc: totalTtc.toFixed(2),
  };
}

function computeQuoteTotals(
  lines: QuoteLineInput[],
  discountPercent: number
) {
  let subtotalHt = 0;
  let totalTva = 0;

  for (const line of lines) {
    if (line.isSection || line.isOptional) continue;
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

interface ListQuotesParams {
  organizationId: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  clientId?: string;
}

export async function listQuotes({
  organizationId,
  page = 1,
  limit = 20,
  search,
  status,
  clientId,
}: ListQuotesParams) {
  const offset = (page - 1) * limit;

  const conditions = [eq(quotes.organizationId, organizationId)];

  if (status) {
    // "converted" is a UI alias for both partially and fully invoiced statuses
    if (status === "converted") {
      conditions.push(
        inArray(quotes.status, ["partially_invoiced", "fully_invoiced"])
      );
    } else {
      conditions.push(
        eq(quotes.status, status as typeof quotes.status.enumValues[number])
      );
    }
  }
  if (clientId) {
    conditions.push(eq(quotes.clientId, clientId));
  }
  if (search) {
    conditions.push(
      or(
        ilike(quotes.quoteNumber, `%${search}%`),
        ilike(quotes.reference, `%${search}%`)
      )!
    );
  }

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(quotes)
      .where(and(...conditions))
      .orderBy(desc(quotes.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(quotes)
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
// Get with lines
// ---------------------------------------------------------------------------

export async function getQuote(id: string, organizationId: string) {
  const [quote] = await db
    .select()
    .from(quotes)
    .where(
      and(eq(quotes.id, id), eq(quotes.organizationId, organizationId))
    );
  if (!quote) return null;

  const lines = await db
    .select()
    .from(quoteLines)
    .where(eq(quoteLines.quoteId, id))
    .orderBy(quoteLines.sortOrder);

  return { ...quote, lines };
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createQuote(
  input: CreateQuoteInput,
  organizationId: string,
  userId?: string
) {
  const quoteNumber = await generateQuoteNumber(organizationId);

  const validityDate =
    input.validityDate ||
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const totals = computeQuoteTotals(
    input.lines,
    input.discountPercent ?? 0
  );

  const depositAmount = input.depositPercent
    ? (parseFloat(totals.totalTtc) * input.depositPercent / 100).toFixed(2)
    : undefined;

  const [quote] = await db
    .insert(quotes)
    .values({
      organizationId,
      clientId: input.clientId,
      projectId: input.projectId,
      quoteNumber,
      reference: input.reference,
      issueDate: input.issueDate || new Date().toISOString().split("T")[0],
      validityDate,
      status: "draft",
      subtotalHt: totals.subtotalHt,
      totalTva: totals.totalTva,
      totalTtc: totals.totalTtc,
      discountPercent: String(input.discountPercent ?? 0),
      discountAmount: totals.discountAmount,
      depositPercent: input.depositPercent?.toString(),
      depositAmount,
      introduction: input.introduction,
      terms: input.terms,
      notes: input.notes,
      templateId: input.templateId,
      createdBy: userId,
    })
    .returning();

  // Insert lines
  if (input.lines.length > 0) {
    await db.insert(quoteLines).values(
      input.lines.map((line, index) => {
        const lineTotals = computeLineTotals(line);
        return {
          quoteId: quote.id,
          sortOrder: line.sortOrder ?? index,
          isSection: line.isSection,
          isOptional: line.isOptional,
          description: line.description,
          details: line.details,
          quantity: String(line.quantity),
          unit: line.unit,
          unitPriceHt: String(line.unitPriceHt),
          tvaRate: String(line.tvaRate),
          totalHt: lineTotals.totalHt,
          totalTva: lineTotals.totalTva,
          totalTtc: lineTotals.totalTtc,
        };
      })
    );
  }

  await createAuditLog({
    organizationId,
    userId,
    action: "create",
    entityType: "quote",
    entityId: quote.id,
    newValues: { quoteNumber, clientId: input.clientId },
  });

  return getQuote(quote.id, organizationId);
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateQuote(
  id: string,
  input: UpdateQuoteInput,
  organizationId: string,
  userId?: string
) {
  const existing = await getQuote(id, organizationId);
  if (!existing) return null;

  if (existing.status !== "draft") {
    throw new Error("Seuls les devis en brouillon peuvent être modifiés");
  }

  const lines: QuoteLineInput[] = input.lines ?? existing.lines.map((l) => ({
    sortOrder: l.sortOrder,
    isSection: l.isSection ?? false,
    isOptional: l.isOptional ?? false,
    description: l.description,
    details: l.details ?? undefined,
    quantity: parseFloat(l.quantity ?? "1"),
    unit: l.unit ?? "unit",
    unitPriceHt: parseFloat(l.unitPriceHt ?? "0"),
    tvaRate: parseFloat(l.tvaRate ?? "20"),
  }));

  const discountPercent = input.discountPercent ?? parseFloat(existing.discountPercent ?? "0");
  const totals = computeQuoteTotals(lines, discountPercent);

  const depositPercent = input.depositPercent ?? (existing.depositPercent ? parseFloat(existing.depositPercent) : undefined);
  const depositAmount = depositPercent
    ? (parseFloat(totals.totalTtc) * depositPercent / 100).toFixed(2)
    : undefined;

  await db
    .update(quotes)
    .set({
      clientId: input.clientId ?? existing.clientId,
      projectId: input.projectId ?? existing.projectId,
      reference: input.reference ?? existing.reference,
      issueDate: input.issueDate ?? existing.issueDate,
      validityDate: input.validityDate ?? existing.validityDate,
      subtotalHt: totals.subtotalHt,
      totalTva: totals.totalTva,
      totalTtc: totals.totalTtc,
      discountPercent: String(discountPercent),
      discountAmount: totals.discountAmount,
      depositPercent: depositPercent?.toString(),
      depositAmount,
      introduction: input.introduction ?? existing.introduction,
      terms: input.terms ?? existing.terms,
      notes: input.notes ?? existing.notes,
      templateId: input.templateId ?? existing.templateId,
      updatedAt: new Date(),
    })
    .where(and(eq(quotes.id, id), eq(quotes.organizationId, organizationId)));

  // Replace lines if provided
  if (input.lines) {
    await db.delete(quoteLines).where(eq(quoteLines.quoteId, id));

    if (input.lines.length > 0) {
      await db.insert(quoteLines).values(
        input.lines.map((line, index) => {
          const lineTotals = computeLineTotals(line);
          return {
            quoteId: id,
            sortOrder: line.sortOrder ?? index,
            isSection: line.isSection,
            isOptional: line.isOptional,
            description: line.description,
            details: line.details,
            quantity: String(line.quantity),
            unit: line.unit,
            unitPriceHt: String(line.unitPriceHt),
            tvaRate: String(line.tvaRate),
            totalHt: lineTotals.totalHt,
            totalTva: lineTotals.totalTva,
            totalTtc: lineTotals.totalTtc,
          };
        })
      );
    }
  }

  await createAuditLog({
    organizationId,
    userId,
    action: "update",
    entityType: "quote",
    entityId: id,
  });

  return getQuote(id, organizationId);
}

// ---------------------------------------------------------------------------
// Update status
// ---------------------------------------------------------------------------

export async function updateQuoteStatus(
  id: string,
  status: typeof quotes.status.enumValues[number],
  organizationId: string,
  userId?: string
) {
  const existing = await getQuote(id, organizationId);
  if (!existing) return null;

  const updateData: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  };

  if (status === "accepted") {
    updateData.acceptedDate = new Date().toISOString().split("T")[0];
  }

  await db
    .update(quotes)
    .set(updateData)
    .where(and(eq(quotes.id, id), eq(quotes.organizationId, organizationId)));

  await createAuditLog({
    organizationId,
    userId,
    action: "status_change",
    entityType: "quote",
    entityId: id,
    oldValues: { status: existing.status },
    newValues: { status },
  });

  return getQuote(id, organizationId);
}

// ---------------------------------------------------------------------------
// Duplicate
// ---------------------------------------------------------------------------

export async function duplicateQuote(
  id: string,
  organizationId: string,
  userId?: string
) {
  const existing = await getQuote(id, organizationId);
  if (!existing) return null;

  const newInput: CreateQuoteInput = {
    clientId: existing.clientId,
    projectId: existing.projectId ?? undefined,
    reference: existing.reference ? `${existing.reference} (copie)` : undefined,
    discountPercent: parseFloat(existing.discountPercent ?? "0"),
    depositPercent: existing.depositPercent
      ? parseFloat(existing.depositPercent)
      : undefined,
    introduction: existing.introduction ?? undefined,
    terms: existing.terms ?? undefined,
    notes: existing.notes ?? undefined,
    templateId: existing.templateId ?? undefined,
    lines: existing.lines.map((l) => ({
      sortOrder: l.sortOrder,
      isSection: l.isSection ?? false,
      isOptional: l.isOptional ?? false,
      description: l.description,
      details: l.details ?? undefined,
      quantity: parseFloat(l.quantity ?? "1"),
      unit: l.unit ?? "unit",
      unitPriceHt: parseFloat(l.unitPriceHt ?? "0"),
      tvaRate: parseFloat(l.tvaRate ?? "20"),
    })),
  };

  const duplicated = await createQuote(newInput, organizationId, userId);

  // Mark the duplicatedFrom field
  if (duplicated) {
    await db
      .update(quotes)
      .set({ duplicatedFrom: id })
      .where(eq(quotes.id, duplicated.id));
  }

  await createAuditLog({
    organizationId,
    userId,
    action: "duplicate",
    entityType: "quote",
    entityId: id,
    newValues: { newQuoteId: duplicated?.id },
  });

  return duplicated;
}

// ---------------------------------------------------------------------------
// Convert to invoice
// ---------------------------------------------------------------------------

export async function convertQuoteToInvoice(
  id: string,
  organizationId: string,
  userId?: string
) {
  const quote = await getQuote(id, organizationId);
  if (!quote) return null;

  if (quote.status !== "accepted") {
    throw new Error("Seuls les devis acceptés peuvent être convertis en facture");
  }

  const invoiceNumber = await generateInvoiceNumber(organizationId);

  const hasDeposit =
    quote.depositPercent && parseFloat(quote.depositPercent) > 0;

  // Create main invoice (or deposit invoice if deposit is required)
  const invoiceType = hasDeposit ? "deposit" : "standard";
  const invoiceAmount = hasDeposit
    ? {
        subtotalHt: (
          parseFloat(quote.subtotalHt ?? "0") *
          (parseFloat(quote.depositPercent!) / 100)
        ).toFixed(2),
        totalTva: (
          parseFloat(quote.totalTva ?? "0") *
          (parseFloat(quote.depositPercent!) / 100)
        ).toFixed(2),
        totalTtc: (
          parseFloat(quote.totalTtc ?? "0") *
          (parseFloat(quote.depositPercent!) / 100)
        ).toFixed(2),
      }
    : {
        subtotalHt: quote.subtotalHt,
        totalTva: quote.totalTva,
        totalTtc: quote.totalTtc,
      };

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const [invoice] = await db
    .insert(invoices)
    .values({
      organizationId,
      clientId: quote.clientId,
      projectId: quote.projectId,
      quoteId: id,
      invoiceNumber,
      reference: quote.reference,
      type: invoiceType,
      status: "draft",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: dueDate.toISOString().split("T")[0],
      subtotalHt: invoiceAmount.subtotalHt ?? "0",
      totalTva: invoiceAmount.totalTva ?? "0",
      totalTtc: invoiceAmount.totalTtc ?? "0",
      discountPercent: quote.discountPercent,
      discountAmount: quote.discountAmount,
      amountDue: invoiceAmount.totalTtc ?? "0",
      introduction: quote.introduction,
      createdBy: userId,
    })
    .returning();

  // Copy lines to invoice
  if (quote.lines.length > 0) {
    const factor = hasDeposit
      ? parseFloat(quote.depositPercent!) / 100
      : 1;

    await db.insert(invoiceLines).values(
      quote.lines
        .filter((l) => !l.isOptional)
        .map((line) => ({
          invoiceId: invoice.id,
          sortOrder: line.sortOrder,
          isSection: line.isSection,
          description: line.description,
          details: line.details,
          quantity: hasDeposit ? String(parseFloat(line.quantity ?? "1") * factor) : line.quantity,
          unit: line.unit,
          unitPriceHt: line.unitPriceHt,
          tvaRate: line.tvaRate,
          totalHt: hasDeposit
            ? (parseFloat(line.totalHt ?? "0") * factor).toFixed(2)
            : line.totalHt,
          totalTva: hasDeposit
            ? (parseFloat(line.totalTva ?? "0") * factor).toFixed(2)
            : line.totalTva,
          totalTtc: hasDeposit
            ? (parseFloat(line.totalTtc ?? "0") * factor).toFixed(2)
            : line.totalTtc,
        }))
    );
  }

  // Update quote status based on invoice type
  const newQuoteStatus = hasDeposit ? "partially_invoiced" : "fully_invoiced";
  await updateQuoteStatus(id, newQuoteStatus, organizationId, userId);

  await createAuditLog({
    organizationId,
    userId,
    action: "convert",
    entityType: "quote",
    entityId: id,
    newValues: {
      invoiceId: invoice.id,
      invoiceNumber,
      invoiceType: invoiceType,
      quoteStatus: newQuoteStatus,
    },
  });

  return invoice;
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteQuote(
  id: string,
  organizationId: string,
  userId?: string
) {
  const existing = await getQuote(id, organizationId);
  if (!existing) return false;

  if (existing.status !== "draft") {
    throw new Error("Seuls les devis en brouillon peuvent être supprimés");
  }

  await db
    .delete(quotes)
    .where(and(eq(quotes.id, id), eq(quotes.organizationId, organizationId)));

  await createAuditLog({
    organizationId,
    userId,
    action: "delete",
    entityType: "quote",
    entityId: id,
  });

  return true;
}
