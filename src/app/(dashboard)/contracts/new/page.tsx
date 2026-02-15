"use client";

import { ContractForm } from "@/components/contracts/contract-form";

export default function NewContractPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Nouveau contrat</h1>
      <ContractForm />
    </div>
  );
}
