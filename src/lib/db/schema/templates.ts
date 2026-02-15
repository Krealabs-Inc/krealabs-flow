import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { users } from "./users";
import { templateTypeEnum } from "./enums";

export const templates = pgTable("templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),

  name: varchar("name", { length: 255 }).notNull(),
  type: templateTypeEnum("type").notNull(),
  description: text("description"),

  content: jsonb("content").notNull().default({}),
  style: jsonb("style").default({}),

  isDefault: boolean("is_default").default(false),

  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
