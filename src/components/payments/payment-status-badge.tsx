"use client";

import { Badge } from "@/components/ui/badge";
import {
  paymentStatusLabels,
  paymentStatusColors,
  type PaymentStatus,
} from "@/types/payment";

export function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="secondary"
      className={paymentStatusColors[status as PaymentStatus] ?? ""}
    >
      {paymentStatusLabels[status as PaymentStatus] ?? status}
    </Badge>
  );
}
