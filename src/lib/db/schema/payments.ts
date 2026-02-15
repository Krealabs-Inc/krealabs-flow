import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  decimal,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { invoices } from "./invoices";
import { users } from "./users";
import { paymentStatusEnum, paymentMethodEnum } from "./enums";

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id),

    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    paymentDate: date("payment_date").notNull(),
    method: paymentMethodEnum("method").notNull().default("bank_transfer"),
    status: paymentStatusEnum("status").notNull().default("received"),

    reference: varchar("reference", { length: 255 }),
    notes: text("notes"),

    refundOf: uuid("refund_of"),

    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_payments_invoice").on(table.invoiceId)]
);
