"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { invoiceTypeLabels, type Invoice, type InvoiceType } from "@/types/invoice";

interface InvoiceCardProps {
  invoice: Invoice;
  onAction?: (id: string, action: string) => void;
}

const fmt = (val: string | null) =>
  parseFloat(val ?? "0").toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });

export function InvoiceCard({ invoice }: InvoiceCardProps) {
  const router = useRouter();

  const isOverdue =
    invoice.status !== "paid" &&
    invoice.status !== "cancelled" &&
    new Date(invoice.dueDate) < new Date();

  const amountDue = parseFloat(invoice.amountDue ?? "0");

  return (
    <div
      className="rounded-lg border bg-card p-4 cursor-pointer hover:border-primary/50 transition-colors active:bg-muted/30"
      onClick={() => router.push(`/invoices/${invoice.id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-semibold text-sm">{invoice.invoiceNumber}</span>
            <Badge variant="outline" className="text-xs shrink-0">
              {invoiceTypeLabels[invoice.type as InvoiceType] || invoice.type}
            </Badge>
          </div>
          {invoice.clientName && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{invoice.clientName}</p>
          )}
        </div>
        <InvoiceStatusBadge status={invoice.status} />
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="text-sm text-muted-foreground">
          Échéance{" "}
          <span className={isOverdue ? "text-red-600 font-medium" : ""}>
            {new Date(invoice.dueDate).toLocaleDateString("fr-FR")}
          </span>
        </div>
        <div className="text-right">
          <div className="font-semibold text-sm">{fmt(invoice.totalTtc)}</div>
          {amountDue > 0 ? (
            <div className="text-xs text-red-600">Reste : {fmt(invoice.amountDue)}</div>
          ) : (
            <div className="text-xs text-green-600">Soldée</div>
          )}
        </div>
      </div>
    </div>
  );
}
