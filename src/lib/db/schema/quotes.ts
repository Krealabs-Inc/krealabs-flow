import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  decimal,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { clients } from "./clients";
import { projects } from "./projects";
import { users } from "./users";
import { templates } from "./templates";
import { quoteStatusEnum } from "./enums";

export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id),
    projectId: uuid("project_id").references(() => projects.id),

    quoteNumber: varchar("quote_number", { length: 50 }).notNull(),
    reference: varchar("reference", { length: 100 }),

    status: quoteStatusEnum("status").notNull().default("draft"),

    issueDate: date("issue_date").notNull().defaultNow(),
    validityDate: date("validity_date").notNull(),
    acceptedDate: date("accepted_date"),

    subtotalHt: decimal("subtotal_ht", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    totalTva: decimal("total_tva", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    totalTtc: decimal("total_ttc", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    discountPercent: decimal("discount_percent", {
      precision: 5,
      scale: 2,
    }).default("0"),
    discountAmount: decimal("discount_amount", {
      precision: 12,
      scale: 2,
    }).default("0"),

    depositPercent: decimal("deposit_percent", { precision: 5, scale: 2 }),
    depositAmount: decimal("deposit_amount", { precision: 12, scale: 2 }),

    introduction: text("introduction"),
    terms: text("terms"),
    notes: text("notes"),

    templateId: uuid("template_id").references(() => templates.id),
    duplicatedFrom: uuid("duplicated_from"),

    pdfUrl: varchar("pdf_url", { length: 500 }),
    pdfGeneratedAt: timestamp("pdf_generated_at", { withTimezone: true }),

    signedAt: timestamp("signed_at", { withTimezone: true }),
    signatureIp: varchar("signature_ip", { length: 45 }),
    signatureData: text("signature_data"),

    issuingOrgId: uuid("issuing_org_id").references(() => organizations.id),

    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_quotes_number").on(
      table.organizationId,
      table.quoteNumber
    ),
  ]
);

export const quoteLines = pgTable(
  "quote_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quoteId: uuid("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),

    sortOrder: integer("sort_order").notNull().default(0),
    isSection: boolean("is_section").default(false),
    isOptional: boolean("is_optional").default(false),

    description: text("description").notNull(),
    details: text("details"),

    quantity: decimal("quantity", { precision: 10, scale: 3 }).default("1"),
    unit: varchar("unit", { length: 20 }).default("unit"),
    unitPriceHt: decimal("unit_price_ht", { precision: 12, scale: 2 }).default(
      "0"
    ),
    tvaRate: decimal("tva_rate", { precision: 5, scale: 2 }).default("20.00"),

    totalHt: decimal("total_ht", { precision: 12, scale: 2 }).default("0"),
    totalTva: decimal("total_tva", { precision: 12, scale: 2 }).default("0"),
    totalTtc: decimal("total_ttc", { precision: 12, scale: 2 }).default("0"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_quote_lines_quote").on(table.quoteId)]
);
