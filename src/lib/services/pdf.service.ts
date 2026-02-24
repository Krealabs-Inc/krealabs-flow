import { db } from "@/lib/db";
import { organizations, clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getInvoice } from "./invoice.service";
import { getQuote } from "./quote.service";

export interface PdfData {
  organization: {
    name: string;
    legalName: string | null;
    siret: string | null;
    tvaNumber: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    postalCode: string | null;
    country: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    bankName: string | null;
    iban: string | null;
    bic: string | null;
    legalMentions: string | null;
  };
  client: {
    companyName: string | null;
    legalName: string | null;
    siret: string | null;
    tvaNumber: string | null;
    contactFirstName: string | null;
    contactLastName: string | null;
    contactEmail: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    postalCode: string | null;
    country: string | null;
  };
}

async function getOrganization(organizationId: string) {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, organizationId));
  return org;
}

async function getClient(clientId: string) {
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId));
  return client;
}

export async function getInvoicePdfData(
  invoiceId: string,
  organizationId: string
) {
  const invoice = await getInvoice(invoiceId, organizationId);
  if (!invoice) return null;

  const [org, client] = await Promise.all([
    getOrganization(organizationId),
    getClient(invoice.clientId),
  ]);

  if (!org || !client) return null;

  return {
    type: "invoice" as const,
    invoice,
    organization: org,
    client,
  };
}

export async function getQuotePdfData(
  quoteId: string,
  organizationId: string
) {
  const quote = await getQuote(quoteId, organizationId);
  if (!quote) return null;

  const [org, client] = await Promise.all([
    getOrganization(organizationId),
    getClient(quote.clientId),
  ]);

  if (!org || !client) return null;

  return {
    type: "quote" as const,
    quote,
    organization: org,
    client,
  };
}
