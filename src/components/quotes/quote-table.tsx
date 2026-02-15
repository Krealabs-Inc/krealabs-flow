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
  Pencil,
  Copy,
  FileCheck,
  Send,
  Trash2,
} from "lucide-react";
import { QuoteStatusBadge } from "./quote-status-badge";
import type { Quote } from "@/types/quote";

interface QuoteTableProps {
  quotes: Quote[];
  onAction?: (id: string, action: string) => void;
  onDelete?: (id: string) => void;
}

const fmt = (val: string | null) =>
  parseFloat(val ?? "0").toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });

export function QuoteTable({ quotes, onAction, onDelete }: QuoteTableProps) {
  const router = useRouter();

  if (quotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">Aucun devis pour le moment</p>
        <Button
          className="mt-4"
          onClick={() => router.push("/quotes/new")}
        >
          Créer un devis
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>N° Devis</TableHead>
            <TableHead>Référence</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Validité</TableHead>
            <TableHead className="text-right">Montant TTC</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotes.map((quote) => (
            <TableRow
              key={quote.id}
              className="cursor-pointer"
              onClick={() => router.push(`/quotes/${quote.id}`)}
            >
              <TableCell className="font-mono font-medium">
                {quote.quoteNumber}
              </TableCell>
              <TableCell>{quote.reference || "—"}</TableCell>
              <TableCell>
                <QuoteStatusBadge status={quote.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {quote.issueDate
                  ? new Date(quote.issueDate).toLocaleDateString("fr-FR")
                  : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(quote.validityDate).toLocaleDateString("fr-FR")}
              </TableCell>
              <TableCell className="text-right font-medium">
                {fmt(quote.totalTtc)}
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
                        router.push(`/quotes/${quote.id}`);
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Voir
                    </DropdownMenuItem>
                    {quote.status === "draft" && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/quotes/${quote.id}/edit`);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                    )}
                    {quote.status === "draft" && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onAction?.(quote.id, "send");
                        }}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Marquer comme envoyé
                      </DropdownMenuItem>
                    )}
                    {(quote.status === "sent" || quote.status === "viewed") && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onAction?.(quote.id, "accept");
                        }}
                      >
                        <FileCheck className="mr-2 h-4 w-4" />
                        Marquer comme accepté
                      </DropdownMenuItem>
                    )}
                    {quote.status === "accepted" && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onAction?.(quote.id, "convert");
                        }}
                      >
                        <FileCheck className="mr-2 h-4 w-4" />
                        Convertir en facture
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onAction?.(quote.id, "duplicate");
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Dupliquer
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {quote.status === "draft" && (
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete?.(quote.id);
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
