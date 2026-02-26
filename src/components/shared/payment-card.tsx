"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { paymentMethodLabels, paymentStatusColors, paymentStatusLabels, type Payment } from "@/types/payment";

interface PaymentCardProps {
  payment: Payment;
}

const fmt = (val: string) =>
  parseFloat(val).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });

export function PaymentCard({ payment }: PaymentCardProps) {
  const router = useRouter();

  return (
    <div
      className="rounded-lg border bg-card p-4 cursor-pointer hover:border-primary/50 transition-colors active:bg-muted/30"
      onClick={() => {
        if (payment.clientId) router.push(`/clients/${payment.clientId}`);
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-green-600">+ {fmt(payment.amount)}</p>
          {payment.clientName && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{payment.clientName}</p>
          )}
          {payment.invoiceNumber && (
            <p className="text-xs text-muted-foreground font-mono">{payment.invoiceNumber}</p>
          )}
        </div>
        <Badge className={`${paymentStatusColors[payment.status]} text-xs shrink-0`}>
          {paymentStatusLabels[payment.status]}
        </Badge>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="text-xs text-muted-foreground">
          {paymentMethodLabels[payment.method] || payment.method}
        </div>
        <div className="text-xs text-muted-foreground">
          {new Date(payment.paymentDate).toLocaleDateString("fr-FR")}
        </div>
      </div>
    </div>
  );
}
