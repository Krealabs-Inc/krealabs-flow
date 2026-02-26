"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { contractStatusLabels, contractStatusColors, type Contract } from "@/types/contract";

interface ContractCardProps {
  contract: Contract;
}

const fmt = (val: string | null | undefined) =>
  parseFloat(val ?? "0").toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });

export function ContractCard({ contract }: ContractCardProps) {
  const router = useRouter();

  return (
    <div
      className="rounded-lg border bg-card p-4 cursor-pointer hover:border-primary/50 transition-colors active:bg-muted/30"
      onClick={() => router.push(`/contracts/${contract.id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="font-mono text-xs text-muted-foreground">{contract.contractNumber}</span>
          <p className="font-semibold text-sm truncate mt-0.5">{contract.name}</p>
          {contract.clientName && (
            <p className="text-xs text-muted-foreground truncate">{contract.clientName}</p>
          )}
        </div>
        <Badge className={`${contractStatusColors[contract.status]} text-xs shrink-0`}>
          {contractStatusLabels[contract.status]}
        </Badge>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="text-xs text-muted-foreground">
          Fin : {new Date(contract.endDate).toLocaleDateString("fr-FR")}
        </div>
        <div className="text-sm font-semibold">{fmt(contract.annualAmountHt)}/an HT</div>
      </div>
    </div>
  );
}
