import { z } from "zod";

export const createContractSchema = z.object({
  clientId: z.string().uuid("Client requis"),
  projectId: z.string().uuid().optional(),
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  startDate: z.string().min(1, "La date de début est requise"),
  endDate: z.string().min(1, "La date de fin est requise"),
  autoRenew: z.boolean().default(true),
  renewalNoticeDays: z.coerce.number().int().min(0).default(60),
  annualAmountHt: z.coerce.number().positive("Le montant annuel est requis"),
  billingFrequency: z
    .enum(["monthly", "quarterly", "semi_annual", "annual"])
    .default("monthly"),
  terms: z.string().optional(),
});

export const updateContractSchema = createContractSchema.partial();

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
