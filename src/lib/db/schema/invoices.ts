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
import { quotes } from "./quotes";
import { contracts } from "./contracts";
import { users } from "./users";
import { templates } from "./templates";
import { invoiceStatusEnum, invoiceTypeEnum } from "./enums";

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id),
    projectId: uuid("project_id").references(() => projects.id),
    quoteId: uuid("quote_id").references(() => quotes.id),
    contractId: uuid("contract_id").references(() => contracts.id),

    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
    reference: varchar("reference", { length: 100 }),

    type: invoiceTypeEnum("type").notNull().default("standard"),
    status: invoiceStatusEnum("status").notNull().default("draft"),

    issueDate: date("issue_date").notNull().defaultNow(),
    dueDate: date("due_date").notNull(),
    paidDate: date("paid_date"),

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

    amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).default(
      "0"
    ),
    amountDue: decimal("amount_due", { precision: 12, scale: 2 }).default("0"),

    parentInvoiceId: uuid("parent_invoice_id"),

    introduction: text("introduction"),
    footerNotes: text("footer_notes"),
    notes: text("notes"),

    templateId: uuid("template_id").references(() => templates.id),

    pdfUrl: varchar("pdf_url", { length: 500 }),
    pdfGeneratedAt: timestamp("pdf_generated_at", { withTimezone: true }),

    sentAt: timestamp("sent_at", { withTimezone: true }),
    sentTo: varchar("sent_to", { length: 255 }),
    lastReminderAt: timestamp("last_reminder_at", { withTimezone: true }),
    reminderCount: integer("reminder_count").default(0),

    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_invoices_number").on(
      table.organizationId,
      table.invoiceNumber
    ),
    index("idx_invoices_status").on(table.status),
    index("idx_invoices_due").on(table.dueDate),
  ]
);

export const invoiceLines = pgTable(
  "invoice_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),

    sortOrder: integer("sort_order").notNull().default(0),
    isSection: boolean("is_section").default(false),

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
  (table) => [index("idx_invoice_lines_invoice").on(table.invoiceId)]
);
