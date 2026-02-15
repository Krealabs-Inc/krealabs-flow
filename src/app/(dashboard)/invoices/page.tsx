"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvoiceTable } from "@/components/invoices/invoice-table";
import { PaymentDialog } from "@/components/invoices/payment-dialog";
import type { Invoice } from "@/types/invoice";
import type { PaginatedResponse } from "@/types";

const STATUS_OPTIONS = [
  { value: "all", label: "Tous les statuts" },
  { value: "draft", label: "Brouillon" },
  { value: "sent", label: "Envoyée" },
  { value: "partially_paid", label: "Partiellement payée" },
  { value: "paid", label: "Payée" },
  { value: "overdue", label: "En retard" },
  { value: "cancelled", label: "Annulée" },
];

export default function InvoicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tab, setTab] = useState("all");
  const [paymentTarget, setPaymentTarget] = useState<Invoice | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const fetchInvoices = useCallback(
    async (page = 1, searchQuery = "", status = "all", tabValue = "all") => {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (searchQuery) params.set("search", searchQuery);
      if (status !== "all") params.set("status", status);
      if (tabValue === "unpaid") params.set("unpaid", "true");
      if (tabValue === "overdue") params.set("overdue", "true");

      try {
        const res = await fetch(`/api/invoices?${params}`);
        const text = await res.text();
        if (!text) { setLoading(false); return; }
        const data: PaginatedResponse<Invoice> = JSON.parse(text);
        if (data.success) {
          setInvoices(data.data);
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
    fetchInvoices(1, search, statusFilter, tab);
  }, [fetchInvoices, search, statusFilter, tab]);

  async function handleAction(id: string, action: string) {
    if (action === "record_payment") {
      const inv = invoices.find((i) => i.id === id);
      if (inv) setPaymentTarget(inv);
      return;
    }

    if (action === "cancel" && !confirm("Annuler cette facture ?")) return;

    await fetch(`/api/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    fetchInvoices(pagination.page, search, statusFilter, tab);
  }

  async function handlePayment(data: {
    amount: number;
    method: string;
    paymentDate: string;
    reference?: string;
    notes?: string;
  }) {
    if (!paymentTarget) return;

    await fetch(`/api/invoices/${paymentTarget.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "record_payment", ...data }),
    });
    setPaymentTarget(null);
    fetchInvoices(pagination.page, search, statusFilter, tab);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette facture ?")) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    fetchInvoices(pagination.page, search, statusFilter, tab);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Factures</h1>
          <p className="text-muted-foreground">{pagination.total} facture(s)</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="unpaid">Impayées</TabsTrigger>
          <TabsTrigger value="overdue">En retard</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher une facture..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-52">
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
        <InvoiceTable
          invoices={invoices}
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
              fetchInvoices(
                pagination.page - 1,
                search,
                statusFilter,
                tab
              )
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
              fetchInvoices(
                pagination.page + 1,
                search,
                statusFilter,
                tab
              )
            }
          >
            Suivant
          </Button>
        </div>
      )}

      {paymentTarget && (
        <PaymentDialog
          open
          onClose={() => setPaymentTarget(null)}
          onSubmit={handlePayment}
          amountDue={parseFloat(paymentTarget.amountDue ?? "0")}
          invoiceNumber={paymentTarget.invoiceNumber}
        />
      )}
    </div>
  );
}
