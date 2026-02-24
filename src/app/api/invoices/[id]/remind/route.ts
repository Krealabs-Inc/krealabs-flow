import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { invoices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { success, error } from "@/lib/utils/api-response";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [inv] = await db
      .update(invoices)
      .set({
        reminderCount: sql`COALESCE(${invoices.reminderCount}, 0) + 1`,
        lastReminderAt: new Date(),
      })
      .where(eq(invoices.id, id))
      .returning();
    if (!inv) {
      return error("Facture non trouvée", 404);
    }
    return success(inv);
  } catch (e) {
    return error(e instanceof Error ? e.message : "Erreur", 500);
  }
}
