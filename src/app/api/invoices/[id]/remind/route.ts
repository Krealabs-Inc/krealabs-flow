import { NextRequest, NextResponse } from "next/server";
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
      return NextResponse.json(error("Facture non trouvée"), { status: 404 });
    }
    return NextResponse.json(success(inv));
  } catch (e) {
    return NextResponse.json(
      error(e instanceof Error ? e.message : "Erreur"),
      { status: 500 }
    );
  }
}
