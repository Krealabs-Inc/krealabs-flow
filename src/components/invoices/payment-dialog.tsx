"use client";

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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Virement bancaire" },
  { value: "check", label: "Chèque" },
  { value: "card", label: "Carte bancaire" },
  { value: "cash", label: "Espèces" },
  { value: "paypal", label: "PayPal" },
  { value: "stripe", label: "Stripe" },
  { value: "other", label: "Autre" },
];

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    amount: number;
    method: string;
    paymentDate: string;
    reference?: string;
    notes?: string;
  }) => void;
  amountDue: number;
  invoiceNumber: string;
}

export function PaymentDialog({
  open,
  onClose,
  onSubmit,
  amountDue,
  invoiceNumber,
}: PaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(amountDue);
  const [method, setMethod] = useState("bank_transfer");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    onSubmit({
      amount,
      method,
      paymentDate:
        (formData.get("paymentDate") as string) ||
        new Date().toISOString().split("T")[0],
      reference: (formData.get("reference") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    });

    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enregistrer un paiement - {invoiceNumber}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Montant *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max={amountDue}
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Reste dû :{" "}
                {amountDue.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                })}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Méthode *</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Date du paiement</Label>
              <Input
                id="paymentDate"
                name="paymentDate"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Référence</Label>
              <Input
                id="reference"
                name="reference"
                placeholder="N° de virement..."
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || amount <= 0}>
              {loading ? "Enregistrement..." : "Enregistrer le paiement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
