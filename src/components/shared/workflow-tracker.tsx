"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  Receipt,
  Circle,
  DollarSign,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getInvoiceWorkflow,
  INVOICE_TYPE_LABELS,
  QUOTE_STATUS_LABELS,
  INVOICE_STATUS_LABELS,
  getStatusColor,
} from "@/lib/utils/workflow";

interface WorkflowTrackerProps {
  document: {
    id: string;
    type: "quote" | "invoice";
    status: string;
    invoiceType?: string;
    quoteId?: string | null;
    parentInvoiceId?: string | null;
    quoteNumber?: string;
    invoiceNumber?: string;
    totalTtc?: string | null;
    amountPaid?: string | null;
  };
  relatedQuote?: {
    id: string;
    quoteNumber: string;
    status: string;
    totalTtc: string | null;
    depositPercent?: string | null;
  } | null;
  relatedParentInvoice?: {
    id: string;
    invoiceNumber: string;
    type: string;
    status: string;
    totalTtc: string | null;
  } | null;
  relatedFinalInvoice?: {
    id: string;
    invoiceNumber: string;
    status: string;
    totalTtc: string | null;
  } | null;
}

const fmt = (val: string | null) =>
  parseFloat(val ?? "0").toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });

function StepIndicator({
  status,
  label,
  isActive = false,
  isComplete = false,
  icon: Icon = Circle,
}: {
  status: string;
  label: string;
  isActive?: boolean;
  isComplete?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
          isComplete
            ? "border-green-500 bg-green-50 text-green-600"
            : isActive
              ? "border-primary bg-primary text-primary-foreground shadow-lg scale-110"
              : "border-gray-300 bg-gray-50 text-gray-400"
        }`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="text-center min-w-[80px]">
        <p className={`text-xs font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
          {label}
        </p>
        <Badge
          variant={isComplete ? "outline" : isActive ? "default" : "secondary"}
          className="mt-1 text-xs"
        >
          {status}
        </Badge>
      </div>
    </div>
  );
}

export function WorkflowTracker({
  document,
  relatedQuote,
  relatedParentInvoice,
  relatedFinalInvoice,
}: WorkflowTrackerProps) {
  const router = useRouter();

  if (document.type === "invoice") {
    const workflow = getInvoiceWorkflow({
      type: document.invoiceType!,
      quoteId: document.quoteId,
      parentInvoiceId: document.parentInvoiceId,
      status: document.status,
    });

    const isDeposit = document.invoiceType === "deposit";
    const isFinal = document.invoiceType === "final";
    const isStandard = document.invoiceType === "standard";
    const hasQuote = !!relatedQuote;

    // Calculer la progression
    let progressPercent = 0;
    let progressSteps = 0;
    let totalSteps = hasQuote ? 3 : 2; // Devis (optionnel) + Facture + Paiement

    if (hasQuote && (relatedQuote.status === "partially_invoiced" || relatedQuote.status === "fully_invoiced")) {
      progressSteps++;
    }

    if (isDeposit) {
      totalSteps = 4; // Devis + Acompte + Solde + Paiement
      if (document.status === "paid" || document.status === "partially_paid") progressSteps++;
      if (relatedFinalInvoice) progressSteps++;
      if (relatedFinalInvoice?.status === "paid") progressSteps++;
    } else if (isFinal) {
      totalSteps = 4;
      progressSteps = 3; // Devis accepté + Acompte payé + Solde créé
      if (document.status === "paid") progressSteps++;
    } else if (isStandard) {
      if (hasQuote) progressSteps++;
      progressSteps++; // Facture créée
      if (document.status === "paid") progressSteps++;
    }

    progressPercent = (progressSteps / totalSteps) * 100;

    return (
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-5 w-5" />
              Suivi du workflow
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Progression
              </span>
              <Badge variant="outline" className="font-mono">
                {progressSteps}/{totalSteps}
              </Badge>
            </div>
          </div>
          <Progress value={progressPercent} className="mt-3 h-2" />
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Timeline horizontale */}
            <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
              {/* Étape 1: Devis (si existe) */}
              {hasQuote && (
                <>
                  <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => router.push(`/quotes/${relatedQuote?.id}`)}>
                    <StepIndicator
                      status={QUOTE_STATUS_LABELS[relatedQuote?.status as keyof typeof QUOTE_STATUS_LABELS] || relatedQuote?.status || ""}
                      label="Devis"
                      isComplete={relatedQuote?.status === "fully_invoiced" || relatedQuote?.status === "partially_invoiced"}
                      icon={FileText}
                    />
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs font-mono"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/quotes/${relatedQuote?.id}`);
                      }}
                    >
                      {relatedQuote?.quoteNumber}
                    </Button>
                  </div>
                  <div className="flex items-center justify-center h-12">
                    <ArrowRight className={`h-5 w-5 ${relatedQuote?.status === "partially_invoiced" || relatedQuote?.status === "fully_invoiced" ? "text-green-500" : "text-gray-300"}`} />
                  </div>
                </>
              )}

              {/* Étape 2: Facture d'acompte (si existe) */}
              {isFinal && relatedParentInvoice && (
                <>
                  <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => router.push(`/invoices/${relatedParentInvoice.id}`)}>
                    <StepIndicator
                      status={INVOICE_STATUS_LABELS[relatedParentInvoice.status as keyof typeof INVOICE_STATUS_LABELS]}
                      label="Acompte"
                      isComplete={relatedParentInvoice.status === "paid"}
                      icon={relatedParentInvoice.status === "paid" ? CheckCircle2 : DollarSign}
                    />
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs font-mono"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/invoices/${relatedParentInvoice.id}`);
                      }}
                    >
                      {relatedParentInvoice.invoiceNumber}
                    </Button>
                  </div>
                  <div className="flex items-center justify-center h-12">
                    <ArrowRight className="h-5 w-5 text-green-500" />
                  </div>
                </>
              )}

              {/* Étape actuelle */}
              <div className="flex flex-col items-center gap-2">
                <StepIndicator
                  status={INVOICE_STATUS_LABELS[document.status as keyof typeof INVOICE_STATUS_LABELS]}
                  label={INVOICE_TYPE_LABELS[document.invoiceType as keyof typeof INVOICE_TYPE_LABELS]}
                  isActive={true}
                  isComplete={document.status === "paid"}
                  icon={Receipt}
                />
                <p className="text-sm font-bold font-mono">
                  {document.invoiceNumber}
                </p>
              </div>

              {/* Étape suivante: Facture de solde (si applicable) */}
              {isDeposit && (
                <>
                  <div className="flex items-center justify-center h-12">
                    <ArrowRight className={`h-5 w-5 ${relatedFinalInvoice ? "text-green-500" : "text-gray-300"}`} />
                  </div>
                  {relatedFinalInvoice ? (
                    <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => router.push(`/invoices/${relatedFinalInvoice.id}`)}>
                      <StepIndicator
                        status={INVOICE_STATUS_LABELS[relatedFinalInvoice.status as keyof typeof INVOICE_STATUS_LABELS]}
                        label="Solde"
                        isComplete={relatedFinalInvoice.status === "paid"}
                        icon={FileCheck}
                      />
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs font-mono"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/invoices/${relatedFinalInvoice.id}`);
                        }}
                      >
                        {relatedFinalInvoice.invoiceNumber}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <StepIndicator
                        status="En attente"
                        label="Solde"
                        icon={Clock}
                      />
                      <p className="text-xs text-muted-foreground">
                        À créer
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Résumé des montants */}
            {(isDeposit || isFinal) && relatedQuote && (
              <div className="rounded-lg border-2 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    Répartition financière
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total devis</span>
                    <span className="text-sm font-bold">
                      {fmt(relatedQuote.totalTtc)}
                    </span>
                  </div>
                  {isDeposit && (
                    <>
                      <div className="h-px bg-border" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Acompte ({relatedQuote.depositPercent}%)
                        </span>
                        <span className="text-sm font-semibold text-orange-600">
                          {fmt(document.totalTtc ?? null)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Payé</span>
                        <span className="text-sm font-semibold text-green-600">
                          {fmt(document.amountPaid ?? null)}
                        </span>
                      </div>
                      {relatedFinalInvoice && (
                        <>
                          <div className="h-px bg-border" />
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Solde restant</span>
                            <span className="text-sm font-semibold text-blue-600">
                              {fmt(relatedFinalInvoice.totalTtc)}
                            </span>
                          </div>
                        </>
                      )}
                    </>
                  )}
                  {isFinal && relatedParentInvoice && (
                    <>
                      <div className="h-px bg-border" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Acompte déjà payé</span>
                        <span className="text-sm font-semibold text-green-600">
                          {fmt(relatedParentInvoice.totalTtc)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Solde à payer</span>
                        <span className="text-sm font-bold text-blue-600">
                          {fmt(document.totalTtc ?? null)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Alertes / Infos */}
            {isDeposit && document.status === "paid" && !relatedFinalInvoice && (
              <div className="flex items-start gap-3 rounded-lg border-2 border-green-200 bg-green-50 dark:bg-green-950/20 p-4 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    ✅ Acompte payé - Prochaine étape
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-200 mt-1">
                    L'acompte a été payé avec succès. Vous pouvez maintenant créer la facture de solde pour finaliser le projet.
                  </p>
                </div>
              </div>
            )}

            {isDeposit && relatedFinalInvoice && relatedFinalInvoice.status === "paid" && (
              <div className="flex items-start gap-3 rounded-lg border-2 border-purple-200 bg-purple-50 dark:bg-purple-950/20 p-4 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-purple-900 dark:text-purple-100">
                    🎉 Projet complètement payé
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-200 mt-1">
                    L'acompte et le solde ont tous deux été payés. Le workflow est terminé avec succès.
                  </p>
                </div>
              </div>
            )}

            {isFinal && document.status !== "paid" && (
              <div className="flex items-start gap-3 rounded-lg border-2 border-orange-200 bg-orange-50 dark:bg-orange-950/20 p-4 shadow-sm">
                <Clock className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-orange-900 dark:text-orange-100">
                    ⏳ En attente du paiement du solde
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-200 mt-1">
                    L'acompte a été payé. Cette facture de solde doit maintenant être payée pour finaliser le projet.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Pour les devis
  const isPartiallyInvoiced = document.status === "partially_invoiced";
  const isFullyInvoiced = document.status === "fully_invoiced";
  const isInvoiced = isPartiallyInvoiced || isFullyInvoiced;

  return (
    <Card className="border-2">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-5 w-5" />
          Suivi du devis
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <StepIndicator
              status={QUOTE_STATUS_LABELS[document.status as keyof typeof QUOTE_STATUS_LABELS]}
              label={`Devis ${document.quoteNumber}`}
              isActive={!isInvoiced}
              isComplete={isInvoiced}
              icon={FileText}
            />

            {isInvoiced && (
              <>
                <ArrowRight className="h-5 w-5 text-green-500" />
                <StepIndicator
                  status={isPartiallyInvoiced ? "En cours" : "Terminé"}
                  label="Facturation"
                  isActive={isPartiallyInvoiced}
                  isComplete={isFullyInvoiced}
                  icon={isFullyInvoiced ? CheckCircle2 : Clock}
                />
              </>
            )}
          </div>

          {isPartiallyInvoiced && (
            <div className="flex items-start gap-3 rounded-lg border-2 border-blue-200 bg-blue-50 dark:bg-blue-950/20 p-4">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  🔄 Partiellement facturé
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                  Une facture d'acompte a été créée. La facture de solde sera créée une fois l'acompte payé.
                </p>
              </div>
            </div>
          )}

          {isFullyInvoiced && (
            <div className="flex items-start gap-3 rounded-lg border-2 border-green-200 bg-green-50 dark:bg-green-950/20 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-green-900 dark:text-green-100">
                  ✅ Entièrement facturé
                </p>
                <p className="text-sm text-green-700 dark:text-green-200 mt-1">
                  Ce devis a été entièrement converti en facture(s). Le workflow est terminé.
                </p>
              </div>
            </div>
          )}

          {!isInvoiced && document.status === "accepted" && (
            <div className="flex items-start gap-3 rounded-lg border-2 border-purple-200 bg-purple-50 dark:bg-purple-950/20 p-4">
              <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-purple-900 dark:text-purple-100">
                  🚀 Prêt à être converti
                </p>
                <p className="text-sm text-purple-700 dark:text-purple-200 mt-1">
                  Ce devis a été accepté et peut maintenant être converti en facture.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
