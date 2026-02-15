export interface Payment {
  id: string;
  organizationId: string;
  invoiceId: string;
  amount: string;
  paymentDate: string;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string | null;
  notes: string | null;
  refundOf: string | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  // Joined fields
  invoiceNumber?: string;
  clientName?: string;
  clientId?: string;
}

export type PaymentStatus = "pending" | "received" | "failed" | "refunded";
export type PaymentMethod =
  | "bank_transfer"
  | "check"
  | "card"
  | "cash"
  | "paypal"
  | "stripe"
  | "other";

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: "En attente",
  received: "Reçu",
  failed: "Échoué",
  refunded: "Remboursé",
};

export const paymentStatusColors: Record<PaymentStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  received: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-orange-100 text-orange-700",
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  bank_transfer: "Virement",
  check: "Chèque",
  card: "Carte bancaire",
  cash: "Espèces",
  paypal: "PayPal",
  stripe: "Stripe",
  other: "Autre",
};

export interface TreasuryStats {
  totalReceived: number;
  totalPending: number;
  totalOverdue: number;
  monthlyRevenue: { month: string; amount: number }[];
  recentPayments: Payment[];
}
