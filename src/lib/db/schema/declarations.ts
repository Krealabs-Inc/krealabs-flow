import {
  pgTable,
  uuid,
  integer,
  decimal,
  timestamp,
  date,
  varchar,
  text,
  unique,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const tvaDeclarations = pgTable(
  "tva_declarations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    year: integer("year").notNull(),
    quarter: integer("quarter").notNull(), // 1, 2, 3, ou 4
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    caHt: decimal("ca_ht", { precision: 12, scale: 2 }).default("0"),
    tvaCollected: decimal("tva_collected", { precision: 12, scale: 2 }).default("0"),
    tvaDeductible: decimal("tva_deductible", { precision: 12, scale: 2 }).default("0"),
    tvaToPay: decimal("tva_to_pay", { precision: 12, scale: 2 }).default("0"),
    declaredAt: timestamp("declared_at", { withTimezone: true }),
    paymentDueDate: date("payment_due_date"),
    status: varchar("status", { length: 20 }).default("pending"), // pending | declared | paid
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    uniqueOrgYearQuarter: unique("tva_decl_org_year_quarter").on(
      table.organizationId,
      table.year,
      table.quarter
    ),
  })
);
