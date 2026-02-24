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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import type { Client, ClientPipelineStage } from "@/types";
import { CLIENT_PIPELINE_LABELS, CLIENT_PIPELINE_COLORS } from "@/types";

interface ClientTableProps {
  clients: Client[];
  onDelete?: (id: string) => void;
}

export function ClientTable({ clients, onDelete }: ClientTableProps) {
  const router = useRouter();

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">Aucun client pour le moment</p>
        <Button
          className="mt-4"
          onClick={() => router.push("/clients/new")}
        >
          Ajouter un client
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Entreprise</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Ville</TableHead>
            <TableHead>Pipeline</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => {
            const stage = client.pipelineStage as ClientPipelineStage | null | undefined;
            return (
              <TableRow
                key={client.id}
                className="cursor-pointer"
                onClick={() => router.push(`/clients/${client.id}`)}
              >
                <TableCell className="font-medium">
                  {client.companyName}
                  {client.siret && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      SIRET
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {[client.contactFirstName, client.contactLastName]
                    .filter(Boolean)
                    .join(" ") || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {client.contactEmail || "—"}
                </TableCell>
                <TableCell>{client.city || "—"}</TableCell>
                <TableCell>
                  {stage ? (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CLIENT_PIPELINE_COLORS[stage]}`}
                    >
                      {CLIENT_PIPELINE_LABELS[stage]}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
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
                          router.push(`/clients/${client.id}`);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Voir
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/clients/${client.id}/edit`);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete?.(client.id);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
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
