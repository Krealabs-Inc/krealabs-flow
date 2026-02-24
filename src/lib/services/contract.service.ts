import { db } from "@/lib/db";
import { contracts, clients, invoices, invoiceLines } from "@/lib/db/schema";
import { eq, and, desc, ilike, or, sql } from "drizzle-orm";
import { createAuditLog } from "./audit.service";
import { generateInvoiceNumber } from "@/lib/utils/numbering";
import type {
  CreateContractInput,
  UpdateContractInput,
} from "@/lib/validators/contract.validator";

// ---------------------------------------------------------------------------
// Numbering
// ---------------------------------------------------------------------------

let contractCounter = 0;

async function generateContractNumber(organizationId: string): Promise<string> {
  const year = new Date().getFullYear();
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(contracts)
    .where(eq(contracts.organizationId, organizationId));
  contractCounter = Number(result.count) + 1;
  return `CT-${year}-${String(contractCounter).padStart(3, "0")}`;
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

interface ListContractsParams {
  organizationId: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  clientId?: string;
}

export async function listContracts({
  organizationId,
  page = 1,
  limit = 20,
  search,
  status,
  clientId,
}: ListContractsParams) {
  const offset = (page - 1) * limit;

  const conditions = [eq(contracts.organizationId, organizationId)];

  if (status) {
    conditions.push(
      eq(
        contracts.status,
        status as (typeof contracts.status.enumValues)[number]
      )
    );
  }
  if (clientId) {
    conditions.push(eq(contracts.clientId, clientId));
  }
  if (search) {
    conditions.push(
      or(
        ilike(contracts.contractNumber, `%${search}%`),
        ilike(contracts.name, `%${search}%`)
      )!
    );
  }

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: contracts.id,
        organizationId: contracts.organizationId,
        clientId: contracts.clientId,
        projectId: contracts.projectId,
        contractNumber: contracts.contractNumber,
        name: contracts.name,
        description: contracts.description,
        status: contracts.status,
        startDate: contracts.startDate,
        endDate: contracts.endDate,
        autoRenew: contracts.autoRenew,
        renewalNoticeDays: contracts.renewalNoticeDays,
        renewedFrom: contracts.renewedFrom,
        annualAmountHt: contracts.annualAmountHt,
        billingFrequency: contracts.billingFrequency,
        nextBillingDate: contracts.nextBillingDate,
        lastBilledDate: contracts.lastBilledDate,
        terms: contracts.terms,
        pdfUrl: contracts.pdfUrl,
        createdBy: contracts.createdBy,
        createdAt: contracts.createdAt,
        updatedAt: contracts.updatedAt,
        clientName: clients.companyName,
      })
      .from(contracts)
      .leftJoin(clients, eq(contracts.clientId, clients.id))
      .where(and(...conditions))
      .orderBy(desc(contracts.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(contracts)
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
// Get
// ---------------------------------------------------------------------------

export async function getContract(id: string, organizationId: string) {
  const [contract] = await db
    .select({
      id: contracts.id,
      organizationId: contracts.organizationId,
      clientId: contracts.clientId,
      projectId: contracts.projectId,
      contractNumber: contracts.contractNumber,
      name: contracts.name,
      description: contracts.description,
      status: contracts.status,
      startDate: contracts.startDate,
      endDate: contracts.endDate,
      autoRenew: contracts.autoRenew,
      renewalNoticeDays: contracts.renewalNoticeDays,
      renewedFrom: contracts.renewedFrom,
      annualAmountHt: contracts.annualAmountHt,
      billingFrequency: contracts.billingFrequency,
      nextBillingDate: contracts.nextBillingDate,
      lastBilledDate: contracts.lastBilledDate,
      terms: contracts.terms,
      pdfUrl: contracts.pdfUrl,
      createdBy: contracts.createdBy,
      createdAt: contracts.createdAt,
      updatedAt: contracts.updatedAt,
      clientName: clients.companyName,
    })
    .from(contracts)
    .leftJoin(clients, eq(contracts.clientId, clients.id))
    .where(
      and(
        eq(contracts.id, id),
        eq(contracts.organizationId, organizationId)
      )
    );
  return contract ?? null;
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createContract(
  input: CreateContractInput,
  organizationId: string,
  userId?: string
) {
  const contractNumber = await generateContractNumber(organizationId);

  // Calculate next billing date from start date
  const nextBillingDate = input.startDate;

  const [contract] = await db
    .insert(contracts)
    .values({
      organizationId,
      clientId: input.clientId,
      projectId: input.projectId,
      contractNumber,
      name: input.name,
      description: input.description,
      status: "draft",
      startDate: input.startDate,
      endDate: input.endDate,
      autoRenew: input.autoRenew,
      renewalNoticeDays: input.renewalNoticeDays,
      annualAmountHt: String(input.annualAmountHt),
      billingFrequency: input.billingFrequency,
      nextBillingDate,
      terms: input.terms,
      createdBy: userId,
    })
    .returning();

  await createAuditLog({
    organizationId,
    userId,
    action: "create",
    entityType: "contract",
    entityId: contract.id,
    newValues: { contractNumber, clientId: input.clientId, name: input.name },
  });

  return getContract(contract.id, organizationId);
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateContract(
  id: string,
  input: UpdateContractInput,
  organizationId: string,
  userId?: string
) {
  const existing = await getContract(id, organizationId);
  if (!existing) return null;

  if (existing.status !== "draft") {
    throw new Error("Seuls les contrats en brouillon peuvent être modifiés");
  }

  await db
    .update(contracts)
    .set({
      clientId: input.clientId ?? existing.clientId,
      projectId: input.projectId ?? existing.projectId,
      name: input.name ?? existing.name,
      description: input.description ?? existing.description,
      startDate: input.startDate ?? existing.startDate,
      endDate: input.endDate ?? existing.endDate,
      autoRenew: input.autoRenew ?? existing.autoRenew,
      renewalNoticeDays: input.renewalNoticeDays ?? existing.renewalNoticeDays,
      annualAmountHt: input.annualAmountHt
        ? String(input.annualAmountHt)
        : existing.annualAmountHt,
      billingFrequency: input.billingFrequency ?? existing.billingFrequency,
      terms: input.terms ?? existing.terms,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(contracts.id, id),
        eq(contracts.organizationId, organizationId)
      )
    );

  await createAuditLog({
    organizationId,
    userId,
    action: "update",
    entityType: "contract",
    entityId: id,
  });

  return getContract(id, organizationId);
}

// ---------------------------------------------------------------------------
// Status management
// ---------------------------------------------------------------------------

export async function updateContractStatus(
  id: string,
  status: (typeof contracts.status.enumValues)[number],
  organizationId: string,
  userId?: string
) {
  const existing = await getContract(id, organizationId);
  if (!existing) return null;

  await db
    .update(contracts)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(contracts.id, id),
        eq(contracts.organizationId, organizationId)
      )
    );

  await createAuditLog({
    organizationId,
    userId,
    action: "status_change",
    entityType: "contract",
    entityId: id,
    oldValues: { status: existing.status },
    newValues: { status },
  });

  return getContract(id, organizationId);
}

// ---------------------------------------------------------------------------
// Renew
// ---------------------------------------------------------------------------

export async function renewContract(
  id: string,
  organizationId: string,
  userId?: string
) {
  const existing = await getContract(id, organizationId);
  if (!existing) return null;

  if (existing.status !== "active" && existing.status !== "renewal_pending") {
    throw new Error("Seuls les contrats actifs peuvent être renouvelés");
  }

  // Calculate new dates: shift by the original duration
  const startDate = new Date(existing.endDate);
  startDate.setDate(startDate.getDate() + 1);
  const duration =
    new Date(existing.endDate).getTime() -
    new Date(existing.startDate).getTime();
  const endDate = new Date(startDate.getTime() + duration);

  const contractNumber = await generateContractNumber(organizationId);

  const [renewed] = await db
    .insert(contracts)
    .values({
      organizationId,
      clientId: existing.clientId,
      projectId: existing.projectId,
      contractNumber,
      name: existing.name,
      description: existing.description,
      status: "draft",
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      autoRenew: existing.autoRenew,
      renewalNoticeDays: existing.renewalNoticeDays,
      renewedFrom: id,
      annualAmountHt: existing.annualAmountHt,
      billingFrequency: existing.billingFrequency,
      nextBillingDate: startDate.toISOString().split("T")[0],
      terms: existing.terms,
      createdBy: userId,
    })
    .returning();

  // Mark the old contract as renewed
  await db
    .update(contracts)
    .set({ status: "renewed", updatedAt: new Date() })
    .where(eq(contracts.id, id));

  await createAuditLog({
    organizationId,
    userId,
    action: "create",
    entityType: "contract",
    entityId: renewed.id,
    newValues: { renewedFrom: id },
  });

  return getContract(renewed.id, organizationId);
}

// ---------------------------------------------------------------------------
// Generate recurring invoice from contract
// ---------------------------------------------------------------------------

export async function generateContractInvoice(
  id: string,
  organizationId: string,
  userId?: string
) {
  const contract = await getContract(id, organizationId);
  if (!contract) throw new Error("Contrat non trouvé");

  if (contract.status !== "active") {
    throw new Error("Seuls les contrats actifs peuvent générer des factures");
  }

  // Calculate invoice amount based on billing frequency
  const annualHt = parseFloat(contract.annualAmountHt ?? "0");
  const frequencyDivisors: Record<string, number> = {
    monthly: 12,
    quarterly: 4,
    semi_annual: 2,
    annual: 1,
  };
  const divisor = frequencyDivisors[contract.billingFrequency ?? "annual"] ?? 1;
  const periodAmountHt = annualHt / divisor;

  const invoiceNumber = await generateInvoiceNumber(organizationId, "recurring");
  const today = new Date().toISOString().split("T")[0];

  // Due date: 30 days from today
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [newInvoice] = await db
    .insert(invoices)
    .values({
      organizationId,
      clientId: contract.clientId,
      contractId: id,
      invoiceNumber,
      type: "recurring",
      status: "draft",
      issueDate: today,
      dueDate,
      subtotalHt: periodAmountHt.toFixed(2),
      totalTva: (periodAmountHt * 0.2).toFixed(2),
      totalTtc: (periodAmountHt * 1.2).toFixed(2),
      discountPercent: "0",
      discountAmount: "0",
      amountDue: (periodAmountHt * 1.2).toFixed(2),
      amountPaid: "0",
      createdBy: userId,
    })
    .returning();

  // Insert a single line for the recurring period
  const periodLabels: Record<string, string> = {
    monthly: "mensuelle",
    quarterly: "trimestrielle",
    semi_annual: "semestrielle",
    annual: "annuelle",
  };
  const periodLabel = periodLabels[contract.billingFrequency ?? "annual"] ?? "périodique";

  await db.insert(invoiceLines).values({
    invoiceId: newInvoice.id,
    sortOrder: 0,
    isSection: false,
    description: `${contract.name} — Facturation ${periodLabel}`,
    details: contract.description ?? undefined,
    quantity: "1",
    unit: "forfait",
    unitPriceHt: periodAmountHt.toFixed(2),
    tvaRate: "20",
    totalHt: periodAmountHt.toFixed(2),
    totalTva: (periodAmountHt * 0.2).toFixed(2),
    totalTtc: (periodAmountHt * 1.2).toFixed(2),
  });

  // Calculate next billing date
  const nextBillingDate = new Date(contract.nextBillingDate ?? today);
  if (contract.billingFrequency === "monthly") {
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
  } else if (contract.billingFrequency === "quarterly") {
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
  } else if (contract.billingFrequency === "semi_annual") {
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 6);
  } else {
    nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
  }

  await db
    .update(contracts)
    .set({
      lastBilledDate: today,
      nextBillingDate: nextBillingDate.toISOString().split("T")[0],
      updatedAt: new Date(),
    })
    .where(and(eq(contracts.id, id), eq(contracts.organizationId, organizationId)));

  await createAuditLog({
    organizationId,
    userId,
    action: "create",
    entityType: "invoice",
    entityId: newInvoice.id,
    newValues: { contractId: id, type: "recurring", invoiceNumber },
  });

  return newInvoice;
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteContract(
  id: string,
  organizationId: string,
  userId?: string
) {
  const existing = await getContract(id, organizationId);
  if (!existing) return false;

  if (existing.status !== "draft") {
    throw new Error("Seuls les contrats en brouillon peuvent être supprimés");
  }

  await db
    .delete(contracts)
    .where(
      and(
        eq(contracts.id, id),
        eq(contracts.organizationId, organizationId)
      )
    );

  await createAuditLog({
    organizationId,
    userId,
    action: "delete",
    entityType: "contract",
    entityId: id,
  });

  return true;
}
