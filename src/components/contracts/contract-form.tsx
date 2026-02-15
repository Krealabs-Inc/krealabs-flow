"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Switch } from "@/components/ui/switch";
import type { Contract } from "@/types/contract";
import type { Client, ApiResponse } from "@/types";

interface ContractFormProps {
  contract?: Contract;
}

const BILLING_OPTIONS = [
  { value: "monthly", label: "Mensuel" },
  { value: "quarterly", label: "Trimestriel" },
  { value: "semi_annual", label: "Semestriel" },
  { value: "annual", label: "Annuel" },
];

export function ContractForm({ contract }: ContractFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState(contract?.clientId || "");
  const [billingFrequency, setBillingFrequency] = useState<string>(
    contract?.billingFrequency || "monthly"
  );
  const [autoRenew, setAutoRenew] = useState(contract?.autoRenew ?? true);

  useEffect(() => {
    fetch("/api/clients?limit=100")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setClients(d.data);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      clientId,
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      startDate: formData.get("startDate") as string,
      endDate: formData.get("endDate") as string,
      autoRenew,
      renewalNoticeDays: parseInt(
        (formData.get("renewalNoticeDays") as string) || "60"
      ),
      annualAmountHt: parseFloat(
        (formData.get("annualAmountHt") as string) || "0"
      ),
      billingFrequency,
      terms: (formData.get("terms") as string) || undefined,
    };

    const url = contract
      ? `/api/contracts/${contract.id}`
      : "/api/contracts";
    const method = contract ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data: ApiResponse<Contract> = await res.json();

    if (data.success) {
      router.push(`/contracts/${data.data.id}`);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations du contrat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
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
              <Label htmlFor="name">Nom du contrat *</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={contract?.name}
                placeholder="Maintenance annuelle..."
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={contract?.description ?? ""}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Période et facturation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Date de début *</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                required
                defaultValue={contract?.startDate}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin *</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                required
                defaultValue={contract?.endDate}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="annualAmountHt">Montant annuel HT *</Label>
              <Input
                id="annualAmountHt"
                name="annualAmountHt"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={contract?.annualAmountHt}
              />
            </div>
            <div className="space-y-2">
              <Label>Fréquence de facturation</Label>
              <Select
                value={billingFrequency}
                onValueChange={setBillingFrequency}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={autoRenew}
                onCheckedChange={setAutoRenew}
                id="autoRenew"
              />
              <Label htmlFor="autoRenew">Renouvellement automatique</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="renewalNoticeDays">
                Préavis (jours)
              </Label>
              <Input
                id="renewalNoticeDays"
                name="renewalNoticeDays"
                type="number"
                min="0"
                className="w-24"
                defaultValue={contract?.renewalNoticeDays ?? 60}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            name="terms"
            rows={4}
            defaultValue={contract?.terms ?? ""}
            placeholder="Conditions générales du contrat..."
          />
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
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
            : contract
              ? "Mettre à jour"
              : "Créer le contrat"}
        </Button>
      </div>
    </form>
  );
}
