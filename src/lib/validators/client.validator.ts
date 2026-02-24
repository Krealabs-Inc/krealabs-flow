import { z } from "zod";

const pipelineStageValues = [
  "prospect",
  "contact_made",
  "proposal_sent",
  "negotiation",
  "active",
  "inactive",
  "lost",
] as const;

export const createClientSchema = z.object({
  companyName: z.string().min(1, "Le nom de l'entreprise est requis"),
  legalName: z.string().optional(),
  siret: z
    .string()
    .regex(/^\d{14}$/, "Le SIRET doit contenir 14 chiffres")
    .optional()
    .or(z.literal("")),
  tvaNumber: z.string().optional(),

  contactFirstName: z.string().optional(),
  contactLastName: z.string().optional(),
  contactEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  contactPosition: z.string().optional(),

  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().length(2).default("FR"),

  paymentTerms: z.coerce.number().int().positive().optional(),
  tvaRate: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().optional(),

  pipelineStage: z.enum(pipelineStageValues).optional(),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
