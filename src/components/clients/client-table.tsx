"use client";

import { useState } from "react";
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
import { MoreHorizontal, Eye, Pencil, Trash2, Check, ChevronDown } from "lucide-react";
import type { Client, ClientPipelineStage } from "@/types";
import { CLIENT_PIPELINE_LABELS, CLIENT_PIPELINE_COLORS } from "@/types";

const PIPELINE_STAGES: ClientPipelineStage[] = [
  "prospect",
  "contact_made",
  "proposal_sent",
  "negotiation",
  "active",
  "inactive",
  "lost",
];

interface ClientTableProps {
  clients: Client[];
  onDelete?: (id: string) => void;
  onPipelineChange?: (id: string, stage: ClientPipelineStage) => Promise<void>;
}

export function ClientTable({ clients, onDelete, onPipelineChange }: ClientTableProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);

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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-80 ${
                          stage
                            ? CLIENT_PIPELINE_COLORS[stage]
                            : "bg-muted text-muted-foreground"
                        } ${updating === client.id ? "opacity-50" : ""}`}
                        onClick={(e) => e.stopPropagation()}
                        disabled={updating === client.id}
                      >
                        {stage ? CLIENT_PIPELINE_LABELS[stage] : "—"}
                        <ChevronDown className="h-2.5 w-2.5 shrink-0" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-48"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {PIPELINE_STAGES.map((s) => (
                        <DropdownMenuItem
                          key={s}
                          className="flex items-center justify-between cursor-pointer"
                          onSelect={async () => {
                            if (s === stage || !onPipelineChange) return;
                            setUpdating(client.id);
                            await onPipelineChange(client.id, s);
                            setUpdating(null);
                          }}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${CLIENT_PIPELINE_COLORS[s].split(" ")[0]}`}
                            />
                            {CLIENT_PIPELINE_LABELS[s]}
                          </span>
                          {s === stage && <Check className="h-3.5 w-3.5 text-primary" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
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
