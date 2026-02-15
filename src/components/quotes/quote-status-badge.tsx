import { cn } from "@/lib/utils";
import { quoteStatusLabels, quoteStatusColors, type QuoteStatus } from "@/types/quote";

interface QuoteStatusBadgeProps {
  status: QuoteStatus;
}

export function QuoteStatusBadge({ status }: QuoteStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        quoteStatusColors[status]
      )}
    >
      {quoteStatusLabels[status]}
    </span>
  );
}
