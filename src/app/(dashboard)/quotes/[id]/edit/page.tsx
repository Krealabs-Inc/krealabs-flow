"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { QuoteForm } from "@/components/quotes/quote-form";
import type { Quote } from "@/types/quote";
import type { ApiResponse } from "@/types";

export default function EditQuotePage() {
  const params = useParams();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/quotes/${params.id}`);
      const data: ApiResponse<Quote> = await res.json();
      if (data.success) setQuote(data.data);
      setLoading(false);
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Devis non trouvé</p>
      </div>
    );
  }

  if (quote.status !== "draft") {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Seuls les devis en brouillon peuvent être modifiés
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Modifier {quote.quoteNumber}
        </h1>
        <p className="text-muted-foreground">{quote.reference}</p>
      </div>

      <QuoteForm quote={quote} />
    </div>
  );
}
