"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuoteTable } from "@/components/quotes/quote-table";
import type { Quote } from "@/types/quote";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { PaginatedResponse } from "@/types";

const STATUS_OPTIONS = [
  { value: "all", label: "Tous les statuts" },
  { value: "draft", label: "Brouillon" },
  { value: "sent", label: "Envoyé" },
  { value: "accepted", label: "Accepté" },
  { value: "rejected", label: "Refusé" },
  { value: "expired", label: "Expiré" },
  { value: "converted", label: "Converti" },
];

export default function QuotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState("all");
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

  const fetchQuotes = useCallback(
    async (page = 1, searchQuery = "", status = "all") => {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (searchQuery) params.set("search", searchQuery);
      if (status !== "all") params.set("status", status);

      try {
        const res = await fetch(`/api/quotes?${params}`);
        const text = await res.text();
        if (!text) { setLoading(false); return; }
        const data: PaginatedResponse<Quote> = JSON.parse(text);
        if (data.success) {
          setQuotes(data.data);
          setPagination(data.pagination);
        }
      } catch {
        // DB not ready
      }
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    fetchQuotes(1, search, statusFilter);
  }, [fetchQuotes, search, statusFilter]);

  async function handleAction(id: string, action: string) {
    if (action === "convert") {
      setConfirmState({
        open: true,
        title: "Convertir en facture",
        description: "Voulez-vous vraiment convertir ce devis en facture ?",
        confirmText: "Convertir",
        variant: "default",
        onConfirm: async () => {
          await fetch(`/api/quotes/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
          });
          fetchQuotes(pagination.page, search, statusFilter);
          router.push("/invoices");
        },
      });
      return;
    }
    await fetch(`/api/quotes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    fetchQuotes(pagination.page, search, statusFilter);
  }

  function handleDelete(id: string) {
    setConfirmState({
      open: true,
      title: "Supprimer ce devis",
      description: "Cette action est irréversible. Voulez-vous vraiment supprimer ce devis ?",
      confirmText: "Supprimer",
      variant: "destructive",
      onConfirm: async () => {
        await fetch(`/api/quotes/${id}`, { method: "DELETE" });
        fetchQuotes(pagination.page, search, statusFilter);
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Devis</h1>
          <p className="text-muted-foreground">
            {pagination.total} devis
          </p>
        </div>
        <Button onClick={() => router.push("/quotes/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau devis
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un devis..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
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
        <QuoteTable
          quotes={quotes}
          onAction={handleAction}
          onDelete={handleDelete}
        />
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() =>
              fetchQuotes(pagination.page - 1, search, statusFilter)
            }
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
            onClick={() =>
              fetchQuotes(pagination.page + 1, search, statusFilter)
            }
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
