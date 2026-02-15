import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),

    companyName: varchar("company_name", { length: 255 }),
    legalName: varchar("legal_name", { length: 255 }),
    siret: varchar("siret", { length: 14 }),
    tvaNumber: varchar("tva_number", { length: 20 }),

    contactFirstName: varchar("contact_first_name", { length: 100 }),
    contactLastName: varchar("contact_last_name", { length: 100 }),
    contactEmail: varchar("contact_email", { length: 255 }),
    contactPhone: varchar("contact_phone", { length: 20 }),
    contactPosition: varchar("contact_position", { length: 100 }),

    addressLine1: varchar("address_line1", { length: 255 }),
    addressLine2: varchar("address_line2", { length: 255 }),
    city: varchar("city", { length: 100 }),
    postalCode: varchar("postal_code", { length: 10 }),
    country: varchar("country", { length: 2 }).default("FR"),

    paymentTerms: integer("payment_terms"),
    tvaRate: decimal("tva_rate", { precision: 5, scale: 2 }),
    notes: text("notes"),

    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_clients_org").on(table.organizationId)]
);
