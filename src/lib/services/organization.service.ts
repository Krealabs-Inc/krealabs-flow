import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
