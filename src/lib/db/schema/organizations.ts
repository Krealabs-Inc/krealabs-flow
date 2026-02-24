import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  timestamp,
} from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  legalName: varchar("legal_name", { length: 255 }),
  siren: varchar("siren", { length: 9 }),
  siret: varchar("siret", { length: 14 }),
  tvaNumber: varchar("tva_number", { length: 20 }),

  addressLine1: varchar("address_line1", { length: 255 }),
  addressLine2: varchar("address_line2", { length: 255 }),
  city: varchar("city", { length: 100 }),
  postalCode: varchar("postal_code", { length: 10 }),
  country: varchar("country", { length: 2 }).default("FR"),

  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  logoUrl: varchar("logo_url", { length: 500 }),

  defaultPaymentTerms: integer("default_payment_terms").default(30),
  defaultTvaRate: decimal("default_tva_rate", {
    precision: 5,
    scale: 2,
  }).default("20.00"),
  quoteValidityDays: integer("quote_validity_days").default(30),
  invoicePrefix: varchar("invoice_prefix", { length: 10 }).default("FA"),
  quotePrefix: varchar("quote_prefix", { length: 10 }).default("DE"),
  nextInvoiceNumber: integer("next_invoice_number").default(1),
  nextQuoteNumber: integer("next_quote_number").default(1),

  accountHolder: varchar("account_holder", { length: 255 }),
  bankName: varchar("bank_name", { length: 255 }),
  iban: varchar("iban", { length: 34 }),
  bic: varchar("bic", { length: 11 }),

  legalMentions: text("legal_mentions"),
  quoteTerms: text("quote_terms"),

  plan: varchar("plan", { length: 50 }).default("free"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
