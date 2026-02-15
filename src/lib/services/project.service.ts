import { db } from "@/lib/db";
import {
  projects,
  projectMilestones,
  clients,
  quotes,
  invoices,
} from "@/lib/db/schema";
import { eq, and, desc, ilike, or, sql } from "drizzle-orm";
import { createAuditLog } from "./audit.service";
import type {
  CreateProjectInput,
  UpdateProjectInput,
  MilestoneInput,
} from "@/lib/validators/project.validator";

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

interface ListProjectsParams {
  organizationId: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  clientId?: string;
}

export async function listProjects({
  organizationId,
  page = 1,
  limit = 20,
  search,
  status,
  clientId,
}: ListProjectsParams) {
  const offset = (page - 1) * limit;

  const conditions = [eq(projects.organizationId, organizationId)];

  if (status) {
    conditions.push(
      eq(
        projects.status,
        status as (typeof projects.status.enumValues)[number]
      )
    );
  }
  if (clientId) {
    conditions.push(eq(projects.clientId, clientId));
  }
  if (search) {
    conditions.push(
      or(
        ilike(projects.name, `%${search}%`),
        ilike(projects.description, `%${search}%`)
      )!
    );
  }

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: projects.id,
        organizationId: projects.organizationId,
        clientId: projects.clientId,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        startDate: projects.startDate,
        endDate: projects.endDate,
        estimatedBudget: projects.estimatedBudget,
        notes: projects.notes,
        createdBy: projects.createdBy,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        clientName: clients.companyName,
      })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .where(and(...conditions))
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
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
// Get with milestones + stats
// ---------------------------------------------------------------------------

export async function getProject(id: string, organizationId: string) {
  const [project] = await db
    .select({
      id: projects.id,
      organizationId: projects.organizationId,
      clientId: projects.clientId,
      name: projects.name,
      description: projects.description,
      status: projects.status,
      startDate: projects.startDate,
      endDate: projects.endDate,
      estimatedBudget: projects.estimatedBudget,
      notes: projects.notes,
      createdBy: projects.createdBy,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      clientName: clients.companyName,
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(
      and(eq(projects.id, id), eq(projects.organizationId, organizationId))
    );
  if (!project) return null;

  const [milestones, quotesCount, invoiceStats] = await Promise.all([
    db
      .select()
      .from(projectMilestones)
      .where(eq(projectMilestones.projectId, id))
      .orderBy(projectMilestones.sortOrder),
    db
      .select({ count: sql<number>`count(*)` })
      .from(quotes)
      .where(eq(quotes.projectId, id)),
    db
      .select({
        count: sql<number>`count(*)`,
        totalInvoiced: sql<string>`COALESCE(SUM(${invoices.totalTtc}::numeric), 0)`,
        totalPaid: sql<string>`COALESCE(SUM(${invoices.amountPaid}::numeric), 0)`,
      })
      .from(invoices)
      .where(eq(invoices.projectId, id)),
  ]);

  return {
    ...project,
    milestones,
    quotesCount: Number(quotesCount[0].count),
    invoicesCount: Number(invoiceStats[0].count),
    totalInvoiced: parseFloat(invoiceStats[0].totalInvoiced),
    totalPaid: parseFloat(invoiceStats[0].totalPaid),
  };
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createProject(
  input: CreateProjectInput,
  organizationId: string,
  userId?: string
) {
  const [project] = await db
    .insert(projects)
    .values({
      organizationId,
      clientId: input.clientId,
      name: input.name,
      description: input.description,
      status: input.status ?? "prospect",
      startDate: input.startDate,
      endDate: input.endDate,
      estimatedBudget: input.estimatedBudget
        ? String(input.estimatedBudget)
        : undefined,
      notes: input.notes,
      createdBy: userId,
    })
    .returning();

  // Insert milestones
  if (input.milestones && input.milestones.length > 0) {
    await insertMilestones(project.id, input.milestones);
  }

  await createAuditLog({
    organizationId,
    userId,
    action: "create",
    entityType: "project",
    entityId: project.id,
    newValues: { name: input.name, clientId: input.clientId },
  });

  return getProject(project.id, organizationId);
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateProject(
  id: string,
  input: UpdateProjectInput,
  organizationId: string,
  userId?: string
) {
  const existing = await getProject(id, organizationId);
  if (!existing) return null;

  await db
    .update(projects)
    .set({
      clientId: input.clientId ?? existing.clientId,
      name: input.name ?? existing.name,
      description: input.description ?? existing.description,
      status: input.status ?? existing.status,
      startDate: input.startDate ?? existing.startDate,
      endDate: input.endDate ?? existing.endDate,
      estimatedBudget: input.estimatedBudget
        ? String(input.estimatedBudget)
        : existing.estimatedBudget,
      notes: input.notes ?? existing.notes,
      updatedAt: new Date(),
    })
    .where(
      and(eq(projects.id, id), eq(projects.organizationId, organizationId))
    );

  // Replace milestones if provided
  if (input.milestones) {
    await db
      .delete(projectMilestones)
      .where(eq(projectMilestones.projectId, id));
    if (input.milestones.length > 0) {
      await insertMilestones(id, input.milestones);
    }
  }

  await createAuditLog({
    organizationId,
    userId,
    action: "update",
    entityType: "project",
    entityId: id,
  });

  return getProject(id, organizationId);
}

// ---------------------------------------------------------------------------
// Update status
// ---------------------------------------------------------------------------

export async function updateProjectStatus(
  id: string,
  status: (typeof projects.status.enumValues)[number],
  organizationId: string,
  userId?: string
) {
  const existing = await getProject(id, organizationId);
  if (!existing) return null;

  await db
    .update(projects)
    .set({ status, updatedAt: new Date() })
    .where(
      and(eq(projects.id, id), eq(projects.organizationId, organizationId))
    );

  await createAuditLog({
    organizationId,
    userId,
    action: "status_change",
    entityType: "project",
    entityId: id,
    oldValues: { status: existing.status },
    newValues: { status },
  });

  return getProject(id, organizationId);
}

// ---------------------------------------------------------------------------
// Complete milestone
// ---------------------------------------------------------------------------

export async function completeMilestone(
  projectId: string,
  milestoneId: string,
  organizationId: string,
  userId?: string
) {
  // Verify project ownership
  const project = await getProject(projectId, organizationId);
  if (!project) return null;

  await db
    .update(projectMilestones)
    .set({ completedAt: new Date() })
    .where(
      and(
        eq(projectMilestones.id, milestoneId),
        eq(projectMilestones.projectId, projectId)
      )
    );

  await createAuditLog({
    organizationId,
    userId,
    action: "update",
    entityType: "milestone",
    entityId: milestoneId,
    newValues: { completedAt: new Date().toISOString() },
  });

  return getProject(projectId, organizationId);
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteProject(
  id: string,
  organizationId: string,
  userId?: string
) {
  const existing = await getProject(id, organizationId);
  if (!existing) return false;

  await db
    .delete(projects)
    .where(
      and(eq(projects.id, id), eq(projects.organizationId, organizationId))
    );

  await createAuditLog({
    organizationId,
    userId,
    action: "delete",
    entityType: "project",
    entityId: id,
  });

  return true;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function insertMilestones(projectId: string, milestones: MilestoneInput[]) {
  await db.insert(projectMilestones).values(
    milestones.map((m, index) => ({
      projectId,
      name: m.name,
      description: m.description,
      dueDate: m.dueDate,
      sortOrder: m.sortOrder ?? index,
    }))
  );
}
