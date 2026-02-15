import { z } from "zod";

export const invoiceLineSchema = z.object({
  id: z.string().uuid().optional(),
  sortOrder: z.coerce.number().int().default(0),
  isSection: z.boolean().default(false),
  description: z.string().min(1, "La description est requise"),
  details: z.string().optional(),
  quantity: z.coerce.number().positive().default(1),
  unit: z.string().default("unit"),
  unitPriceHt: z.coerce.number().min(0).default(0),
  tvaRate: z.coerce.number().min(0).max(100).default(20),
});

export const createInvoiceSchema = z.object({
  clientId: z.string().uuid("Client requis"),
  projectId: z.string().uuid().optional(),
  quoteId: z.string().uuid().optional(),
  contractId: z.string().uuid().optional(),
  reference: z.string().optional(),
  type: z
    .enum(["standard", "deposit", "final", "credit_note", "recurring"])
    .default("standard"),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  introduction: z.string().optional(),
  footerNotes: z.string().optional(),
  notes: z.string().optional(),
  templateId: z.string().uuid().optional(),
  parentInvoiceId: z.string().uuid().optional(),
  lines: z.array(invoiceLineSchema).min(1, "Au moins une ligne est requise"),
});

export const updateInvoiceSchema = createInvoiceSchema.partial().extend({
  lines: z.array(invoiceLineSchema).optional(),
});

export type InvoiceLineInput = z.infer<typeof invoiceLineSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
