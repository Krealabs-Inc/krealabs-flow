"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  RefreshCcw,
  XCircle,
  Trash2,
  Edit,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ContractStatusBadge } from "@/components/contracts/contract-status-badge";
import {
  billingFrequencyLabels,
  type Contract,
  type BillingFrequency,
} from "@/types/contract";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { ApiResponse } from "@/types";

const fmt = (val: string | null) =>
  parseFloat(val ?? "0").toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/contracts/${params.id}`);
      const data: ApiResponse<Contract> = await res.json();
      if (data.success) setContract(data.data);
      setLoading(false);
    }
    load();
  }, [params.id]);

  async function handleAction(action: string) {
    if (action === "generate_invoice") {
      setConfirmState({
        open: true,
        title: "Générer une facture",
        description: `Cela va créer une facture récurrente pour la période en cours (${billingFrequencyLabels[contract?.billingFrequency as BillingFrequency] ?? "périodique"}) basée sur le montant du contrat.`,
        confirmText: "Générer",
        variant: "default",
        onConfirm: async () => {
          const res = await fetch(`/api/contracts/${params.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "generate_invoice" }),
          });
          const data = await res.json();
          if (data.success) router.push(`/invoices/${data.data.id}`);
        },
      });
      return;
    }

    if (action === "terminate") {
      setConfirmState({
        open: true,
        title: "Résilier ce contrat",
        description: "Êtes-vous sûr de vouloir résilier ce contrat ? Cette action est irréversible.",
        confirmText: "Résilier",
        variant: "destructive",
        onConfirm: async () => {
          const res = await fetch(`/api/contracts/${params.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "terminate" }),
          });
          const data = await res.json();
          if (data.success) setContract(data.data);
        },
      });
      return;
    }

    if (action === "delete") {
      setConfirmState({
        open: true,
        title: "Supprimer ce contrat",
        description: "Êtes-vous sûr de vouloir supprimer ce contrat ? Cette action est irréversible.",
        confirmText: "Supprimer",
        variant: "destructive",
        onConfirm: async () => {
          await fetch(`/api/contracts/${params.id}`, { method: "DELETE" });
          router.push("/contracts");
        },
      });
      return;
    }

    const res = await fetch(`/api/contracts/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (data.success) setContract(data.data);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Contrat non trouvé</p>
      </div>
    );
  }

  const daysLeft = Math.ceil(
    (new Date(contract.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/contracts")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {contract.name}
              </h1>
              <ContractStatusBadge status={contract.status} />
            </div>
            <p className="text-muted-foreground font-mono">
              {contract.contractNumber}
              {contract.clientName && ` — ${contract.clientName}`}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {contract.status === "draft" && (
            <>
              <Button onClick={() => handleAction("activate")}>
                <Play className="mr-2 h-4 w-4" />
                Activer
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/contracts/${contract.id}/edit`)
                }
              >
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleAction("delete")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
          {(contract.status === "active" ||
            contract.status === "renewal_pending") && (
            <>
              <Button onClick={() => handleAction("generate_invoice")}>
                <FileText className="mr-2 h-4 w-4" />
                Générer une facture
              </Button>
              <Button variant="outline" onClick={() => handleAction("renew")}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Renouveler
              </Button>
            </>
          )}
          {contract.status === "active" && (
            <Button
              variant="outline"
              onClick={() => handleAction("terminate")}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Résilier
            </Button>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Date de début
            </CardTitle>
          </CardHeader>
          <CardContent>
            {new Date(contract.startDate).toLocaleDateString("fr-FR")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Date de fin
            </CardTitle>
          </CardHeader>
          <CardContent
            className={daysLeft < 30 && contract.status === "active" ? "text-amber-600 font-medium" : ""}
          >
            {new Date(contract.endDate).toLocaleDateString("fr-FR")}
            {daysLeft > 0 && contract.status === "active" && (
              <span className="block text-xs text-muted-foreground">
                {daysLeft} jours restants
              </span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Montant annuel HT
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-bold">
            {fmt(contract.annualAmountHt)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Facturation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {billingFrequencyLabels[
              contract.billingFrequency as BillingFrequency
            ] ?? contract.billingFrequency}
            {contract.autoRenew && (
              <span className="block text-xs text-muted-foreground">
                Renouvellement auto
              </span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      {contract.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{contract.description}</p>
          </CardContent>
        </Card>
      )}

      {contract.terms && (
        <Card>
          <CardHeader>
            <CardTitle>Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{contract.terms}</p>
          </CardContent>
        </Card>
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
