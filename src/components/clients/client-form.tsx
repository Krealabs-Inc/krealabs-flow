"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
import type { Client, ClientPipelineStage } from "@/types";
import { CLIENT_PIPELINE_LABELS } from "@/types";

interface ClientFormProps {
  client?: Client;
}

const PIPELINE_STAGES: ClientPipelineStage[] = [
  "prospect",
  "contact_made",
  "proposal_sent",
  "negotiation",
  "active",
  "inactive",
  "lost",
];

export function ClientForm({ client }: ClientFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pipelineStage, setPipelineStage] = useState<ClientPipelineStage>(
    (client?.pipelineStage as ClientPipelineStage) ?? "prospect"
  );

  const isEditing = !!client;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (typeof value === "string" && value.trim() !== "") {
        data[key] = value.trim();
      }
    });

    // Add pipelineStage from state (not from FormData since it's a controlled Select)
    data.pipelineStage = pipelineStage;

    const url = isEditing ? `/api/clients/${client.id}` : "/api/clients";
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

      router.push(`/clients/${result.data.id}`);
      router.refresh();
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Entreprise</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">Nom de l&apos;entreprise *</Label>
            <Input
              id="companyName"
              name="companyName"
              defaultValue={client?.companyName ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="legalName">Raison sociale</Label>
            <Input
              id="legalName"
              name="legalName"
              defaultValue={client?.legalName ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="siret">SIRET</Label>
            <Input
              id="siret"
              name="siret"
              defaultValue={client?.siret ?? ""}
              maxLength={14}
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label htmlFor="pipelineStage">Étape pipeline</Label>
            <Select
              value={pipelineStage}
              onValueChange={(v) => setPipelineStage(v as ClientPipelineStage)}
            >
              <SelectTrigger id="pipelineStage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PIPELINE_STAGES.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {CLIENT_PIPELINE_LABELS[stage]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact principal</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contactFirstName">Prénom</Label>
            <Input
              id="contactFirstName"
              name="contactFirstName"
              defaultValue={client?.contactFirstName ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactLastName">Nom</Label>
            <Input
              id="contactLastName"
              name="contactLastName"
              defaultValue={client?.contactLastName ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email</Label>
            <Input
              id="contactEmail"
              name="contactEmail"
              type="email"
              defaultValue={client?.contactEmail ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Téléphone</Label>
            <Input
              id="contactPhone"
              name="contactPhone"
              defaultValue={client?.contactPhone ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPosition">Fonction</Label>
            <Input
              id="contactPosition"
              name="contactPosition"
              defaultValue={client?.contactPosition ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adresse</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="addressLine1">Adresse</Label>
            <Input
              id="addressLine1"
              name="addressLine1"
              defaultValue={client?.addressLine1 ?? ""}
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label htmlFor="addressLine2">Complément</Label>
            <Input
              id="addressLine2"
              name="addressLine2"
              defaultValue={client?.addressLine2 ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">Code postal</Label>
            <Input
              id="postalCode"
              name="postalCode"
              defaultValue={client?.postalCode ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              name="city"
              defaultValue={client?.city ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Facturation</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="paymentTerms">Délai de paiement (jours)</Label>
            <Input
              id="paymentTerms"
              name="paymentTerms"
              type="number"
              defaultValue={client?.paymentTerms ?? ""}
              placeholder="Par défaut : 30"
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label htmlFor="notes">Notes internes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={client?.notes ?? ""}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading
            ? "Enregistrement..."
            : isEditing
              ? "Mettre à jour"
              : "Créer le client"}
        </Button>
      </div>
    </form>
  );
}
