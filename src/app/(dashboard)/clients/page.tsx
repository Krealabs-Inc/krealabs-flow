"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientTable } from "@/components/clients/client-table";
import { ClientCard } from "@/components/shared/client-card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { Client, PaginatedResponse, ClientPipelineStage } from "@/types";
import { useOrg } from "@/contexts/org-context";
import { CLIENT_PIPELINE_LABELS } from "@/types";

const PIPELINE_STAGES: ClientPipelineStage[] = [
  "prospect",
  "contact_made",
  "proposal_sent",
  "negotiation",
  "active",
  "inactive",
  "lost",
];

export default function ClientsPage() {
  const { currentOrgId } = useOrg();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [stageFilter, setStageFilter] = useState<ClientPipelineStage | "all">("all");
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  const fetchClients = useCallback(async (page = 1, searchQuery = "", stage: ClientPipelineStage | "all" = "all") => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: "20",
      };
      if (searchQuery) params.search = searchQuery;
      if (stage !== "all") params.stage = stage;
      params.orgId = currentOrgId;

      const res = await fetch(`/api/clients?${new URLSearchParams(params)}`);
      const text = await res.text();
      if (!text) { setLoading(false); return; }
      const data: PaginatedResponse<Client> = JSON.parse(text);
      if (data.success) {
        setClients(data.data);
        setPagination(data.pagination);
      }
    } catch {
      // DB not ready
    }
    setLoading(false);
  }, [currentOrgId]);

  useEffect(() => {
    fetchClients(1, search, stageFilter);
  }, [fetchClients, search, stageFilter]);

  async function handlePipelineChange(id: string, stage: ClientPipelineStage) {
    // Optimistic update
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pipelineStage: stage } : c))
    );
    try {
      await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipelineStage: stage }),
      });
    } catch {
      // Revert on failure
      fetchClients(pagination.page, search, stageFilter);
    }
  }

  function handleDelete(id: string) {
    setConfirmState({
      open: true,
      title: "Supprimer ce client",
      description: "Cette action est irréversible. Voulez-vous vraiment supprimer ce client ?",
      confirmText: "Supprimer",
      variant: "destructive",
      onConfirm: async () => {
        await fetch(`/api/clients/${id}`, { method: "DELETE" });
        fetchClients(pagination.page, search, stageFilter);
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            {pagination.total} client{pagination.total > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex"
            onClick={() => window.open("/api/export/clients", "_blank")}
          >
            <Download className="mr-2 h-4 w-4" />
            Exporter CSV
          </Button>
          <Button onClick={() => router.push("/clients/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau client
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={stageFilter}
          onValueChange={(v) => setStageFilter(v as ClientPipelineStage | "all")}
        >
          <SelectTrigger className="sm:w-[200px]">
            <SelectValue placeholder="Toutes les étapes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les étapes</SelectItem>
            {PIPELINE_STAGES.map((stage) => (
              <SelectItem key={stage} value={stage}>
                {CLIENT_PIPELINE_LABELS[stage]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <ClientTable clients={clients} onDelete={handleDelete} onPipelineChange={handlePipelineChange} />
          </div>
          <div className="md:hidden space-y-3">
            {clients.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                <p className="text-muted-foreground">Aucun client pour le moment</p>
              </div>
            ) : (
              clients.map((c) => <ClientCard key={c.id} client={c} />)
            )}
          </div>
        </>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => fetchClients(pagination.page - 1, search, stageFilter)}
          >
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchClients(pagination.page + 1, search, stageFilter)}
          >
            Suivant
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmState.open}
        onClose={() => setConfirmState((s) => ({ ...s, open: false }))}
        onConfirm={() => {
          confirmState.onConfirm();
          setConfirmState((s) => ({ ...s, open: false }));
        }}
        title={confirmState.title}
        description={confirmState.description}
        confirmText={confirmState.confirmText}
        variant={confirmState.variant}
      />
    </div>
  );
}
