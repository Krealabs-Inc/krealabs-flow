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
import { Badge } from "@/components/ui/badge";
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
  Send,
  CreditCard,
  XCircle,
  Trash2,
  Plus,
} from "lucide-react";
import { InvoiceStatusBadge } from "./invoice-status-badge";
import { invoiceTypeLabels, type Invoice, type InvoiceType } from "@/types/invoice";

interface InvoiceTableProps {
  invoices: Invoice[];
  onAction?: (id: string, action: string) => void;
  onDelete?: (id: string) => void;
}

const fmt = (val: string | null) =>
  parseFloat(val ?? "0").toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });

export function InvoiceTable({
  invoices,
  onAction,
  onDelete,
}: InvoiceTableProps) {
  const router = useRouter();

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">Aucune facture pour le moment</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>N° Facture</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Échéance</TableHead>
            <TableHead className="text-right">Total TTC</TableHead>
            <TableHead className="text-right">Reste dû</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((inv) => {
            const isOverdue =
              inv.status !== "paid" &&
              inv.status !== "cancelled" &&
              new Date(inv.dueDate) < new Date();

            return (
              <TableRow
                key={inv.id}
                className="cursor-pointer"
                onClick={() => router.push(`/invoices/${inv.id}`)}
              >
                <TableCell className="font-mono font-medium">
                  {inv.invoiceNumber}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {invoiceTypeLabels[inv.type as InvoiceType] || inv.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <InvoiceStatusBadge status={inv.status} />
                </TableCell>
                <TableCell
                  className={cn(
                    "text-muted-foreground",
                    isOverdue && "text-red-600 font-medium"
                  )}
                >
                  {new Date(inv.dueDate).toLocaleDateString("fr-FR")}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {fmt(inv.totalTtc)}
                </TableCell>
                <TableCell className="text-right">
                  {parseFloat(inv.amountDue ?? "0") > 0 ? (
                    <span className="font-medium text-red-600">
                      {fmt(inv.amountDue)}
                    </span>
                  ) : (
                    <span className="text-green-600">Soldée</span>
                  )}
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
                          router.push(`/invoices/${inv.id}`);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Voir
                      </DropdownMenuItem>
                      {inv.status === "draft" && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onAction?.(inv.id, "send");
                          }}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Marquer envoyée
                        </DropdownMenuItem>
                      )}
                      {["sent", "viewed", "partially_paid", "overdue"].includes(
                        inv.status
                      ) && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onAction?.(inv.id, "record_payment");
                          }}
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Enregistrer un paiement
                        </DropdownMenuItem>
                      )}
                      {inv.type === "deposit" &&
                        (inv.status === "paid" || inv.status === "partially_paid") && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onAction?.(inv.id, "create_final");
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Créer facture de solde
                          </DropdownMenuItem>
                        )}
                      {inv.status !== "cancelled" &&
                        inv.status !== "paid" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAction?.(inv.id, "cancel");
                              }}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Annuler
                            </DropdownMenuItem>
                          </>
                        )}
                      {inv.status === "draft" && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.(inv.id);
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
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
