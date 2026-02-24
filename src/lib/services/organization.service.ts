import { db } from "@/lib/db";
import { organizations, userOrganizations, invoices, quotes, clients } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function getOrganization(orgId: string) {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  return org ?? null;
}

export async function updateOrganization(
  orgId: string,
  data: Partial<{
    name: string;
    legalName: string;
    siren: string;
    siret: string;
    tvaNumber: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    postalCode: string;
    country: string;
    phone: string;
    email: string;
    website: string;
    logoUrl: string;
    defaultPaymentTerms: number;
    defaultTvaRate: string;
    quoteValidityDays: number;
    invoicePrefix: string;
    quotePrefix: string;
    accountHolder: string;
    bankName: string;
    iban: string;
    bic: string;
    legalMentions: string;
    quoteTerms: string;
    legalForm: string;
    tvaRegime: string;
    capitalSocial: string;
  }>
) {
  const [updated] = await db
    .update(organizations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(organizations.id, orgId))
    .returning();
  return updated;
}

export async function getOrCreateDefaultOrg(orgId: string) {
  let org = await getOrganization(orgId);
  if (!org) {
    const [created] = await db
      .insert(organizations)
      .values({ id: orgId, name: "Mon entreprise" })
      .returning();
    org = created;
  }
  return org;
}

export async function createOrganization(
  data: { name: string; legalForm?: string; tvaRegime?: string; siren?: string; addressLine1?: string; city?: string; postalCode?: string; email?: string; capitalSocial?: string },
  stackUserId: string
) {
  const [org] = await db
    .insert(organizations)
    .values({
      name: data.name,
      legalForm: data.legalForm ?? "autre",
      tvaRegime: data.tvaRegime ?? "reel_simplifie",
      siren: data.siren,
      addressLine1: data.addressLine1,
      city: data.city,
      postalCode: data.postalCode,
      email: data.email,
      capitalSocial: data.capitalSocial,
    })
    .returning();

  // Link user to the new org
  await db.insert(userOrganizations).values({
    stackUserId,
    orgId: org.id,
    role: "owner",
    isPrimary: false,
  });

  return org;
}

export async function getUserOrganizationsWithStats(stackUserId: string) {
  const rows = await db
    .select({
      org: organizations,
      role: userOrganizations.role,
      isPrimary: userOrganizations.isPrimary,
    })
    .from(userOrganizations)
    .innerJoin(organizations, eq(organizations.id, userOrganizations.orgId))
    .where(eq(userOrganizations.stackUserId, stackUserId));

  // Fetch stats for each org in parallel
  const orgsWithStats = await Promise.all(
    rows.map(async ({ org, role, isPrimary }) => {
      const [invoiceCount, clientCount] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(invoices)
          .where(eq(invoices.organizationId, org.id)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(clients)
          .where(eq(clients.organizationId, org.id)),
      ]);

      return {
        ...org,
        role,
        isPrimary: isPrimary ?? false,
        invoiceCount: Number(invoiceCount[0]?.count ?? 0),
        clientCount: Number(clientCount[0]?.count ?? 0),
      };
    })
  );

  return orgsWithStats;
}

export async function removeUserFromOrg(stackUserId: string, orgId: string) {
  // Cannot remove if it's the only org
  const allOrgs = await db
    .select()
    .from(userOrganizations)
    .where(eq(userOrganizations.stackUserId, stackUserId));

  if (allOrgs.length <= 1) {
    throw new Error("Impossible de quitter votre seule organisation");
  }

  await db
    .delete(userOrganizations)
    .where(
      eq(userOrganizations.stackUserId, stackUserId) &&
      eq(userOrganizations.orgId, orgId)
    );

  // If it was primary, set the next one as primary
  const wasPrimary = allOrgs.find(r => r.orgId === orgId)?.isPrimary;
  if (wasPrimary) {
    const nextOrg = allOrgs.find(r => r.orgId !== orgId);
    if (nextOrg) {
      await db
        .update(userOrganizations)
        .set({ isPrimary: true })
        .where(
          eq(userOrganizations.stackUserId, stackUserId) &&
          eq(userOrganizations.orgId, nextOrg.orgId)
        );
    }
  }
}
