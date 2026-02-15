import { z } from "zod";

export const milestoneSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
});

export const createProjectSchema = z.object({
  clientId: z.string().uuid("Client requis"),
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  status: z
    .enum([
      "prospect",
      "quoted",
      "in_progress",
      "on_hold",
      "completed",
      "cancelled",
    ])
    .default("prospect"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  estimatedBudget: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
  milestones: z.array(milestoneSchema).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export type MilestoneInput = z.infer<typeof milestoneSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
