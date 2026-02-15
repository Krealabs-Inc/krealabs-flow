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
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { clients } from "./clients";
import { projects } from "./projects";
import { users } from "./users";
import { contractStatusEnum, billingFrequencyEnum } from "./enums";

export const contracts = pgTable("contracts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  projectId: uuid("project_id").references(() => projects.id),

  contractNumber: varchar("contract_number", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),

  status: contractStatusEnum("status").notNull().default("draft"),

  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),

  autoRenew: boolean("auto_renew").default(true),
  renewalNoticeDays: integer("renewal_notice_days").default(60),
  renewedFrom: uuid("renewed_from"),

  annualAmountHt: decimal("annual_amount_ht", {
    precision: 12,
    scale: 2,
  }).notNull(),
  billingFrequency: billingFrequencyEnum("billing_frequency")
    .notNull()
    .default("monthly"),

  nextBillingDate: date("next_billing_date"),
  lastBilledDate: date("last_billed_date"),

  terms: text("terms"),
  pdfUrl: varchar("pdf_url", { length: 500 }),

  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
