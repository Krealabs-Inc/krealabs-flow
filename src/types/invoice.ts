export interface InvoiceLine {
  id: string;
  invoiceId: string;
  sortOrder: number;
  isSection: boolean | null;
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

export interface Invoice {
  id: string;
  organizationId: string;
  clientId: string;
  projectId: string | null;
  quoteId: string | null;
  contractId: string | null;
  invoiceNumber: string;
  reference: string | null;
  type: InvoiceType;
  status: InvoiceStatus;
  issueDate: string | null;
  dueDate: string;
  paidDate: string | null;
  subtotalHt: string | null;
  totalTva: string | null;
  totalTtc: string | null;
  discountPercent: string | null;
  discountAmount: string | null;
  amountPaid: string | null;
  amountDue: string | null;
  parentInvoiceId: string | null;
  introduction: string | null;
  footerNotes: string | null;
  notes: string | null;
  templateId: string | null;
  pdfUrl: string | null;
  pdfGeneratedAt: string | null;
  sentAt: string | null;
  sentTo: string | null;
  lastReminderAt: string | null;
  reminderCount: number | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  lines: InvoiceLine[];
  // joined fields (optional, returned by API when available)
  issuingOrgId?: string | null;
  issuingOrgName?: string | null;
  clientName?: string | null;
}

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled"
  | "refunded";

export type InvoiceType =
  | "standard"
  | "deposit"
  | "final"
  | "credit_note"
  | "recurring";

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyée",
  viewed: "Vue",
  partially_paid: "Partiellement payée",
  paid: "Payée",
  overdue: "En retard",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

export const invoiceStatusColors: Record<InvoiceStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  viewed: "bg-purple-100 text-purple-700",
  partially_paid: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
  refunded: "bg-orange-100 text-orange-700",
};

export const invoiceTypeLabels: Record<InvoiceType, string> = {
  standard: "Facture",
  deposit: "Acompte",
  final: "Solde",
  credit_note: "Avoir",
  recurring: "Récurrente",
};
