/**
 * Workflow et gestion des statuts pour les devis et factures
 *
 * Ce fichier définit les transitions d'état valides et les workflows possibles
 */

// Types de workflows possibles
export type WorkflowType =
  | "quote_to_full_invoice"      // Devis → Facture complète (sans acompte)
  | "quote_to_deposit"           // Devis → Facture d'acompte
  | "deposit_to_final"           // Facture d'acompte → Facture de solde
  | "direct_invoice";            // Facture directe (sans devis)

// Statuts de devis avec leurs transitions possibles
export const QUOTE_STATUS_TRANSITIONS = {
  draft: ["sent", "rejected"],
  sent: ["viewed", "accepted", "rejected", "expired"],
  viewed: ["accepted", "rejected", "expired"],
  accepted: ["partially_invoiced", "fully_invoiced"], // Peut être converti en facture
  rejected: [], // État terminal
  expired: ["sent"], // Peut être relancé
  partially_invoiced: ["fully_invoiced"], // Peut créer le solde
  fully_invoiced: [], // État terminal - Tout est facturé
} as const;

// Statuts de facture avec leurs transitions possibles
export const INVOICE_STATUS_TRANSITIONS = {
  draft: ["sent", "cancelled"],
  sent: ["viewed", "partially_paid", "paid", "overdue", "cancelled"],
  viewed: ["partially_paid", "paid", "overdue", "cancelled"],
  partially_paid: ["paid", "overdue", "cancelled"],
  paid: ["refunded"], // Peut générer un avoir
  overdue: ["partially_paid", "paid", "cancelled"],
  cancelled: [], // État terminal
  refunded: [], // État terminal
} as const;

// Types de factures et leurs workflows associés
export const INVOICE_TYPE_WORKFLOWS = {
  standard: {
    canHaveDeposit: false,
    canHaveFinal: false,
    requiresQuote: false,
    updatesQuoteStatus: "fully_invoiced", // Met le devis en "entièrement facturé"
    description: "Facture standard complète",
  },
  deposit: {
    canHaveDeposit: false,
    canHaveFinal: true, // Peut générer une facture de solde
    requiresQuote: true,
    updatesQuoteStatus: "partially_invoiced", // Met le devis en "partiellement facturé"
    description: "Facture d'acompte (nécessite un devis avec acompte)",
  },
  final: {
    canHaveDeposit: false,
    canHaveFinal: false,
    requiresParent: true, // Nécessite une facture d'acompte parente
    requiresQuote: true,
    updatesQuoteStatus: "fully_invoiced", // Met le devis en "entièrement facturé"
    description: "Facture de solde (complément d'un acompte)",
  },
  credit_note: {
    canHaveDeposit: false,
    canHaveFinal: false,
    requiresParent: true, // Nécessite une facture à avoir
    updatesQuoteStatus: null, // N'affecte pas le statut du devis
    description: "Avoir (remboursement ou annulation)",
  },
  recurring: {
    canHaveDeposit: false,
    canHaveFinal: false,
    requiresContract: true,
    updatesQuoteStatus: null, // N'affecte pas le statut du devis
    description: "Facture récurrente (basée sur un contrat)",
  },
} as const;

// Règles de validation pour la création de facture de solde
export const FINAL_INVOICE_RULES = {
  depositMustBePaid: true,
  depositMinPaymentPercent: 1, // Au moins 1% payé
  canCreateOnlyOneFinal: true, // Une seule facture de solde par acompte
} as const;

// Labels pour l'affichage
export const INVOICE_TYPE_LABELS = {
  standard: "Facture",
  deposit: "Facture d'acompte",
  final: "Facture de solde",
  credit_note: "Avoir",
  recurring: "Facture récurrente",
} as const;

export const QUOTE_STATUS_LABELS = {
  draft: "Brouillon",
  sent: "Envoyé",
  viewed: "Consulté",
  accepted: "Accepté",
  rejected: "Refusé",
  expired: "Expiré",
  partially_invoiced: "Partiellement facturé",
  fully_invoiced: "Entièrement facturé",
} as const;

export const INVOICE_STATUS_LABELS = {
  draft: "Brouillon",
  sent: "Envoyée",
  viewed: "Consultée",
  partially_paid: "Partiellement payée",
  paid: "Payée",
  overdue: "En retard",
  cancelled: "Annulée",
  refunded: "Remboursée",
} as const;

// Fonctions de validation
export function canConvertQuoteToInvoice(quote: {
  status: string;
  depositPercent?: string | null;
}): { canConvert: boolean; type: "deposit" | "standard"; reason?: string } {
  if (quote.status !== "accepted") {
    return {
      canConvert: false,
      type: "standard",
      reason: "Le devis doit être accepté pour être converti",
    };
  }

  const hasDeposit = quote.depositPercent && parseFloat(quote.depositPercent) > 0;

  return {
    canConvert: true,
    type: hasDeposit ? "deposit" : "standard",
  };
}

export function canCreateFinalInvoice(deposit: {
  type: string;
  status: string;
  quoteId?: string | null;
  amountPaid?: string | null;
  totalTtc?: string | null;
}): { canCreate: boolean; reason?: string } {
  if (deposit.type !== "deposit") {
    return {
      canCreate: false,
      reason: "Cette facture n'est pas une facture d'acompte",
    };
  }

  if (!deposit.quoteId) {
    return {
      canCreate: false,
      reason: "Impossible de trouver le devis d'origine",
    };
  }

  const amountPaid = parseFloat(deposit.amountPaid ?? "0");
  const totalTtc = parseFloat(deposit.totalTtc ?? "0");
  const paymentPercent = (amountPaid / totalTtc) * 100;

  if (paymentPercent < FINAL_INVOICE_RULES.depositMinPaymentPercent) {
    return {
      canCreate: false,
      reason: `L'acompte doit être payé au minimum à ${FINAL_INVOICE_RULES.depositMinPaymentPercent}%`,
    };
  }

  if (deposit.status !== "paid" && deposit.status !== "partially_paid") {
    return {
      canCreate: false,
      reason: "L'acompte doit être payé (au moins partiellement) avant de créer la facture de solde",
    };
  }

  return { canCreate: true };
}

export function getInvoiceWorkflow(invoice: {
  type: string;
  quoteId?: string | null;
  parentInvoiceId?: string | null;
  status: string;
}): {
  workflow: WorkflowType;
  nextSteps: string[];
  relatedDocuments: { type: string; id: string | null }[];
} {
  const relatedDocuments: { type: string; id: string | null }[] = [];
  let workflow: WorkflowType = "direct_invoice";
  let nextSteps: string[] = [];

  if (invoice.quoteId) {
    relatedDocuments.push({ type: "quote", id: invoice.quoteId });
  }

  if (invoice.parentInvoiceId) {
    relatedDocuments.push({ type: "parent_invoice", id: invoice.parentInvoiceId });
  }

  // Déterminer le workflow
  if (invoice.type === "deposit" && invoice.quoteId) {
    workflow = "quote_to_deposit";
    if (invoice.status === "paid" || invoice.status === "partially_paid") {
      nextSteps.push("create_final_invoice");
    }
  } else if (invoice.type === "final" && invoice.parentInvoiceId) {
    workflow = "deposit_to_final";
  } else if (invoice.type === "standard" && invoice.quoteId) {
    workflow = "quote_to_full_invoice";
  } else {
    workflow = "direct_invoice";
  }

  // Ajouter les prochaines étapes possibles selon le statut
  const possibleTransitions = INVOICE_STATUS_TRANSITIONS[invoice.status as keyof typeof INVOICE_STATUS_TRANSITIONS] || [];
  nextSteps.push(...possibleTransitions);

  return {
    workflow,
    nextSteps,
    relatedDocuments,
  };
}

// Helper pour générer les badges de statut avec couleurs
export function getStatusBadgeVariant(
  status: string,
  type: "quote" | "invoice"
): "default" | "secondary" | "destructive" | "outline" {
  if (type === "quote") {
    switch (status) {
      case "draft":
        return "secondary";
      case "sent":
      case "viewed":
        return "default";
      case "accepted":
        return "outline";
      case "partially_invoiced":
        return "default"; // En cours
      case "fully_invoiced":
        return "outline"; // Terminé avec succès
      case "rejected":
      case "expired":
        return "destructive";
      default:
        return "default";
    }
  } else {
    switch (status) {
      case "draft":
        return "secondary";
      case "sent":
      case "viewed":
        return "default";
      case "paid":
        return "outline";
      case "partially_paid":
        return "default";
      case "overdue":
      case "cancelled":
      case "refunded":
        return "destructive";
      default:
        return "default";
    }
  }
}

// Helper pour obtenir une couleur de statut
export function getStatusColor(status: string, type: "quote" | "invoice"): string {
  if (type === "quote") {
    switch (status) {
      case "draft":
        return "text-gray-600";
      case "sent":
        return "text-blue-600";
      case "viewed":
        return "text-blue-700";
      case "accepted":
        return "text-purple-600";
      case "partially_invoiced":
        return "text-orange-600";
      case "fully_invoiced":
        return "text-green-600";
      case "rejected":
        return "text-red-600";
      case "expired":
        return "text-red-500";
      default:
        return "text-gray-600";
    }
  } else {
    switch (status) {
      case "draft":
        return "text-gray-600";
      case "sent":
        return "text-blue-600";
      case "viewed":
        return "text-blue-700";
      case "partially_paid":
        return "text-orange-600";
      case "paid":
        return "text-green-600";
      case "overdue":
        return "text-red-600";
      case "cancelled":
        return "text-red-500";
      case "refunded":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  }
}

