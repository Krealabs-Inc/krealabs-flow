"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Save, Building2, Landmark, FileText, Palette, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface OrgSummary {
  id: string;
  name: string;
}

interface OrgData {
  id: string;
  name: string;
  legalName?: string;
  siren?: string;
  siret?: string;
  tvaNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  defaultPaymentTerms?: number;
  defaultTvaRate?: string;
  quoteValidityDays?: number;
  invoicePrefix?: string;
  quotePrefix?: string;
  accountHolder?: string;
  bankName?: string;
  iban?: string;
  bic?: string;
  legalMentions?: string;
  quoteTerms?: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const orgIdParam = searchParams.get("orgId");

  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(orgIdParam);
  const [data, setData] = useState<OrgData | null>(null);
  const [initialData, setInitialData] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState("");

  // Load list of orgs for the selector
  useEffect(() => {
    async function loadOrgs() {
      try {
        const res = await fetch("/api/user/organizations");
        const json = await res.json();
        if (json.success) setOrgs(json.data.map((o: OrgSummary) => ({ id: o.id, name: o.name })));
      } catch { /* silent */ }
    }
    loadOrgs();
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError(false);
      try {
        const url = selectedOrgId
          ? `/api/organizations?orgId=${selectedOrgId}`
          : "/api/organizations";
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        if (!text) throw new Error("Empty response");
        const json = JSON.parse(text);
        if (json.success && json.data?.id) {
          setData(json.data);
          setInitialData(json.data);
        } else {
          setLoadError(true);
        }
      } catch {
        setLoadError(true);
      }
      setLoading(false);
    }
    load();
  }, [selectedOrgId]);

  const isDirty = JSON.stringify(data) !== JSON.stringify(initialData);

  function update(field: keyof OrgData, value: string | number) {
    setData((prev) => (prev ? { ...prev, [field]: value } : prev));
    setSaveStatus("idle");
  }

  const handleSave = useCallback(async () => {
    if (!data) return;
    setSaveStatus("saving");
    setSaveError("");
    try {
      const url = selectedOrgId
        ? `/api/organizations?orgId=${selectedOrgId}`
        : "/api/organizations";
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setInitialData(json.data);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveError(json.error || "Erreur lors de l'enregistrement.");
        setSaveStatus("error");
      }
    } catch (e) {
      setSaveError(
        e instanceof Error ? e.message : "Connexion impossible à la base de données."
      );
      setSaveStatus("error");
    }
  }, [data, selectedOrgId]);

  // Keyboard shortcut: Cmd/Ctrl + S
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (isDirty && saveStatus !== "saving") handleSave();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDirty, saveStatus, handleSave]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-destructive">Impossible de charger les paramètres</p>
          <p className="text-sm text-muted-foreground mt-1">
            Vérifiez que la base de données est connectée et que les migrations ont été appliquées.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
          <p className="text-muted-foreground">
            Configurez votre entreprise, vos coordonnées bancaires et vos préférences de facturation.
          </p>
          {orgs.length > 1 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Configurer :</span>
              <Select
                value={selectedOrgId ?? data?.id ?? ""}
                onValueChange={(v) => setSelectedOrgId(v)}
              >
                <SelectTrigger className="w-64 h-8 text-sm">
                  <SelectValue placeholder="Choisir une entreprise" />
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
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === "error" && (
            <div className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {saveError}
            </div>
          )}
          {saveStatus === "saved" && (
            <div className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Enregistré
            </div>
          )}
          <Button
            onClick={handleSave}
            disabled={saveStatus === "saving" || !isDirty}
            className="relative"
          >
            <Save className="mr-2 h-4 w-4" />
            {saveStatus === "saving" ? "Enregistrement..." : "Enregistrer"}
            {isDirty && saveStatus === "idle" && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-orange-500" />
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-4 w-4" />
            Entreprise
          </TabsTrigger>
          <TabsTrigger value="bank" className="gap-2">
            <Landmark className="h-4 w-4" />
            Banque
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <FileText className="h-4 w-4" />
            Facturation
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            Apparence
          </TabsTrigger>
        </TabsList>

        {/* --- Entreprise --- */}
        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations de l&apos;entreprise</CardTitle>
              <CardDescription>
                Ces informations apparaîtront sur vos devis et factures.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nom de l&apos;entreprise <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={data.name || ""}
                    onChange={(e) => update("name", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legalName">Raison sociale</Label>
                  <Input
                    id="legalName"
                    value={data.legalName || ""}
                    onChange={(e) => update("legalName", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="siren">SIREN</Label>
                  <Input
                    id="siren"
                    value={data.siren || ""}
                    onChange={(e) => update("siren", e.target.value)}
                    placeholder="123 456 789"
                    maxLength={9}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siret">SIRET</Label>
                  <Input
                    id="siret"
                    value={data.siret || ""}
                    onChange={(e) => update("siret", e.target.value)}
                    placeholder="123 456 789 00012"
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tvaNumber">N° TVA</Label>
                  <Input
                    id="tvaNumber"
                    value={data.tvaNumber || ""}
                    onChange={(e) => update("tvaNumber", e.target.value)}
                    placeholder="FR12 345678901"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressLine1">Adresse</Label>
                <Input
                  id="addressLine1"
                  value={data.addressLine1 || ""}
                  onChange={(e) => update("addressLine1", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressLine2">Complément d&apos;adresse</Label>
                <Input
                  id="addressLine2"
                  value={data.addressLine2 || ""}
                  onChange={(e) => update("addressLine2", e.target.value)}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Code postal</Label>
                  <Input
                    id="postalCode"
                    value={data.postalCode || ""}
                    onChange={(e) => update("postalCode", e.target.value)}
                    maxLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={data.city || ""}
                    onChange={(e) => update("city", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Pays</Label>
                  <Input
                    id="country"
                    value={data.country || "FR"}
                    onChange={(e) => update("country", e.target.value)}
                    maxLength={2}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={data.phone || ""}
                    onChange={(e) => update("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={data.email || ""}
                    onChange={(e) => update("email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Site web</Label>
                  <Input
                    id="website"
                    value={data.website || ""}
                    onChange={(e) => update("website", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Banque --- */}
        <TabsContent value="bank" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Coordonnées bancaires</CardTitle>
              <CardDescription>
                Affichées sur vos factures pour faciliter le paiement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="accountHolder">Titulaire du compte</Label>
                  <Input
                    id="accountHolder"
                    value={data.accountHolder || ""}
                    onChange={(e) => update("accountHolder", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Banque</Label>
                  <Input
                    id="bankName"
                    value={data.bankName || ""}
                    onChange={(e) => update("bankName", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="iban">IBAN</Label>
                <Input
                  id="iban"
                  value={data.iban || ""}
                  onChange={(e) => update("iban", e.target.value)}
                  placeholder="FR76 1234 5678 9012 3456 7890 123"
                  maxLength={34}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bic">BIC / SWIFT</Label>
                <Input
                  id="bic"
                  value={data.bic || ""}
                  onChange={(e) => update("bic", e.target.value)}
                  placeholder="ABCDEFGH"
                  maxLength={11}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Facturation --- */}
        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Préférences de facturation</CardTitle>
              <CardDescription>
                Valeurs par défaut pour vos nouveaux documents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="defaultPaymentTerms">Délai de paiement (jours)</Label>
                  <Input
                    id="defaultPaymentTerms"
                    type="number"
                    min={0}
                    value={data.defaultPaymentTerms ?? 30}
                    onChange={(e) =>
                      update("defaultPaymentTerms", parseInt(e.target.value) || 30)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultTvaRate">Taux de TVA (%)</Label>
                  <Input
                    id="defaultTvaRate"
                    value={data.defaultTvaRate || "20.00"}
                    onChange={(e) => update("defaultTvaRate", e.target.value)}
                    placeholder="20.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quoteValidityDays">Validité des devis (jours)</Label>
                  <Input
                    id="quoteValidityDays"
                    type="number"
                    min={1}
                    value={data.quoteValidityDays ?? 30}
                    onChange={(e) =>
                      update("quoteValidityDays", parseInt(e.target.value) || 30)
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invoicePrefix">Préfixe factures</Label>
                  <Input
                    id="invoicePrefix"
                    value={data.invoicePrefix || "FA"}
                    onChange={(e) => update("invoicePrefix", e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quotePrefix">Préfixe devis</Label>
                  <Input
                    id="quotePrefix"
                    value={data.quotePrefix || "DE"}
                    onChange={(e) => update("quotePrefix", e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="legalMentions">Mentions légales</Label>
                <Textarea
                  id="legalMentions"
                  rows={4}
                  value={data.legalMentions || ""}
                  onChange={(e) => update("legalMentions", e.target.value)}
                  placeholder="Mentions légales affichées sur les factures..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quoteTerms">Conditions générales des devis</Label>
                <Textarea
                  id="quoteTerms"
                  rows={4}
                  value={data.quoteTerms || ""}
                  onChange={(e) => update("quoteTerms", e.target.value)}
                  placeholder="Conditions générales affichées sur les devis..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Apparence --- */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logo</CardTitle>
              <CardDescription>
                Le logo apparaîtra sur vos devis et factures PDF.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">URL du logo</Label>
                <Input
                  id="logoUrl"
                  value={data.logoUrl || ""}
                  onChange={(e) => update("logoUrl", e.target.value)}
                  placeholder="/Logo Krealabs.png"
                />
                <p className="text-xs text-muted-foreground">
                  Chemin relatif dans /public ou URL externe. Par défaut : /Logo Krealabs.png
                </p>
              </div>
              {(data.logoUrl || true) && (
                <div className="rounded-lg border p-4">
                  <p className="mb-2 text-sm font-medium">Aperçu :</p>
                  <div className="inline-block rounded-lg bg-[#8B89F7] p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={data.logoUrl || "/Logo Krealabs.png"}
                      alt="Logo"
                      className="h-12 w-auto"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isDirty && (
        <p className="text-xs text-muted-foreground text-right">
          Modifications non enregistrées · <kbd className="px-1 py-0.5 rounded bg-muted text-xs">⌘S</kbd> pour sauvegarder
        </p>
      )}
    </div>
  );
}
