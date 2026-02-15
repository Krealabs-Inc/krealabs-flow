"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Client, ApiResponse } from "@/types";

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/clients/${params.id}`);
      const data: ApiResponse<Client> = await res.json();
      if (data.success) setClient(data.data);
      setLoading(false);
    }
    load();
  }, [params.id]);

  async function handleDelete() {
    if (!confirm("Supprimer ce client ?")) return;
    await fetch(`/api/clients/${params.id}`, { method: "DELETE" });
    router.push("/clients");
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/clients")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {client.companyName}
            </h1>
            {client.legalName && (
              <p className="text-muted-foreground">{client.legalName}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/clients/${client.id}/edit`)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Modifier
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
            {client.tvaNumber && (
              <div>
                <span className="text-sm text-muted-foreground">N° TVA</span>
                <p className="font-mono text-sm">{client.tvaNumber}</p>
              </div>
            )}
            {!client.siret && !client.tvaNumber && (
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
                  {[client.postalCode, client.city].filter(Boolean).join(" ")}
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
            <div>
              <span className="text-sm text-muted-foreground">Taux TVA</span>
              <p>{client.tvaRate ?? "Par défaut (20)"}%</p>
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
    </div>
  );
}
