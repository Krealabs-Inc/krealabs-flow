"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Send,
  FileCheck,
  Copy,
  Trash2,
  ArrowRightLeft,
  XCircle,
  Download,
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
import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge";
import { WorkflowTracker } from "@/components/shared/workflow-tracker";
import type { Quote } from "@/types/quote";
import type { ApiResponse, Client } from "@/types";

const fmt = (val: string | null) =>
  parseFloat(val ?? "0").toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/quotes/${params.id}`);
      const data: ApiResponse<Quote> = await res.json();
      if (data.success) {
        setQuote(data.data);
        // Fetch client name
        const clientRes = await fetch(`/api/clients/${data.data.clientId}`);
        const clientData: ApiResponse<Client> = await clientRes.json();
        if (clientData.success) setClient(clientData.data);
      }
      setLoading(false);
    }
    load();
  }, [params.id]);

  async function handleAction(action: string) {
    if (action === "delete" && !confirm("Supprimer ce devis ?")) return;
    if (action === "convert" && !confirm("Convertir ce devis en facture ?"))
      return;

    if (action === "delete") {
      await fetch(`/api/quotes/${params.id}`, { method: "DELETE" });
      router.push("/quotes");
      return;
    }

    const res = await fetch(`/api/quotes/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (data.success) {
      if (action === "convert") {
        router.push("/invoices");
      } else if (action === "duplicate") {
        router.push(`/quotes/${data.data.id}`);
      } else {
        setQuote(data.data);
      }
    }
  }

  async function handleDownloadPdf() {
    try {
      const res = await fetch(`/api/pdf/download?type=quote&id=${params.id}`);
      if (!res.ok) {
        alert("Erreur lors du téléchargement du PDF");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `devis-${quote?.quoteNumber || params.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Erreur lors du téléchargement du PDF");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Devis non trouvé</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/quotes")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight font-mono">
                {quote.quoteNumber}
              </h1>
              <QuoteStatusBadge status={quote.status} />
            </div>
            <p className="text-muted-foreground">
              {client?.companyName}
              {quote.reference && ` — ${quote.reference}`}
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
          {quote.status === "draft" && (
            <>
              <Button
                variant="outline"
                onClick={() => router.push(`/quotes/${quote.id}/edit`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Modifier
              </Button>
              <Button onClick={() => handleAction("send")}>
                <Send className="mr-2 h-4 w-4" />
                Marquer envoyé
              </Button>
            </>
          )}
          {(quote.status === "sent" || quote.status === "viewed") && (
            <>
              <Button
                variant="outline"
                onClick={() => handleAction("reject")}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Refusé
              </Button>
              <Button onClick={() => handleAction("accept")}>
                <FileCheck className="mr-2 h-4 w-4" />
                Accepté
              </Button>
            </>
          )}
          {quote.status === "accepted" && (
            <Button onClick={() => handleAction("convert")}>
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Convertir en facture
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => handleAction("duplicate")}
          >
            <Copy className="mr-2 h-4 w-4" />
            Dupliquer
          </Button>
          {quote.status === "draft" && (
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

      {/* Infos */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Date d&apos;émission
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quote.issueDate
              ? new Date(quote.issueDate).toLocaleDateString("fr-FR")
              : "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Validité
            </CardTitle>
          </CardHeader>
          <CardContent>
            {new Date(quote.validityDate).toLocaleDateString("fr-FR")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Montant TTC
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-bold">
            {fmt(quote.totalTtc)}
          </CardContent>
        </Card>
      </div>

      {/* Workflow Tracker */}
      <WorkflowTracker
        document={{
          id: quote.id,
          type: "quote",
          status: quote.status,
          quoteNumber: quote.quoteNumber,
          totalTtc: quote.totalTtc,
        }}
      />

      {/* Introduction */}
      {quote.introduction && (
        <Card>
          <CardContent className="pt-6">
            <p className="whitespace-pre-wrap text-sm">
              {quote.introduction}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lines */}
      <Card>
        <CardHeader>
          <CardTitle>Prestations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {quote.lines.map((line) => (
              <div key={line.id}>
                {line.isSection ? (
                  <div className="mt-4 mb-2 font-semibold text-primary border-b pb-1">
                    {line.description}
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-2 text-sm">
                    <div className="flex-1">
                      <span>
                        {line.description}
                        {line.isOptional && (
                          <Badge
                            variant="outline"
                            className="ml-2 text-xs text-amber-600"
                          >
                            Option
                          </Badge>
                        )}
                      </span>
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
              <span className="w-32 font-medium">{fmt(quote.subtotalHt)}</span>
            </div>
            {parseFloat(quote.discountPercent ?? "0") > 0 && (
              <div className="flex justify-end gap-8 text-sm text-destructive">
                <span>Remise ({quote.discountPercent}%)</span>
                <span className="w-32">- {fmt(quote.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-end gap-8 text-sm">
              <span className="text-muted-foreground">TVA</span>
              <span className="w-32">{fmt(quote.totalTva)}</span>
            </div>
            <Separator />
            <div className="flex justify-end gap-8 text-lg font-bold">
              <span>Total TTC</span>
              <span className="w-32">{fmt(quote.totalTtc)}</span>
            </div>
            {quote.depositPercent &&
              parseFloat(quote.depositPercent) > 0 && (
                <div className="flex justify-end gap-8 text-sm text-primary">
                  <span>Acompte ({quote.depositPercent}%)</span>
                  <span className="w-32 font-medium">
                    {fmt(quote.depositAmount)}
                  </span>
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Terms and notes */}
      {(quote.terms || quote.notes) && (
        <div className="grid gap-4 md:grid-cols-2">
          {quote.terms && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Conditions particulières
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{quote.terms}</p>
              </CardContent>
            </Card>
          )}
          {quote.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes internes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{quote.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
