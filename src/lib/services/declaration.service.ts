import { db } from "@/lib/db";
import { tvaDeclarations, invoices } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

// Calcule les dates de début/fin d'un trimestre
export function getQuarterDates(
  year: number,
  quarter: number
): { start: string; end: string; paymentDue: string } {
  const quarterMonths: Record<
    number,
    { startM: number; endM: number; paymentM: number; paymentD: number }
  > = {
    1: { startM: 1, endM: 3, paymentM: 4, paymentD: 30 },
    2: { startM: 4, endM: 6, paymentM: 7, paymentD: 31 },
    3: { startM: 7, endM: 9, paymentM: 10, paymentD: 31 },
    4: { startM: 10, endM: 12, paymentM: 1, paymentD: 31 }, // Q4 → paiement jan année suivante
  };
  const q = quarterMonths[quarter];
  const endDay = new Date(year, q.endM, 0).getDate(); // dernier jour du mois
  const paymentYear = quarter === 4 ? year + 1 : year;
  return {
    start: `${year}-${String(q.startM).padStart(2, "0")}-01`,
    end: `${year}-${String(q.endM).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`,
    paymentDue: `${paymentYear}-${String(q.paymentM).padStart(2, "0")}-${String(q.paymentD).padStart(2, "0")}`,
  };
}

// Calcule les montants TVA depuis les factures payées sur la période
export async function calculateTvaForPeriod(
  organizationId: string,
  periodStart: string,
  periodEnd: string
): Promise<{ caHt: string; tvaCollected: string; tvaToPay: string }> {
  const [result] = await db
    .select({
      caHt: sql<string>`COALESCE(SUM(${invoices.subtotalHt}), '0')`,
      tvaCollected: sql<string>`COALESCE(SUM(${invoices.totalTva}), '0')`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.organizationId, organizationId),
        sql`${invoices.status} IN ('paid', 'partially_paid')`,
        sql`${invoices.paidDate} >= ${periodStart}`,
        sql`${invoices.paidDate} <= ${periodEnd}`,
        sql`${invoices.type} != 'credit_note'`
      )
    );

  const tvaCollected = parseFloat(result?.tvaCollected ?? "0");
  return {
    caHt: parseFloat(result?.caHt ?? "0").toFixed(2),
    tvaCollected: tvaCollected.toFixed(2),
    tvaToPay: tvaCollected.toFixed(2), // simplifié: pas de TVA déductible pour l'instant
  };
}

// Récupère ou crée une déclaration pour un trimestre donné
export async function getOrCreateDeclaration(
  organizationId: string,
  year: number,
  quarter: number
) {
  const existing = await db
    .select()
    .from(tvaDeclarations)
    .where(
      and(
        eq(tvaDeclarations.organizationId, organizationId),
        eq(tvaDeclarations.year, year),
        eq(tvaDeclarations.quarter, quarter)
      )
    );

  if (existing.length > 0) return existing[0];

  const { start, end, paymentDue } = getQuarterDates(year, quarter);
  const tvaData = await calculateTvaForPeriod(organizationId, start, end);

  const [created] = await db
    .insert(tvaDeclarations)
    .values({
      organizationId,
      year,
      quarter,
      periodStart: start,
      periodEnd: end,
      paymentDueDate: paymentDue,
      caHt: tvaData.caHt,
      tvaCollected: tvaData.tvaCollected,
      tvaToPay: tvaData.tvaToPay,
      status: "pending",
    })
    .returning();

  return created;
}

// Recalcule et met à jour une déclaration existante
export async function refreshDeclaration(id: string, organizationId: string) {
  const [decl] = await db
    .select()
    .from(tvaDeclarations)
    .where(eq(tvaDeclarations.id, id));

  if (!decl || decl.organizationId !== organizationId) return null;

  const tvaData = await calculateTvaForPeriod(
    organizationId,
    decl.periodStart,
    decl.periodEnd
  );

  const [updated] = await db
    .update(tvaDeclarations)
    .set({ ...tvaData, updatedAt: new Date() })
    .where(eq(tvaDeclarations.id, id))
    .returning();

  return updated;
}

// Liste toutes les déclarations d'une org, crée les manquantes pour l'année courante
export async function listDeclarations(organizationId: string) {
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

  // Créer les trimestres manquants pour l'année courante (jusqu'au trimestre actuel)
  for (let q = 1; q <= currentQuarter; q++) {
    await getOrCreateDeclaration(organizationId, currentYear, q);
  }
  // Créer aussi l'année précédente si elle n'existe pas
  for (let q = 1; q <= 4; q++) {
    await getOrCreateDeclaration(organizationId, currentYear - 1, q);
  }

  return db
    .select()
    .from(tvaDeclarations)
    .where(eq(tvaDeclarations.organizationId, organizationId))
    .orderBy(tvaDeclarations.year, tvaDeclarations.quarter);
}

// Marque une déclaration comme déclarée
export async function markDeclared(
  id: string,
  organizationId: string,
  notes?: string
) {
  const [updated] = await db
    .update(tvaDeclarations)
    .set({
      status: "declared",
      declaredAt: new Date(),
      notes: notes ?? null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(tvaDeclarations.id, id),
        eq(tvaDeclarations.organizationId, organizationId)
      )
    )
    .returning();
  return updated;
}

// Marque une déclaration comme payée
export async function markPaid(id: string, organizationId: string) {
  const [updated] = await db
    .update(tvaDeclarations)
    .set({ status: "paid", updatedAt: new Date() })
    .where(
      and(
        eq(tvaDeclarations.id, id),
        eq(tvaDeclarations.organizationId, organizationId)
      )
    )
    .returning();
  return updated;
}
