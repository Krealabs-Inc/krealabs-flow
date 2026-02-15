export interface ProjectMilestone {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  dueDate: string | null;
  completedAt: string | null;
  sortOrder: number | null;
  invoiceId: string | null;
  createdAt: string | null;
}

export interface Project {
  id: string;
  organizationId: string;
  clientId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  estimatedBudget: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  // Joined
  clientName?: string;
  milestones?: ProjectMilestone[];
  quotesCount?: number;
  invoicesCount?: number;
  totalInvoiced?: number;
  totalPaid?: number;
}

export type ProjectStatus =
  | "prospect"
  | "quoted"
  | "in_progress"
  | "on_hold"
  | "completed"
  | "cancelled";

export const projectStatusLabels: Record<ProjectStatus, string> = {
  prospect: "Prospect",
  quoted: "Devisé",
  in_progress: "En cours",
  on_hold: "En pause",
  completed: "Terminé",
  cancelled: "Annulé",
};

export const projectStatusColors: Record<ProjectStatus, string> = {
  prospect: "bg-gray-100 text-gray-700",
  quoted: "bg-blue-100 text-blue-700",
  in_progress: "bg-emerald-100 text-emerald-700",
  on_hold: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};
