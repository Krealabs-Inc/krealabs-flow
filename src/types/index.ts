export interface Client {
  id: string;
  organizationId: string;
  companyName: string | null;
  legalName: string | null;
  siret: string | null;
  tvaNumber: string | null;
  contactFirstName: string | null;
  contactLastName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactPosition: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  paymentTerms: number | null;
  tvaRate: string | null;
  notes: string | null;
  isActive: boolean | null;
  pipelineStage?: "prospect" | "contact_made" | "proposal_sent" | "negotiation" | "active" | "inactive" | "lost" | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export type ClientPipelineStage = "prospect" | "contact_made" | "proposal_sent" | "negotiation" | "active" | "inactive" | "lost";

export const CLIENT_PIPELINE_LABELS: Record<ClientPipelineStage, string> = {
  prospect: "Prospect",
  contact_made: "Prise de contact",
  proposal_sent: "Proposition envoyée",
  negotiation: "En négociation",
  active: "Client actif",
  inactive: "Inactif",
  lost: "Perdu",
};

export const CLIENT_PIPELINE_COLORS: Record<ClientPipelineStage, string> = {
  prospect: "bg-slate-100 text-slate-700",
  contact_made: "bg-blue-100 text-blue-700",
  proposal_sent: "bg-violet-100 text-violet-700",
  negotiation: "bg-amber-100 text-amber-700",
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-500",
  lost: "bg-red-100 text-red-700",
};
