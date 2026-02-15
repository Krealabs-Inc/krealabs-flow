import { cn } from "@/lib/utils";
import {
  invoiceStatusLabels,
  invoiceStatusColors,
  type InvoiceStatus,
} from "@/types/invoice";

interface InvoiceStatusBadgeProps {
  status: string;
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const s = status as InvoiceStatus;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        invoiceStatusColors[s]
      )}
    >
      {invoiceStatusLabels[s]}
    </span>
  );
}
