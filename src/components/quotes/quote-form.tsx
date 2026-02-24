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
import { QuoteLineEditor } from "./quote-line-editor";
import type { Quote, QuoteLineFormData } from "@/types/quote";
import type { Client } from "@/types";
import { useOrg } from "@/contexts/org-context";

interface QuoteFormProps {
  quote?: Quote;
}

interface OrgOption {
  id: string;
  name: string;
}

export function QuoteForm({ quote }: QuoteFormProps) {
  const router = useRouter();
  const { currentOrgId } = useOrg();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [clientId, setClientId] = useState(quote?.clientId || "");
  const [issuingOrgId, setIssuingOrgId] = useState<string>(
    (quote as any)?.issuingOrgId || currentOrgId || ""
  );
  const [discountPercent, setDiscountPercent] = useState(
    parseFloat(quote?.discountPercent ?? "0")
  );
  const [depositPercent, setDepositPercent] = useState(
    quote?.depositPercent ? parseFloat(quote.depositPercent) : 0
  );

  const [lines, setLines] = useState<QuoteLineFormData[]>(() => {
    if (quote?.lines?.length) {
      return quote.lines.map((l) => ({
        id: l.id,
        sortOrder: l.sortOrder,
        isSection: l.isSection ?? false,
        isOptional: l.isOptional ?? false,
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

  const isEditing = !!quote;

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
        if (!quote && !issuingOrgId && orgsJson.data.length > 0) {
          const primary = orgsJson.data.find((o: any) => o.isPrimary) ?? orgsJson.data[0];
          setIssuingOrgId(primary.id);
        }
      }
    }
    loadData();
  }, []);

  // Compute totals
  const activeLines = lines.filter((l) => !l.isSection && !l.isOptional);
  const subtotalHt = activeLines.reduce(
    (sum, l) => sum + l.quantity * l.unitPriceHt,
    0
  );
  const discountAmount = subtotalHt * (discountPercent / 100);
  const totalHt = subtotalHt - discountAmount;
  const totalTva = activeLines.reduce(
    (sum, l) => sum + l.quantity * l.unitPriceHt * (l.tvaRate / 100),
    0
  ) * (1 - discountPercent / 100);
  const totalTtc = totalHt + totalTva;
  const depositAmount = totalTtc * (depositPercent / 100);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const data = {
      clientId,
      issuingOrgId: issuingOrgId || undefined,
      reference: formData.get("reference") as string || undefined,
      issueDate: formData.get("issueDate") as string || undefined,
      validityDate: formData.get("validityDate") as string || undefined,
      discountPercent,
      depositPercent: depositPercent || undefined,
      introduction: formData.get("introduction") as string || undefined,
      terms: formData.get("terms") as string || undefined,
      notes: formData.get("notes") as string || undefined,
      lines: lines.filter((l) => l.description.trim() !== ""),
    };

    const url = isEditing ? `/api/quotes/${quote.id}` : "/api/quotes";
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!result.success) {
        setError(result.error || "Une erreur est survenue");
        return;
      }

      router.push(`/quotes/${result.data.id}`);
      router.refresh();
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  const fmt = (n: number) =>
    n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
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
            <Label htmlFor="reference">Référence</Label>
            <Input
              id="reference"
              name="reference"
              defaultValue={quote?.reference ?? ""}
              placeholder="Ex: Refonte site web"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="issueDate">Date d&apos;émission</Label>
            <Input
              id="issueDate"
              name="issueDate"
              type="date"
              defaultValue={
                quote?.issueDate ?? new Date().toISOString().split("T")[0]
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="validityDate">Date de validité</Label>
            <Input
              id="validityDate"
              name="validityDate"
              type="date"
              defaultValue={
                quote?.validityDate ??
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split("T")[0]
              }
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
            defaultValue={quote?.introduction ?? ""}
            placeholder="Texte d'introduction du devis..."
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
          <CardTitle>Remise et acompte</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
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
          <div className="space-y-2">
            <Label>Acompte demandé (%)</Label>
            <Input
              type="number"
              step="1"
              min="0"
              max="100"
              value={depositPercent}
              onChange={(e) =>
                setDepositPercent(parseFloat(e.target.value) || 0)
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
            {depositPercent > 0 && (
              <div className="flex justify-end gap-8 text-sm text-primary">
                <span>Acompte ({depositPercent}%)</span>
                <span className="w-32 font-medium">{fmt(depositAmount)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conditions et notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="terms">Conditions particulières</Label>
            <Textarea
              id="terms"
              name="terms"
              defaultValue={quote?.terms ?? ""}
              rows={3}
              placeholder="Conditions de paiement, modalités..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes internes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={quote?.notes ?? ""}
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
              : "Créer le devis"}
        </Button>
      </div>
    </form>
  );
}
