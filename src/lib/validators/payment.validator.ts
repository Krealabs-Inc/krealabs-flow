import { z } from "zod";

export const createPaymentSchema = z.object({
  invoiceId: z.string().uuid("Facture requise"),
  amount: z.coerce.number().positive("Le montant doit être positif"),
  paymentDate: z.string().min(1, "La date est requise"),
  method: z
    .enum([
      "bank_transfer",
      "check",
      "card",
      "cash",
      "paypal",
      "stripe",
      "other",
    ])
    .default("bank_transfer"),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const updatePaymentSchema = z.object({
  status: z.enum(["pending", "received", "failed", "refunded"]).optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
