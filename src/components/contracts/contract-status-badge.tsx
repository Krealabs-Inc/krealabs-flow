"use client";

import { Badge } from "@/components/ui/badge";
import {
  contractStatusLabels,
  contractStatusColors,
  type ContractStatus,
} from "@/types/contract";

export function ContractStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="secondary"
      className={contractStatusColors[status as ContractStatus] ?? ""}
    >
      {contractStatusLabels[status as ContractStatus] ?? status}
    </Badge>
  );
}
