import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "status_change"
  | "pdf_generated"
  | "email_sent"
  | "payment_received"
  | "duplicate"
  | "convert";

interface AuditEntry {
  organizationId: string;
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(entry: AuditEntry) {
  try {
    await db.insert(auditLogs).values({
      organizationId: entry.organizationId,
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      oldValues: entry.oldValues,
      newValues: entry.newValues,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
    });
  } catch (err) {
    // Log to console but never crash the main operation
    console.warn("[audit] Failed to write audit log:", err);
  }
}
