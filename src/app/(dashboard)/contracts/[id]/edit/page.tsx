"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ContractForm } from "@/components/contracts/contract-form";
import type { Contract } from "@/types/contract";
import type { ApiResponse } from "@/types";

export default function EditContractPage() {
  const params = useParams();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/contracts/${params.id}`);
      const data: ApiResponse<Contract> = await res.json();
      if (data.success) setContract(data.data);
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

  if (!contract) {
    return <p className="text-center text-muted-foreground">Contrat non trouvé</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        Modifier — {contract.contractNumber}
      </h1>
      <ContractForm contract={contract} />
    </div>
  );
}
