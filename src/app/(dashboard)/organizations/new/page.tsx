"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const LEGAL_FORMS = [
  { value: "micro_entreprise", label: "Micro-entreprise" },
  { value: "auto_entrepreneur", label: "Auto-entrepreneur" },
  { value: "sas", label: "SAS" },
  { value: "sasu", label: "SASU" },
  { value: "sarl", label: "SARL" },
  { value: "eurl", label: "EURL" },
  { value: "gie", label: "GIE" },
  { value: "association", label: "Association" },
  { value: "autre", label: "Autre" },
];

const TVA_REGIMES = [
  { value: "franchise_base", label: "Franchise en base de TVA" },
  { value: "reel_simplifie", label: "Réel simplifié" },
  { value: "reel_normal", label: "Réel normal" },
];

const WITH_CAPITAL = ["sas", "sasu", "sarl", "eurl"];

export default function NewOrganizationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [legalForm, setLegalForm] = useState("autre");
  const [tvaRegime, setTvaRegime] = useState("reel_simplifie");
  const [siren, setSiren] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [email, setEmail] = useState("");
  const [capitalSocial, setCapitalSocial] = useState("");

  const showCapital = WITH_CAPITAL.includes(legalForm);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Le nom est requis");
      return;
    }

    setLoading(true);
    setFormError(null);

    try {
      const res = await fetch("/api/user/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          legalForm,
          tvaRegime,
          siren: siren || undefined,
          addressLine1: addressLine1 || undefined,
          city: city || undefined,
          postalCode: postalCode || undefined,
          email: email || undefined,
          capitalSocial: showCapital && capitalSocial ? capitalSocial : undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        router.push("/organizations");
      } else {
        setFormError(json.error || "Erreur lors de la création");
      }
    } catch {
      setFormError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/organizations">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nouvelle entreprise</h1>
          <p className="text-muted-foreground text-sm">
            Ajoutez une nouvelle structure juridique à votre compte
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informations de l&apos;entreprise</CardTitle>
            <CardDescription>
              Ces informations apparaîtront sur vos documents PDF.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nom de l&apos;entreprise <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Kréalabs SAS"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="legalForm">Forme juridique</Label>
                <Select value={legalForm} onValueChange={setLegalForm}>
                  <SelectTrigger id="legalForm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEGAL_FORMS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tvaRegime">Régime TVA</Label>
                <Select value={tvaRegime} onValueChange={setTvaRegime}>
                  <SelectTrigger id="tvaRegime">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TVA_REGIMES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="siren">SIREN</Label>
                <Input
                  id="siren"
                  value={siren}
                  onChange={(e) => setSiren(e.target.value)}
                  placeholder="123 456 789"
                  maxLength={9}
                />
              </div>
              {showCapital && (
                <div className="space-y-2">
                  <Label htmlFor="capitalSocial">Capital social (€)</Label>
                  <Input
                    id="capitalSocial"
                    type="number"
                    min={0}
                    step="0.01"
                    value={capitalSocial}
                    onChange={(e) => setCapitalSocial(e.target.value)}
                    placeholder="10 000"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine1">Adresse</Label>
              <Input
                id="addressLine1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Code postal</Label>
                <Input
                  id="postalCode"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  maxLength={5}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email professionnel</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@entreprise.fr"
              />
            </div>

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Création..." : "Créer l'entreprise"}
              </Button>
              <Button variant="outline" type="button" asChild>
                <Link href="/organizations">Annuler</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
