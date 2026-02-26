"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  ExternalLink,
  FileText,
  Receipt,
  FolderOpen,
  ScrollText,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { Client, ApiResponse, PaginatedResponse } from "@/types";
import type { Quote } from "@/types/quote";
import type { Invoice } from "@/types/invoice";
import {
  invoiceStatusLabels,
  invoiceStatusColors,
  invoiceTypeLabels,
} from "@/types/invoice";

// ─── Minimal types for the tabs ───────────────────────────────────────────────

interface Project {
  id: string;
  projectNumber: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budgetHt: string | null;
}

interface Contract {
  id: string;
  contractNumber: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  annualAmountHt: string | null;
  billingFrequency: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (val: string | null | undefined) =>
  parseFloat(val ?? "0").toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });

const quoteStatusLabels: Record<string, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  viewed: "Vu",
  accepted: "Accepté",
  rejected: "Refusé",
  expired: "Expiré",
  partially_invoiced: "Part. facturé",
  fully_invoiced: "Facturé",
};

const quoteStatusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  viewed: "bg-purple-100 text-purple-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-amber-100 text-amber-700",
  partially_invoiced: "bg-cyan-100 text-cyan-700",
  fully_invoiced: "bg-emerald-100 text-emerald-700",
};

const projectStatusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  active: "bg-green-100 text-green-700",
  on_hold: "bg-amber-100 text-amber-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
};

const projectStatusLabels: Record<string, string> = {
  draft: "Brouillon",
  active: "En cours",
  on_hold: "En pause",
  completed: "Terminé",
  cancelled: "Annulé",
};

const contractStatusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  active: "bg-green-100 text-green-700",
  renewal_pending: "bg-amber-100 text-amber-700",
  terminated: "bg-red-100 text-red-700",
  renewed: "bg-blue-100 text-blue-700",
  expired: "bg-orange-100 text-orange-700",
};

const contractStatusLabels: Record<string, string> = {
  draft: "Brouillon",
  active: "Actif",
  renewal_pending: "Renouvellement",
  terminated: "Résilié",
  renewed: "Renouvelé",
  expired: "Expiré",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [docsLoaded, setDocsLoaded] = useState(false);

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
      const res = await fetch(`/api/clients/${clientId}`);
      const data: ApiResponse<Client> = await res.json();
      if (data.success) setClient(data.data);
      setLoading(false);
    }
    load();
  }, [clientId]);

  const loadDocs = useCallback(async () => {
    if (docsLoaded) return;
    const [qRes, iRes, pRes, cRes] = await Promise.all([
      fetch(`/api/quotes?clientId=${clientId}&limit=50`),
      fetch(`/api/invoices?clientId=${clientId}&limit=50`),
      fetch(`/api/projects?clientId=${clientId}&limit=50`),
      fetch(`/api/contracts?clientId=${clientId}&limit=50`),
    ]);
    const [qData, iData, pData, cData] = await Promise.all([
      qRes.json() as Promise<PaginatedResponse<Quote>>,
      iRes.json() as Promise<PaginatedResponse<Invoice>>,
      pRes.json() as Promise<PaginatedResponse<Project>>,
      cRes.json() as Promise<PaginatedResponse<Contract>>,
    ]);
    if (qData.success) setQuotes(qData.data);
    if (iData.success) setInvoices(iData.data);
    if (pData.success) setProjects(pData.data);
    if (cData.success) setContracts(cData.data);
    setDocsLoaded(true);
  }, [clientId, docsLoaded]);

  function handleDelete() {
    setConfirmState({
      open: true,
      title: "Supprimer ce client",
      description:
        "Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.",
      confirmText: "Supprimer",
      variant: "destructive",
      onConfirm: async () => {
        await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
        router.push("/clients");
      },
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Client non trouvé</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/clients")}
        >
          Retour aux clients
        </Button>
      </div>
    );
  }

  // Financial summary from invoices
  const totalBilled = invoices.reduce(
    (s, i) => s + parseFloat(i.totalTtc ?? "0"),
    0
  );
  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + parseFloat(i.totalTtc ?? "0"), 0);
  const totalDue = invoices.reduce(
    (s, i) => s + parseFloat(i.amountDue ?? "0"),
    0
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 mt-0.5"
          onClick={() => router.push("/clients")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">
            {client.companyName}
          </h1>
          {client.legalName && (
            <p className="text-muted-foreground truncate">{client.legalName}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/clients/${client.id}/edit`)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Modifier</span>
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" onValueChange={(v) => v !== "info" && loadDocs()}>
        <div className="overflow-x-auto">
          <TabsList className="grid w-full grid-cols-5 min-w-[400px]">
          <TabsTrigger value="info">Informations</TabsTrigger>
          <TabsTrigger value="quotes">
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Devis
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <Receipt className="mr-1.5 h-3.5 w-3.5" />
            Factures
          </TabsTrigger>
          <TabsTrigger value="projects">
            <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
            Projets
          </TabsTrigger>
          <TabsTrigger value="contracts">
            <ScrollText className="mr-1.5 h-3.5 w-3.5" />
            Contrats
          </TabsTrigger>
        </TabsList>
        </div>

        {/* ── Info Tab ── */}
        <TabsContent value="info" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informations entreprise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {client.siret && (
                  <div>
                    <span className="text-sm text-muted-foreground">SIRET</span>
                    <p className="font-mono text-sm">{client.siret}</p>
                  </div>
                )}
                {!client.siret && (
                  <p className="text-sm text-muted-foreground">
                    Aucune information renseignée
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact principal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(client.contactFirstName || client.contactLastName) && (
                  <div>
                    <span className="text-sm text-muted-foreground">Nom</span>
                    <p>
                      {[client.contactFirstName, client.contactLastName]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                    {client.contactPosition && (
                      <Badge variant="secondary" className="mt-1">
                        {client.contactPosition}
                      </Badge>
                    )}
                  </div>
                )}
                {client.contactEmail && (
                  <div>
                    <span className="text-sm text-muted-foreground">Email</span>
                    <p>{client.contactEmail}</p>
                  </div>
                )}
                {client.contactPhone && (
                  <div>
                    <span className="text-sm text-muted-foreground">Téléphone</span>
                    <p>{client.contactPhone}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Adresse</CardTitle>
              </CardHeader>
              <CardContent>
                {client.addressLine1 ? (
                  <div className="space-y-1">
                    <p>{client.addressLine1}</p>
                    {client.addressLine2 && <p>{client.addressLine2}</p>}
                    <p>
                      {[client.postalCode, client.city]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucune adresse renseignée
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Facturation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">
                    Délai de paiement
                  </span>
                  <p>{client.paymentTerms ?? "Par défaut (30)"} jours</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {client.notes && (
            <>
              <Separator />
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notes internes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{client.notes}</p>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── Quotes Tab ── */}
        <TabsContent value="quotes" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {quotes.length} devis
            </p>
            <Button
              size="sm"
              onClick={() =>
                router.push(`/quotes/new?clientId=${clientId}`)
              }
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Nouveau devis
            </Button>
          </div>
          {quotes.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Aucun devis pour ce client
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full min-w-[500px] text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Numéro
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Référence
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Statut
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        Total TTC
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        Date
                      </th>
                      <th className="w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map((q, i) => (
                      <tr
                        key={q.id}
                        className={
                          i < quotes.length - 1 ? "border-b" : ""
                        }
                      >
                        <td className="px-4 py-3 font-mono text-xs">
                          {q.quoteNumber}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {q.reference ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              quoteStatusColors[q.status] ??
                              "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {quoteStatusLabels[q.status] ?? q.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {fmt(q.totalTtc)}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {q.issueDate
                            ? new Date(q.issueDate).toLocaleDateString("fr-FR")
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => router.push(`/quotes/${q.id}`)}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Invoices Tab ── */}
        <TabsContent value="invoices" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {invoices.length} facture{invoices.length !== 1 ? "s" : ""}
            </p>
            <Button
              size="sm"
              onClick={() =>
                router.push(`/invoices/new?clientId=${clientId}`)
              }
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Nouvelle facture
            </Button>
          </div>

          {/* Financial summary */}
          {invoices.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-3">
              <Card>
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground">Total facturé</p>
                  <p className="text-lg font-bold">{fmt(totalBilled.toFixed(2))}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground">Total encaissé</p>
                  <p className="text-lg font-bold text-green-600">
                    {fmt(totalPaid.toFixed(2))}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground">Restant dû</p>
                  <p
                    className={`text-lg font-bold ${
                      totalDue > 0 ? "text-amber-600" : "text-muted-foreground"
                    }`}
                  >
                    {fmt(totalDue.toFixed(2))}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {invoices.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Aucune facture pour ce client
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full min-w-[500px] text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Numéro
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Statut
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        Total TTC
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        Échéance
                      </th>
                      <th className="w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv, i) => (
                      <tr
                        key={inv.id}
                        className={
                          i < invoices.length - 1 ? "border-b" : ""
                        }
                      >
                        <td className="px-4 py-3 font-mono text-xs">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {invoiceTypeLabels[inv.type]}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              invoiceStatusColors[inv.status]
                            }`}
                          >
                            {invoiceStatusLabels[inv.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {fmt(inv.totalTtc)}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {new Date(inv.dueDate).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => router.push(`/invoices/${inv.id}`)}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Projects Tab ── */}
        <TabsContent value="projects" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {projects.length} projet{projects.length !== 1 ? "s" : ""}
            </p>
            <Button
              size="sm"
              onClick={() =>
                router.push(`/projects/new?clientId=${clientId}`)
              }
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Nouveau projet
            </Button>
          </div>
          {projects.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Aucun projet pour ce client
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full min-w-[500px] text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Numéro
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Nom
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Statut
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        Budget HT
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        Début
                      </th>
                      <th className="w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p, i) => (
                      <tr
                        key={p.id}
                        className={
                          i < projects.length - 1 ? "border-b" : ""
                        }
                      >
                        <td className="px-4 py-3 font-mono text-xs">
                          {p.projectNumber}
                        </td>
                        <td className="px-4 py-3 font-medium">{p.name}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              projectStatusColors[p.status] ??
                              "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {projectStatusLabels[p.status] ?? p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {p.budgetHt ? fmt(p.budgetHt) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {p.startDate
                            ? new Date(p.startDate).toLocaleDateString("fr-FR")
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => router.push(`/projects/${p.id}`)}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Contracts Tab ── */}
        <TabsContent value="contracts" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {contracts.length} contrat{contracts.length !== 1 ? "s" : ""}
            </p>
            <Button
              size="sm"
              onClick={() =>
                router.push(`/contracts/new?clientId=${clientId}`)
              }
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Nouveau contrat
            </Button>
          </div>
          {contracts.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Aucun contrat pour ce client
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full min-w-[500px] text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Numéro
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Nom
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Statut
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        Montant annuel HT
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        Fin
                      </th>
                      <th className="w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((c, i) => (
                      <tr
                        key={c.id}
                        className={
                          i < contracts.length - 1 ? "border-b" : ""
                        }
                      >
                        <td className="px-4 py-3 font-mono text-xs">
                          {c.contractNumber}
                        </td>
                        <td className="px-4 py-3 font-medium">{c.name}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              contractStatusColors[c.status] ??
                              "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {contractStatusLabels[c.status] ?? c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {fmt(c.annualAmountHt)}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {new Date(c.endDate).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              router.push(`/contracts/${c.id}`)
                            }
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

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
