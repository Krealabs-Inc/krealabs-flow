import { z } from "zod";

export const quoteLineSchema = z.object({
  id: z.string().uuid().optional(),
  sortOrder: z.coerce.number().int().default(0),
  isSection: z.boolean().default(false),
  isOptional: z.boolean().default(false),
  description: z.string().min(1, "La description est requise"),
  details: z.string().optional(),
  quantity: z.coerce.number().positive().default(1),
  unit: z.string().default("unit"),
  unitPriceHt: z.coerce.number().min(0).default(0),
  tvaRate: z.coerce.number().min(0).max(100).default(20),
});

export const createQuoteSchema = z.object({
  clientId: z.string().uuid("Client requis"),
  projectId: z.string().uuid().optional(),
  reference: z.string().optional(),
  issueDate: z.string().optional(),
  validityDate: z.string().optional(),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  depositPercent: z.coerce.number().min(0).max(100).optional(),
  introduction: z.string().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  templateId: z.string().uuid().optional(),
  issuingOrgId: z.string().uuid().optional(),
  lines: z.array(quoteLineSchema).min(1, "Au moins une ligne est requise"),
});

export const updateQuoteSchema = createQuoteSchema.partial().extend({
  lines: z.array(quoteLineSchema).optional(),
});

export type QuoteLineInput = z.infer<typeof quoteLineSchema>;
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;
