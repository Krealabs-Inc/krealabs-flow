"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClientTable } from "@/components/clients/client-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { Client, PaginatedResponse } from "@/types";

export default function ClientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
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

  const fetchClients = useCallback(async (page = 1, searchQuery = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients?${new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(searchQuery ? { search: searchQuery } : {}),
      })}`);
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
  }, []);

  useEffect(() => {
    fetchClients(1, search);
  }, [fetchClients, search]);

  function handleDelete(id: string) {
    setConfirmState({
      open: true,
      title: "Supprimer ce client",
      description: "Cette action est irréversible. Voulez-vous vraiment supprimer ce client ?",
      confirmText: "Supprimer",
      variant: "destructive",
      onConfirm: async () => {
        await fetch(`/api/clients/${id}`, { method: "DELETE" });
        fetchClients(pagination.page, search);
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
        <Button onClick={() => router.push("/clients/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau client
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
        </div>
      ) : (
        <ClientTable clients={clients} onDelete={handleDelete} />
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => fetchClients(pagination.page - 1, search)}
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
            onClick={() => fetchClients(pagination.page + 1, search)}
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
