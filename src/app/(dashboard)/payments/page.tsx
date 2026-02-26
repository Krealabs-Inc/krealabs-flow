"use client";

import { useEffect, useState, useCallback } from "react";
import { useOrg } from "@/contexts/org-context";
import { Search, Filter, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaymentTable } from "@/components/payments/payment-table";
import { PaymentCard } from "@/components/shared/payment-card";
import type { Payment } from "@/types/payment";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/button";

const METHOD_OPTIONS = [
  { value: "all", label: "Toutes les méthodes" },
  { value: "bank_transfer", label: "Virement" },
  { value: "check", label: "Chèque" },
  { value: "card", label: "CB" },
  { value: "cash", label: "Espèces" },
  { value: "paypal", label: "PayPal" },
  { value: "stripe", label: "Stripe" },
];

export default function PaymentsPage() {
  const { currentOrgId } = useOrg();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
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

  const fetchPayments = useCallback(
    async (page = 1) => {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (methodFilter !== "all") params.set("method", methodFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      try {
        params.set("orgId", currentOrgId);
        const res = await fetch(`/api/payments?${params}`);
        const text = await res.text();
        if (!text) { setLoading(false); return; }
        const data: PaginatedResponse<Payment> = JSON.parse(text);
        if (data.success) {
          setPayments(data.data);
          setPagination(data.pagination);
        }
      } catch {
        // DB not ready
      }
      setLoading(false);
    },
    [methodFilter, dateFrom, dateTo, currentOrgId]
  );

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  function handleRefund(id: string) {
    setConfirmState({
      open: true,
      title: "Rembourser ce paiement",
      description: "Voulez-vous vraiment rembourser ce paiement ?",
      confirmText: "Rembourser",
      variant: "destructive",
      onConfirm: async () => {
        await fetch(`/api/payments/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "refund" }),
        });
        fetchPayments(pagination.page);
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paiements</h1>
          <p className="text-muted-foreground">
            {pagination.total} paiement(s)
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex"
          onClick={() => window.open("/api/export/payments", "_blank")}
        >
          <Download className="mr-2 h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="sm:w-52">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {METHOD_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground shrink-0">Du</span>
          <Input
            type="date"
            className="flex-1 sm:w-40"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <span className="text-sm text-muted-foreground shrink-0">au</span>
          <Input
            type="date"
            className="flex-1 sm:w-40"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <PaymentTable payments={payments} onRefund={handleRefund} />
          </div>
          <div className="md:hidden space-y-3">
            {payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                <p className="text-muted-foreground">Aucun paiement pour le moment</p>
              </div>
            ) : (
              payments.map((p) => <PaymentCard key={p.id} payment={p} />)
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
            onClick={() => fetchPayments(pagination.page - 1)}
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
            onClick={() => fetchPayments(pagination.page + 1)}
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
