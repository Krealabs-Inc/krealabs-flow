import { InvoiceForm } from "@/components/invoices/invoice-form";

export default function NewInvoicePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouvelle facture</h1>
        <p className="text-muted-foreground">
          Créer une facture manuelle directement sans devis
        </p>
      </div>
      <InvoiceForm />
    </div>
  );
}
