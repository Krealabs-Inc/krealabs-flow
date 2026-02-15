export interface Contract {
  id: string;
  organizationId: string;
  clientId: string;
  projectId: string | null;
  contractNumber: string;
  name: string;
  description: string | null;
  status: ContractStatus;
  startDate: string;
  endDate: string;
  autoRenew: boolean | null;
  renewalNoticeDays: number | null;
  renewedFrom: string | null;
  annualAmountHt: string;
  billingFrequency: BillingFrequency;
  nextBillingDate: string | null;
  lastBilledDate: string | null;
  terms: string | null;
  pdfUrl: string | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  // Joined
  clientName?: string;
}

export type ContractStatus =
  | "draft"
  | "active"
  | "renewal_pending"
  | "renewed"
  | "terminated"
  | "expired";

export type BillingFrequency =
  | "monthly"
  | "quarterly"
  | "semi_annual"
  | "annual";

export const contractStatusLabels: Record<ContractStatus, string> = {
  draft: "Brouillon",
  active: "Actif",
  renewal_pending: "Renouvellement en attente",
  renewed: "Renouvelé",
  terminated: "Résilié",
  expired: "Expiré",
};

export const contractStatusColors: Record<ContractStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  active: "bg-green-100 text-green-700",
  renewal_pending: "bg-amber-100 text-amber-700",
  renewed: "bg-blue-100 text-blue-700",
  terminated: "bg-red-100 text-red-700",
  expired: "bg-orange-100 text-orange-700",
};

export const billingFrequencyLabels: Record<BillingFrequency, string> = {
  monthly: "Mensuel",
  quarterly: "Trimestriel",
  semi_annual: "Semestriel",
  annual: "Annuel",
};
