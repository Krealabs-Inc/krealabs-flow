import {
  pgTable,
  varchar,
  uuid,
  boolean,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const userOrganizations = pgTable(
  "user_organizations",
  {
    stackUserId: varchar("stack_user_id", { length: 255 }).notNull(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).default("owner"),
    isPrimary: boolean("is_primary").default(false),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.stackUserId, t.orgId] })]
);
