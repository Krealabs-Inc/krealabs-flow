/**
 * Système de nomenclature professionnel pour les devis et factures
 *
 * Format devis : DV-{YY}{MM}-{SEQ}
 * Format facture standard : FC-{YY}{MM}-{SEQ}
 * Format facture acompte : FA-{YY}{MM}-{SEQ}
 * Format facture solde : FS-{YY}{MM}-{SEQ}
 * Format avoir : AV-{YY}{MM}-{SEQ}
 *
 * Exemples :
 * - DV-2601-001 : Devis janvier 2026, séquence 001
 * - FA-2601-001 : Facture d'acompte janvier 2026, séquence 001
 * - FS-2601-002 : Facture de solde janvier 2026, séquence 002
 */

import { db } from "@/lib/db";
import { quotes, invoices } from "@/lib/db/schema";
import { eq, and, like, desc } from "drizzle-orm";

interface NumberingConfig {
  prefix: string;
  description: string;
}

const PREFIXES: Record<string, NumberingConfig> = {
  quote: {
    prefix: "DV",
    description: "Devis",
  },
  invoice_standard: {
    prefix: "FC",
    description: "Facture",
  },
  invoice_deposit: {
    prefix: "FA",
    description: "Facture d'Acompte",
  },
  invoice_final: {
    prefix: "FS",
    description: "Facture de Solde",
  },
  invoice_credit_note: {
    prefix: "AV",
    description: "Avoir",
  },
  invoice_recurring: {
    prefix: "FR",
    description: "Facture Récurrente",
  },
};

/**
 * Génère le préfixe avec année et mois
 * Format: {PREFIX}-{YY}{MM}
 */
function generatePrefix(type: string, date: Date = new Date()): string {
  const config = PREFIXES[type];
  if (!config) throw new Error(`Type inconnu: ${type}`);

  const year = date.getFullYear().toString().slice(-2); // 2026 -> 26
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // 01-12

  return `${config.prefix}-${year}${month}`;
}

/**
 * Extrait le numéro de séquence d'un numéro complet
 */
function extractSequence(number: string): number {
  const parts = number.split("-");
  if (parts.length !== 3) return 0;
  return parseInt(parts[2], 10) || 0;
}

/**
 * Génère le numéro suivant pour un type donné
 */
async function getNextSequence(
  organizationId: string,
  prefix: string,
  table: typeof quotes | typeof invoices
): Promise<number> {
  const pattern = `${prefix}-%`;

  let maxNumber = 0;

  if (table === quotes) {
    const results = await db
      .select({ quoteNumber: quotes.quoteNumber })
      .from(quotes)
      .where(
        and(
          eq(quotes.organizationId, organizationId),
          like(quotes.quoteNumber, pattern)
        )
      )
      .orderBy(desc(quotes.quoteNumber))
      .limit(10);

    for (const result of results) {
      const seq = extractSequence(result.quoteNumber);
      if (seq > maxNumber) maxNumber = seq;
    }
  } else {
    const results = await db
      .select({ invoiceNumber: invoices.invoiceNumber })
      .from(invoices)
      .where(
        and(
          eq(invoices.organizationId, organizationId),
          like(invoices.invoiceNumber, pattern)
        )
      )
      .orderBy(desc(invoices.invoiceNumber))
      .limit(10);

    for (const result of results) {
      const seq = extractSequence(result.invoiceNumber);
      if (seq > maxNumber) maxNumber = seq;
    }
  }

  return maxNumber + 1;
}

/**
 * Génère un numéro de devis
 * Format: DV-{YY}{MM}-{SEQ}
 * Exemple: DV-2601-001
 */
export async function generateQuoteNumber(
  organizationId: string,
  date?: Date
): Promise<string> {
  const prefix = generatePrefix("quote", date);
  const sequence = await getNextSequence(organizationId, prefix, quotes);
  const seqStr = sequence.toString().padStart(3, "0");

  return `${prefix}-${seqStr}`;
}

/**
 * Génère un numéro de facture selon son type
 * Format: {PREFIX}-{YY}{MM}-{SEQ}
 */
export async function generateInvoiceNumber(
  organizationId: string,
  type: "standard" | "deposit" | "final" | "credit_note" | "recurring" = "standard",
  date?: Date
): Promise<string> {
  const typeKey = `invoice_${type}`;
  const prefix = generatePrefix(typeKey, date);
  const sequence = await getNextSequence(organizationId, prefix, invoices);
  const seqStr = sequence.toString().padStart(3, "0");

  return `${prefix}-${seqStr}`;
}

/**
 * Parse un numéro pour extraire ses composants
 */
export function parseNumber(number: string): {
  prefix: string;
  year: number;
  month: number;
  sequence: number;
  type: string;
} | null {
  const parts = number.split("-");
  if (parts.length !== 3) return null;

  const [prefix, yearMonth, seqStr] = parts;

  if (yearMonth.length !== 4) return null;

  const year = 2000 + parseInt(yearMonth.slice(0, 2), 10);
  const month = parseInt(yearMonth.slice(2, 4), 10);
  const sequence = parseInt(seqStr, 10);

  const typeEntry = Object.entries(PREFIXES).find(
    ([_, config]) => config.prefix === prefix
  );

  return {
    prefix,
    year,
    month,
    sequence,
    type: typeEntry ? typeEntry[0] : "unknown",
  };
}

/**
 * Valide un numéro
 */
export function validateNumber(number: string): boolean {
  const parsed = parseNumber(number);
  if (!parsed) return false;

  if (parsed.year < 2020 || parsed.year > 2050) return false;
  if (parsed.month < 1 || parsed.month > 12) return false;
  if (parsed.sequence < 1) return false;

  return true;
}

/**
 * Obtient la description d'un type de numéro
 */
export function getNumberDescription(number: string): string {
  const parsed = parseNumber(number);
  if (!parsed) return "Numéro invalide";

  const config = PREFIXES[parsed.type];
  if (!config) return "Type inconnu";

  const monthName = new Date(parsed.year, parsed.month - 1).toLocaleDateString(
    "fr-FR",
    { month: "long", year: "numeric" }
  );

  return `${config.description} ${monthName} - N°${parsed.sequence}`;
}
