"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { quoteStatusLabels, quoteStatusColors, type Quote } from "@/types/quote";

interface QuoteCardProps {
  quote: Quote;
}

const fmt = (val: string | null) =>
  parseFloat(val ?? "0").toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });

export function QuoteCard({ quote }: QuoteCardProps) {
  const router = useRouter();

  const isExpired =
    quote.status !== "accepted" &&
    quote.status !== "converted" &&
    new Date(quote.validityDate) < new Date();

  return (
    <div
      className="rounded-lg border bg-card p-4 cursor-pointer hover:border-primary/50 transition-colors active:bg-muted/30"
      onClick={() => router.push(`/quotes/${quote.id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="font-mono font-semibold text-sm">{quote.quoteNumber}</span>
          {quote.clientName && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{quote.clientName}</p>
          )}
        </div>
        <Badge className={quoteStatusColors[quote.status]}>
          {quoteStatusLabels[quote.status]}
        </Badge>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="text-sm text-muted-foreground">
          Valide jusqu&apos;au{" "}
          <span className={isExpired ? "text-red-600 font-medium" : ""}>
            {new Date(quote.validityDate).toLocaleDateString("fr-FR")}
          </span>
        </div>
        <div className="font-semibold text-sm">{fmt(quote.subtotalHt)} HT</div>
      </div>
    </div>
  );
}
