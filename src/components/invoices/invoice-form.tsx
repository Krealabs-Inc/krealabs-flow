"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { QuoteLineEditor } from "@/components/quotes/quote-line-editor";
import type { Invoice } from "@/types/invoice";
import type { QuoteLineFormData } from "@/types/quote";
import type { Client } from "@/types";
import { useOrg } from "@/contexts/org-context";

interface InvoiceFormProps {
  invoice?: Invoice;
}

const INVOICE_TYPE_OPTIONS = [
  { value: "standard", label: "Facture standard" },
  { value: "deposit", label: "Facture d'acompte" },
  { value: "credit_note", label: "Avoir" },
  { value: "recurring", label: "Facture récurrente" },
] as const;

interface OrgOption {
  id: string;
  name: string;
}

export function InvoiceForm({ invoice }: InvoiceFormProps) {
  const router = useRouter();
  const { currentOrgId } = useOrg();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [clientId, setClientId] = useState(invoice?.clientId || "");
  const [issuingOrgId, setIssuingOrgId] = useState<string>(
    (invoice as any)?.issuingOrgId || currentOrgId || ""
  );
  const [invoiceType, setInvoiceType] = useState<string>(
    invoice?.type || "standard"
  );
  const [discountPercent, setDiscountPercent] = useState(
    parseFloat(invoice?.discountPercent ?? "0")
  );

  const [lines, setLines] = useState<QuoteLineFormData[]>(() => {
    if (invoice?.lines?.length) {
      return invoice.lines.map((l) => ({
        id: l.id,
        sortOrder: l.sortOrder,
        isSection: l.isSection ?? false,
        isOptional: false,
        description: l.description,
        details: l.details ?? "",
        quantity: parseFloat(l.quantity ?? "1"),
        unit: l.unit ?? "day",
        unitPriceHt: parseFloat(l.unitPriceHt ?? "0"),
        tvaRate: parseFloat(l.tvaRate ?? "20"),
      }));
    }
    return [
      {
        sortOrder: 0,
        isSection: false,
        isOptional: false,
        description: "",
        details: "",
        quantity: 1,
        unit: "day",
        unitPriceHt: 0,
        tvaRate: 20,
      },
    ];
  });

  const isEditing = !!invoice;

  useEffect(() => {
    async function loadData() {
      const [clientsRes, orgsRes] = await Promise.all([
        fetch("/api/clients?limit=100"),
        fetch("/api/user/organizations"),
      ]);
      const clientsJson = await clientsRes.json();
      const orgsJson = await orgsRes.json();
      if (clientsJson.success) setClients(clientsJson.data);
      if (orgsJson.success) {
        setOrgs(orgsJson.data.map((o: OrgOption) => ({ id: o.id, name: o.name })));
        // Set default issuingOrgId to primary org if not editing
        if (!invoice && !issuingOrgId && orgsJson.data.length > 0) {
          const primary = orgsJson.data.find((o: any) => o.isPrimary) ?? orgsJson.data[0];
          setIssuingOrgId(primary.id);
        }
      }
    }
    loadData();
  }, []);

  // Compute totals
  const activeLines = lines.filter((l) => !l.isSection);
  const subtotalHt = activeLines.reduce(
    (sum, l) => sum + l.quantity * l.unitPriceHt,
    0
  );
  const discountAmount = subtotalHt * (discountPercent / 100);
  const totalHt = subtotalHt - discountAmount;
  const totalTva =
    activeLines.reduce(
      (sum, l) => sum + l.quantity * l.unitPriceHt * (l.tvaRate / 100),
      0
    ) *
    (1 - discountPercent / 100);
  const totalTtc = totalHt + totalTva;

  // Default due date: 30 days from today
  const defaultDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setFormError(null);

    const formData = new FormData(e.currentTarget);

    const data = {
      clientId,
      type: invoiceType,
      issuingOrgId: issuingOrgId || undefined,
      reference: (formData.get("reference") as string) || undefined,
      issueDate: (formData.get("issueDate") as string) || undefined,
      dueDate: (formData.get("dueDate") as string) || undefined,
      discountPercent,
      introduction: (formData.get("introduction") as string) || undefined,
      footerNotes: (formData.get("footerNotes") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
      lines: lines.filter((l) => l.description.trim() !== ""),
    };

    const url = isEditing ? `/api/invoices/${invoice.id}` : "/api/invoices";
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!result.success) {
        setFormError(result.error || "Une erreur est survenue");
        return;
      }

      router.push(`/invoices/${result.data.id}`);
      router.refresh();
    } catch {
      setFormError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  const fmt = (n: number) =>
    n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {formError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {orgs.length > 1 && (
            <div className="space-y-2 md:col-span-2">
              <Label>Émettre depuis</Label>
              <Select value={issuingOrgId} onValueChange={setIssuingOrgId}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Sélectionner l'entreprise émettrice" />
                </SelectTrigger>
                <SelectContent>
                  {orgs.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Client *</Label>
            <Select value={clientId} onValueChange={setClientId} required>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Type de facture</Label>
            <Select value={invoiceType} onValueChange={setInvoiceType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVOICE_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reference">Référence</Label>
            <Input
              id="reference"
              name="reference"
              defaultValue={invoice?.reference ?? ""}
              placeholder="Ex: Développement application mobile"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="issueDate">Date d&apos;émission</Label>
            <Input
              id="issueDate"
              name="issueDate"
              type="date"
              defaultValue={
                invoice?.issueDate ?? new Date().toISOString().split("T")[0]
              }
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="dueDate">Date d&apos;échéance</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              defaultValue={invoice?.dueDate ?? defaultDueDate}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Introduction</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            name="introduction"
            defaultValue={invoice?.introduction ?? ""}
            placeholder="Texte d'introduction de la facture..."
            rows={3}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prestations</CardTitle>
        </CardHeader>
        <CardContent>
          <QuoteLineEditor lines={lines} onChange={setLines} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Remise</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs space-y-2">
            <Label>Remise (%)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={discountPercent}
              onChange={(e) =>
                setDiscountPercent(parseFloat(e.target.value) || 0)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Totals summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2 text-right">
            <div className="flex justify-end gap-8 text-sm">
              <span className="text-muted-foreground">Sous-total HT</span>
              <span className="w-32 font-medium">{fmt(subtotalHt)}</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-end gap-8 text-sm text-destructive">
                <span>Remise ({discountPercent}%)</span>
                <span className="w-32">- {fmt(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-end gap-8 text-sm">
              <span className="text-muted-foreground">Total HT</span>
              <span className="w-32 font-medium">{fmt(totalHt)}</span>
            </div>
            <div className="flex justify-end gap-8 text-sm">
              <span className="text-muted-foreground">TVA</span>
              <span className="w-32">{fmt(totalTva)}</span>
            </div>
            <Separator />
            <div className="flex justify-end gap-8 text-lg font-bold">
              <span>Total TTC</span>
              <span className="w-32">{fmt(totalTtc)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes et mentions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="footerNotes">Mentions de pied de page</Label>
            <Textarea
              id="footerNotes"
              name="footerNotes"
              defaultValue={invoice?.footerNotes ?? ""}
              rows={3}
              placeholder="Conditions de paiement, pénalités de retard..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes internes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={invoice?.notes ?? ""}
              rows={2}
              placeholder="Notes visibles uniquement en interne"
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading
            ? "Enregistrement..."
            : isEditing
              ? "Mettre à jour"
              : "Créer la facture"}
        </Button>
      </div>
    </form>
  );
}
