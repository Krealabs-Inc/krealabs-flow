import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq, and, ilike, or, sql, desc, inArray } from "drizzle-orm";
import { createAuditLog } from "./audit.service";
import type {
  CreateClientInput,
  UpdateClientInput,
} from "@/lib/validators/client.validator";
import type { ClientPipelineStage } from "@/types";

interface ListClientsParams {
  organizationId?: string;
  organizationIds?: string[];
  page?: number;
  limit?: number;
  search?: string;
  stage?: ClientPipelineStage;
}

export async function listClients({
  organizationId,
  organizationIds,
  page = 1,
  limit = 20,
  search,
  stage,
}: ListClientsParams) {
  const offset = (page - 1) * limit;

  const orgIds = organizationIds ?? (organizationId ? [organizationId] : []);

  const conditions = [
    orgIds.length === 1
      ? eq(clients.organizationId, orgIds[0])
      : inArray(clients.organizationId, orgIds),
    eq(clients.isActive, true),
  ];

  if (search) {
    conditions.push(
      or(
        ilike(clients.companyName, `%${search}%`),
        ilike(clients.contactFirstName, `%${search}%`),
        ilike(clients.contactLastName, `%${search}%`),
        ilike(clients.contactEmail, `%${search}%`)
      )!
    );
  }

  if (stage) {
    conditions.push(eq(clients.pipelineStage, stage));
  }

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(clients)
      .where(and(...conditions))
      .orderBy(desc(clients.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(clients)
      .where(and(...conditions)),
  ]);

  return {
    data,
    total: Number(countResult[0].count),
    page,
    limit,
  };
}

export async function getClient(id: string, organizationId: string) {
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.organizationId, organizationId)));
  return client ?? null;
}

export async function createClient(
  input: CreateClientInput,
  organizationId: string,
  userId?: string
) {
  const [client] = await db
    .insert(clients)
    .values({
      ...input,
      organizationId,
      tvaRate: input.tvaRate?.toString(),
    })
    .returning();

  await createAuditLog({
    organizationId,
    userId,
    action: "create",
    entityType: "client",
    entityId: client.id,
    newValues: input as Record<string, unknown>,
  });

  return client;
}

export async function updateClient(
  id: string,
  input: UpdateClientInput,
  organizationId: string,
  userId?: string
) {
  const existing = await getClient(id, organizationId);
  if (!existing) return null;

  const [updated] = await db
    .update(clients)
    .set({
      ...input,
      tvaRate: input.tvaRate?.toString(),
      updatedAt: new Date(),
    })
    .where(and(eq(clients.id, id), eq(clients.organizationId, organizationId)))
    .returning();

  await createAuditLog({
    organizationId,
    userId,
    action: "update",
    entityType: "client",
    entityId: id,
    oldValues: existing as unknown as Record<string, unknown>,
    newValues: input as Record<string, unknown>,
  });

  return updated;
}

export async function deleteClient(
  id: string,
  organizationId: string,
  userId?: string
) {
  const existing = await getClient(id, organizationId);
  if (!existing) return false;

  await db
    .update(clients)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(clients.id, id), eq(clients.organizationId, organizationId)));

  await createAuditLog({
    organizationId,
    userId,
    action: "delete",
    entityType: "client",
    entityId: id,
  });

  return true;
}
