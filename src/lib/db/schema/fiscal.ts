import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  text,
  date,
  numeric,
  timestamp,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

/**
 * Configuration fiscale par organisation.
 * Une seule ligne par organisation (clé primaire = organizationId).
 */
export const fiscalConfig = pgTable("fiscal_config", {
  organizationId: uuid("organization_id")
    .primaryKey()
    .references(() => organizations.id),
  creationDate: date("creation_date").notNull(),
  firstClosingDate: date("first_closing_date").notNull(),
  closingMonth: integer("closing_month").notNull().default(12),
  closingDay: integer("closing_day").notNull().default(31),
  tvaRegime: varchar("tva_regime", { length: 50 })
    .notNull()
    .default("reel_simplifie"),
  urssafEnabled: boolean("urssaf_enabled").default(false),
  /**
   * TVA nette annuelle par exercice fiscal (JSON).
   * Format : { "2026": 12000, "2027": 15000 }
   * Utilisé pour le calcul des acomptes TVA de l'année suivante.
   */
  tvaByFiscalYear: jsonb("tva_by_fiscal_year").$type<Record<string, number>>().default({}),
  cfeEstimatedAmount: numeric("cfe_estimated_amount", { precision: 12, scale: 2 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/**
 * Overrides de statut et de montant pour les obligations générées.
 *
 * Le générateur produit des obligations algorithmiquement à chaque appel.
 * Cette table ne stocke que les surcharges (statut payé, montant réel, notes).
 * La clé déterministe `obligation_key` lie l'override à l'obligation générée.
 */
export const fiscalObligations = pgTable(
  "fiscal_obligations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    /**
     * Clé déterministe de l'obligation.
     * Exemples : "TVA_CA12_2027", "TVA_ACOMPTE_JUILLET_2027", "CFE_2027"
     */
    obligationKey: varchar("obligation_key", { length: 100 }).notNull(),
    /** Statut : "pending" | "paid" | "overdue" */
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    /** Montant réel ou ajusté manuellement (surcharge le montant calculé) */
    amountOverride: numeric("amount_override", { precision: 12, scale: 2 }),
    notes: text("notes"),
    /** Date à laquelle l'obligation a été réglée */
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    uniqueIndex("fiscal_oblig_org_key_idx").on(t.organizationId, t.obligationKey),
  ]
);
