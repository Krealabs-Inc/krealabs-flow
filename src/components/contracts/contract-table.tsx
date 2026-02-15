"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  Play,
  RefreshCcw,
  XCircle,
  Trash2,
} from "lucide-react";
import { ContractStatusBadge } from "./contract-status-badge";
import {
  billingFrequencyLabels,
  type Contract,
  type BillingFrequency,
} from "@/types/contract";

interface ContractTableProps {
  contracts: Contract[];
  onAction?: (id: string, action: string) => void;
  onDelete?: (id: string) => void;
}

const fmt = (val: string | null) =>
  parseFloat(val ?? "0").toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });

export function ContractTable({
  contracts,
  onAction,
  onDelete,
}: ContractTableProps) {
  const router = useRouter();

  if (contracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          Aucun contrat pour le moment
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>N° Contrat</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Période</TableHead>
            <TableHead>Fréquence</TableHead>
            <TableHead className="text-right">Montant annuel HT</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => (
            <TableRow
              key={contract.id}
              className="cursor-pointer"
              onClick={() => router.push(`/contracts/${contract.id}`)}
            >
              <TableCell className="font-mono font-medium">
                {contract.contractNumber}
              </TableCell>
              <TableCell>{contract.name}</TableCell>
              <TableCell>{contract.clientName ?? "—"}</TableCell>
              <TableCell>
                <ContractStatusBadge status={contract.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(contract.startDate).toLocaleDateString("fr-FR")} —{" "}
                {new Date(contract.endDate).toLocaleDateString("fr-FR")}
              </TableCell>
              <TableCell>
                {billingFrequencyLabels[
                  contract.billingFrequency as BillingFrequency
                ] ?? contract.billingFrequency}
              </TableCell>
              <TableCell className="text-right font-medium">
                {fmt(contract.annualAmountHt)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/contracts/${contract.id}`);
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Voir
                    </DropdownMenuItem>
                    {contract.status === "draft" && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onAction?.(contract.id, "activate");
                        }}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Activer
                      </DropdownMenuItem>
                    )}
                    {(contract.status === "active" ||
                      contract.status === "renewal_pending") && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onAction?.(contract.id, "renew");
                        }}
                      >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Renouveler
                      </DropdownMenuItem>
                    )}
                    {contract.status === "active" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAction?.(contract.id, "terminate");
                          }}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Résilier
                        </DropdownMenuItem>
                      </>
                    )}
                    {contract.status === "draft" && (
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete?.(contract.id);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
