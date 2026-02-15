import { pgEnum } from "drizzle-orm/pg-core";

export const quoteStatusEnum = pgEnum("quote_status", [
  "draft",
  "sent",
  "viewed",
  "accepted",
  "rejected",
  "expired",
  "converted",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "viewed",
  "partially_paid",
  "paid",
  "overdue",
  "cancelled",
  "refunded",
]);

export const invoiceTypeEnum = pgEnum("invoice_type", [
  "standard",
  "deposit",
  "final",
  "credit_note",
  "recurring",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "received",
  "failed",
  "refunded",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "bank_transfer",
  "check",
  "card",
  "cash",
  "paypal",
  "stripe",
  "other",
]);

export const projectStatusEnum = pgEnum("project_status", [
  "prospect",
  "quoted",
  "in_progress",
  "on_hold",
  "completed",
  "cancelled",
]);

export const contractStatusEnum = pgEnum("contract_status", [
  "draft",
  "active",
  "renewal_pending",
  "renewed",
  "terminated",
  "expired",
]);

export const billingFrequencyEnum = pgEnum("billing_frequency", [
  "monthly",
  "quarterly",
  "semi_annual",
  "annual",
]);

export const userRoleEnum = pgEnum("user_role", [
  "owner",
  "admin",
  "manager",
  "viewer",
]);

export const templateTypeEnum = pgEnum("template_type", [
  "quote",
  "invoice",
  "contract",
  "email",
]);

export const auditActionEnum = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
  "status_change",
  "pdf_generated",
  "email_sent",
  "payment_received",
  "duplicate",
  "convert",
]);
