export interface QuoteLine {
  id: string;
  quoteId: string;
  sortOrder: number;
  isSection: boolean | null;
  isOptional: boolean | null;
  description: string;
  details: string | null;
  quantity: string | null;
  unit: string | null;
  unitPriceHt: string | null;
  tvaRate: string | null;
  totalHt: string | null;
  totalTva: string | null;
  totalTtc: string | null;
  createdAt: string | null;
}

export interface Quote {
  id: string;
  organizationId: string;
  clientId: string;
  projectId: string | null;
  quoteNumber: string;
  reference: string | null;
  status: QuoteStatus;
  issueDate: string | null;
  validityDate: string;
  acceptedDate: string | null;
  subtotalHt: string | null;
  totalTva: string | null;
  totalTtc: string | null;
  discountPercent: string | null;
  discountAmount: string | null;
  depositPercent: string | null;
  depositAmount: string | null;
  introduction: string | null;
  terms: string | null;
  notes: string | null;
  templateId: string | null;
  duplicatedFrom: string | null;
  pdfUrl: string | null;
  pdfGeneratedAt: string | null;
  signedAt: string | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  lines: QuoteLine[];
  // joined fields (optional, returned by API when available)
  issuingOrgId?: string | null;
  issuingOrgName?: string | null;
  clientName?: string | null;
}

export type QuoteStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "accepted"
  | "rejected"
  | "expired"
  | "converted";

export const quoteStatusLabels: Record<QuoteStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  viewed: "Vu",
  accepted: "Accepté",
  rejected: "Refusé",
  expired: "Expiré",
  converted: "Converti",
};

export const quoteStatusColors: Record<QuoteStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  viewed: "bg-purple-100 text-purple-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-orange-100 text-orange-700",
  converted: "bg-emerald-100 text-emerald-700",
};

export interface QuoteLineFormData {
  id?: string;
  sortOrder: number;
  isSection: boolean;
  isOptional: boolean;
  description: string;
  details: string;
  quantity: number;
  unit: string;
  unitPriceHt: number;
  tvaRate: number;
}
