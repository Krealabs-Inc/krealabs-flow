"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClientForm } from "@/components/clients/client-form";
import type { Client, ApiResponse } from "@/types";

export default function EditClientPage() {
  const params = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/clients/${params.id}`);
      const data: ApiResponse<Client> = await res.json();
      if (data.success) setClient(data.data);
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

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Client non trouvé</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Modifier {client.companyName}
        </h1>
        <p className="text-muted-foreground">
          Mettez à jour les informations du client
        </p>
      </div>

      <ClientForm client={client} />
    </div>
  );
}
