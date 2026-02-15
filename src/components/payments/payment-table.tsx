"use client";

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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Undo2 } from "lucide-react";
import { PaymentStatusBadge } from "./payment-status-badge";
import { paymentMethodLabels, type Payment, type PaymentMethod } from "@/types/payment";

interface PaymentTableProps {
  payments: Payment[];
  onRefund?: (id: string) => void;
}

const fmt = (val: string | null) =>
  parseFloat(val ?? "0").toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });

export function PaymentTable({ payments, onRefund }: PaymentTableProps) {
  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">Aucun paiement pour le moment</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Facture</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Méthode</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Montant</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>
                {new Date(payment.paymentDate).toLocaleDateString("fr-FR")}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {payment.invoiceNumber ?? "—"}
              </TableCell>
              <TableCell>{payment.clientName ?? "—"}</TableCell>
              <TableCell>
                {paymentMethodLabels[payment.method as PaymentMethod] ??
                  payment.method}
              </TableCell>
              <TableCell>
                <PaymentStatusBadge status={payment.status} />
              </TableCell>
              <TableCell className="text-right font-medium">
                <span
                  className={
                    parseFloat(payment.amount) < 0
                      ? "text-red-600"
                      : "text-green-600"
                  }
                >
                  {parseFloat(payment.amount) > 0 ? "+" : ""}
                  {fmt(payment.amount)}
                </span>
              </TableCell>
              <TableCell>
                {payment.status === "received" && onRefund && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onRefund(payment.id)}
                      >
                        <Undo2 className="mr-2 h-4 w-4" />
                        Rembourser
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
