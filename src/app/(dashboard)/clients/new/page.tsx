import { ClientForm } from "@/components/clients/client-form";

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nouveau client</h1>
        <p className="text-muted-foreground">
          Remplissez les informations du client
        </p>
      </div>

      <ClientForm />
    </div>
  );
}
