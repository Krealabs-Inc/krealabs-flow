import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function generateQuoteNumber(
  organizationId: string
): Promise<string> {
  const year = new Date().getFullYear();

  // Atomically increment and return the next number
  const [org] = await db
    .update(organizations)
    .set({
      nextQuoteNumber: sql`${organizations.nextQuoteNumber} + 1`,
    })
    .where(eq(organizations.id, organizationId))
    .returning({
      prefix: organizations.quotePrefix,
      nextNumber: organizations.nextQuoteNumber,
    });

  // nextNumber is already incremented, so the current one is nextNumber - 1
  const num = String((org.nextNumber ?? 1) - 1).padStart(3, "0");
  return `${org.prefix ?? "DE"}-${year}-${num}`;
}

export async function generateInvoiceNumber(
  organizationId: string
): Promise<string> {
  const year = new Date().getFullYear();

  const [org] = await db
    .update(organizations)
    .set({
      nextInvoiceNumber: sql`${organizations.nextInvoiceNumber} + 1`,
    })
    .where(eq(organizations.id, organizationId))
    .returning({
      prefix: organizations.invoicePrefix,
      nextNumber: organizations.nextInvoiceNumber,
    });

  const num = String((org.nextNumber ?? 1) - 1).padStart(3, "0");
  return `${org.prefix ?? "FA"}-${year}-${num}`;
}
