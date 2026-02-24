"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  CreditCard,
  XCircle,
  Trash2,
  FileText,
  AlertTriangle,
  Plus,
  Download,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { PaymentDialog } from "@/components/invoices/payment-dialog";
import { WorkflowTracker } from "@/components/shared/workflow-tracker";
import { invoiceTypeLabels, type Invoice, type InvoiceType } from "@/types/invoice";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { ApiResponse, Client } from "@/types";

const fmt = (val: string | null) =>
  parseFloat(val ?? "0").toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<(Invoice & {
    payments?: Array<{ id: string; amount: string; paymentDate: string; method: string; reference: string | null }>;
    relatedQuote?: any;
    relatedParentInvoice?: any;
    relatedFinalInvoice?: any;
  }) | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [reminderCount, setReminderCount] = useState<number>(0);
  const [lastReminderAt, setLastReminderAt] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  async function load() {
    const res = await fetch(`/api/invoices/${params.id}`);
    const data: ApiResponse<typeof invoice> = await res.json();
    if (data.success && data.data) {
      setInvoice(data.data);
      const clientRes = await fetch(`/api/clients/${data.data.clientId}`);
      const clientData: ApiResponse<Client> = await clientRes.json();
      if (clientData.success) setClient(clientData.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleAction(action: string) {
    if (action === "cancel") {
      setConfirmState({
        open: true,
        title: "Annuler cette facture",
        description: "Êtes-vous sûr de vouloir annuler cette facture ? Cette action est irréversible.",
        confirmText: "Annuler la facture",
        variant: "destructive",
        onConfirm: async () => {
          const res = await fetch(`/api/invoices/${params.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "cancel" }),
          });
          const data = await res.json();
          if (data.success) {
            setInvoice(data.data);
          }
        },
      });
      return;
    }

    if (action === "delete") {
      setConfirmState({
        open: true,
        title: "Supprimer cette facture",
        description: "Êtes-vous sûr de vouloir supprimer cette facture ? Cette action est irréversible.",
        confirmText: "Supprimer",
        variant: "destructive",
        onConfirm: async () => {
          await fetch(`/api/invoices/${params.id}`, { method: "DELETE" });
          router.push("/invoices");
        },
      });
      return;
    }

    if (action === "create_final") {
      setConfirmState({
        open: true,
        title: "Créer la facture de solde",
        description: "Êtes-vous sûr de vouloir créer la facture de solde pour le restant ?",
        confirmText: "Créer",
        variant: "default",
        onConfirm: async () => {
          const res = await fetch(`/api/invoices/${params.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "create_final" }),
          });
          const data = await res.json();
          if (data.success) {
            router.push(`/invoices/${data.data.id}`);
          } else {
            alert(data.error || "Erreur lors de la création de la facture de solde");
          }
        },
      });
      return;
    }

    const res = await fetch(`/api/invoices/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (data.success) {
      setInvoice(data.data);
    }
  }

  async function handleDownloadPdf() {
    try {
      const res = await fetch(`/api/pdf/download?type=invoice&id=${params.id}`);
      if (!res.ok) {
        alert("Erreur lors du téléchargement du PDF");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `facture-${invoice?.invoiceNumber || params.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Erreur lors du téléchargement du PDF");
    }
  }

  async function handlePayment(data: {
    amount: number;
    method: string;
    paymentDate: string;
    reference?: string;
    notes?: string;
  }) {
    await fetch(`/api/invoices/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "record_payment", ...data }),
    });
    setShowPayment(false);
    load();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
      </div>
    );
  }

  async function handleRemind() {
    if (!invoice) return;
    setReminding(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/remind`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setReminderCount(data.data.reminderCount ?? 0);
        setLastReminderAt(data.data.lastReminderAt ?? null);
      }
    } catch {
      // ignore
    }
    setReminding(false);
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Facture non trouvée</p>
      </div>
    );
  }

  const isOverdue =
    invoice.status !== "paid" &&
    invoice.status !== "cancelled" &&
    new Date(invoice.dueDate) < new Date();

  const amountDue = parseFloat(invoice.amountDue ?? "0");
  const canPay = ["sent", "viewed", "partially_paid", "overdue"].includes(
    invoice.status
  );

  const canRemind = ["sent", "viewed", "partially_paid", "overdue"].includes(invoice.status);



  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/invoices")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight font-mono">
                {invoice.invoiceNumber}
              </h1>
              <InvoiceStatusBadge status={invoice.status} />
              <Badge variant="outline">
                {invoiceTypeLabels[invoice.type as InvoiceType]}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {client?.companyName}
              {invoice.reference && ` — ${invoice.reference}`}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadPdf}
          >
            <Download className="mr-2 h-4 w-4" />
            Télécharger PDF
          </Button>
          {canRemind && (
            <Button
              variant="outline"
              onClick={handleRemind}
              disabled={reminding}
              className="relative"
            >
              <Bell className="mr-2 h-4 w-4" />
              {reminding ? "..." : "Envoyer relance"}
              {reminderCount > 0 && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({reminderCount})
                </span>
              )}
            </Button>
          )}
          {invoice.type === "deposit" &&
           (invoice.status === "paid" || invoice.status === "partially_paid") && (
            <Button onClick={() => handleAction("create_final")}>
              <Plus className="mr-2 h-4 w-4" />
              Créer facture de solde
            </Button>
          )}
          {invoice.status === "draft" && (
            <Button onClick={() => handleAction("send")}>
              <Send className="mr-2 h-4 w-4" />
              Marquer envoyée
            </Button>
          )}
          {canPay && (
            <Button onClick={() => setShowPayment(true)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Enregistrer paiement
            </Button>
          )}
          {invoice.status !== "cancelled" && invoice.status !== "paid" && (
            <Button
              variant="outline"
              onClick={() => handleAction("cancel")}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Annuler
            </Button>
          )}
          {invoice.status === "draft" && (
            <Button
              variant="destructive"
              size="icon"
              onClick={() => handleAction("delete")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Reminder info */}
      {reminderCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-lg border bg-muted/30 px-3 py-2">
          <Bell className="h-4 w-4 shrink-0" />
          <span>
            {reminderCount} relance{reminderCount > 1 ? "s" : ""} envoyée{reminderCount > 1 ? "s" : ""}
            {lastReminderAt && (
              <> · dernière le {new Date(lastReminderAt).toLocaleDateString("fr-FR")}</>
            )}
          </span>
        </div>
      )}

      {/* Overdue warning */}
      {isOverdue && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertTriangle className="h-5 w-5" />
          <div>
            <p className="font-medium">Facture en retard</p>
            <p className="text-sm">
              Échéance dépassée depuis le{" "}
              {new Date(invoice.dueDate).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
      )}

      {/* Workflow Tracker */}
      <WorkflowTracker
        document={{
          id: invoice.id,
          type: "invoice",
          status: invoice.status,
          invoiceType: invoice.type,
          quoteId: invoice.quoteId,
          parentInvoiceId: invoice.parentInvoiceId,
          invoiceNumber: invoice.invoiceNumber,
          totalTtc: invoice.totalTtc,
          amountPaid: invoice.amountPaid,
        }}
        relatedQuote={invoice.relatedQuote}
        relatedParentInvoice={invoice.relatedParentInvoice}
        relatedFinalInvoice={invoice.relatedFinalInvoice}
      />

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Date d&apos;émission
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoice.issueDate
              ? new Date(invoice.issueDate).toLocaleDateString("fr-FR")
              : "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Échéance
            </CardTitle>
          </CardHeader>
          <CardContent className={isOverdue ? "text-red-600 font-medium" : ""}>
            {new Date(invoice.dueDate).toLocaleDateString("fr-FR")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total TTC
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-bold">
            {fmt(invoice.totalTtc)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reste dû
            </CardTitle>
          </CardHeader>
          <CardContent
            className={`text-xl font-bold ${amountDue > 0 ? "text-red-600" : "text-green-600"}`}
          >
            {amountDue > 0 ? fmt(invoice.amountDue) : "Soldée"}
          </CardContent>
        </Card>
      </div>

      {/* Lines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Détail de la facture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {invoice.lines.map((line) => (
              <div key={line.id}>
                {line.isSection ? (
                  <div className="mt-4 mb-2 font-semibold text-primary border-b pb-1">
                    {line.description}
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-2 text-sm">
                    <div className="flex-1">
                      <span>{line.description}</span>
                      {line.details && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {line.details}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-right text-muted-foreground">
                      <span>
                        {line.quantity} {line.unit}
                      </span>
                      <span className="w-24">{fmt(line.unitPriceHt)}</span>
                      <span className="w-28 font-medium text-foreground">
                        {fmt(line.totalHt)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="space-y-2 text-right">
            <div className="flex justify-end gap-8 text-sm">
              <span className="text-muted-foreground">Sous-total HT</span>
              <span className="w-32 font-medium">
                {fmt(invoice.subtotalHt)}
              </span>
            </div>
            {parseFloat(invoice.discountPercent ?? "0") > 0 && (
              <div className="flex justify-end gap-8 text-sm text-destructive">
                <span>Remise ({invoice.discountPercent}%)</span>
                <span className="w-32">- {fmt(invoice.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-end gap-8 text-sm">
              <span className="text-muted-foreground">TVA</span>
              <span className="w-32">{fmt(invoice.totalTva)}</span>
            </div>
            <Separator />
            <div className="flex justify-end gap-8 text-lg font-bold">
              <span>Total TTC</span>
              <span className="w-32">{fmt(invoice.totalTtc)}</span>
            </div>
            {parseFloat(invoice.amountPaid ?? "0") > 0 && (
              <>
                <div className="flex justify-end gap-8 text-sm text-green-600">
                  <span>Déjà payé</span>
                  <span className="w-32">- {fmt(invoice.amountPaid)}</span>
                </div>
                <div className="flex justify-end gap-8 text-base font-bold">
                  <span>Reste dû</span>
                  <span className="w-32">{fmt(invoice.amountDue)}</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payments history */}
      {invoice.payments && invoice.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Paiements ({invoice.payments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoice.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(payment.paymentDate).toLocaleDateString(
                        "fr-FR"
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payment.method === "bank_transfer"
                        ? "Virement"
                        : payment.method === "check"
                          ? "Chèque"
                          : payment.method === "card"
                            ? "CB"
                            : payment.method}
                      {payment.reference && ` — ${payment.reference}`}
                    </p>
                  </div>
                  <span className="font-medium text-green-600">
                    +{" "}
                    {parseFloat(payment.amount).toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {(invoice.footerNotes || invoice.notes) && (
        <div className="grid gap-4 md:grid-cols-2">
          {invoice.footerNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Notes de bas de page
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">
                  {invoice.footerNotes}
                </p>
              </CardContent>
            </Card>
          )}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes internes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Payment dialog */}
      {showPayment && (
        <PaymentDialog
          open
          onClose={() => setShowPayment(false)}
          onSubmit={handlePayment}
          amountDue={amountDue}
          invoiceNumber={invoice.invoiceNumber}
        />
      )}

      <ConfirmDialog
        open={confirmState.open}
        onClose={() => setConfirmState((s) => ({ ...s, open: false }))}
        onConfirm={() => {
          confirmState.onConfirm();
          setConfirmState((s) => ({ ...s, open: false }));
        }}
        title={confirmState.title}
        description={confirmState.description}
        confirmText={confirmState.confirmText}
        variant={confirmState.variant}
      />
    </div>
  );
}
