import { QuoteForm } from "@/components/quotes/quote-form";

export default function NewQuotePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nouveau devis</h1>
        <p className="text-muted-foreground">
          Créez un devis avec les prestations détaillées
        </p>
      </div>

      <QuoteForm />
    </div>
  );
}
