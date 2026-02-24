"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Clock, AlertCircle, Wallet } from "lucide-react";
import type {
  TreasuryPageStats,
  TreasuryTopClient,
  TreasuryUnpaidInvoice,
  TreasuryForecastItem,
} from "@/types/payment";

// ── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-FR") : "—";

function getDaysLate(dueDate: string | null): number {
  if (!dueDate) return 0;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = today.getTime() - due.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

const statusColors: Record<string, string> = {
  overdue: "bg-red-100 text-red-700",
  sent: "bg-blue-100 text-blue-700",
  partially_paid: "bg-orange-100 text-orange-700",
  viewed: "bg-gray-100 text-gray-700",
};

const statusLabels: Record<string, string> = {
  overdue: "En retard",
  sent: "Envoyée",
  partially_paid: "Partiel",
  viewed: "Vue",
};

// ── Current month label ────────────────────────────────────────────────────

function getCurrentMonthLabel() {
  return new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  icon: Icon,
  colorClass,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${colorClass}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClass}`}>{fmt(value)}</div>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-28" />
      </CardContent>
    </Card>
  );
}

// Custom tooltip for the area chart
function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm">
      <p className="font-medium">{label}</p>
      <p className="text-[#8B89F7]">{fmt(payload[0].value)}</p>
    </div>
  );
}

// Top-clients bar chart
function TopClientsChart({ data }: { data: TreasuryTopClient[] }) {
  if (data.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8 text-sm">
        Aucun paiement reçu pour le moment
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E4E1" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          type="category"
          dataKey="clientName"
          width={110}
          tick={{ fontSize: 11 }}
        />
        <Tooltip
          formatter={(v: number | undefined) => [fmt(v ?? 0), "Encaissé"]}
          cursor={{ fill: "rgba(139,137,247,0.08)" }}
        />
        <Bar dataKey="totalPaid" radius={[0, 4, 4, 0]}>
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={index === 0 ? "#8B89F7" : `rgba(139,137,247,${1 - index * 0.1})`}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Unpaid invoices table
function UnpaidInvoicesTable({ data }: { data: TreasuryUnpaidInvoice[] }) {
  if (data.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8 text-sm">
        Aucune facture impayée
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="pb-2 text-left font-medium">Client</th>
            <th className="pb-2 text-left font-medium">N° facture</th>
            <th className="pb-2 text-right font-medium">Montant dû</th>
            <th className="pb-2 text-center font-medium">Échéance</th>
            <th className="pb-2 text-center font-medium">Retard</th>
            <th className="pb-2 text-center font-medium">Statut</th>
          </tr>
        </thead>
        <tbody>
          {data.map((inv) => {
            const daysLate = getDaysLate(inv.dueDate);
            return (
              <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="py-2 pr-4 font-medium">{inv.clientName}</td>
                <td className="py-2 pr-4">
                  <Link
                    href={`/invoices/${inv.id}`}
                    className="text-primary hover:underline"
                  >
                    {inv.invoiceNumber}
                  </Link>
                </td>
                <td className="py-2 pr-4 text-right font-semibold">
                  {fmt(parseFloat(inv.amountDue ?? "0"))}
                </td>
                <td className="py-2 px-4 text-center text-muted-foreground">
                  {fmtDate(inv.dueDate)}
                </td>
                <td className="py-2 px-4 text-center">
                  {daysLate > 0 ? (
                    <span className="text-red-600 font-medium">{daysLate}j</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-2 text-center">
                  <Badge
                    className={`text-xs ${statusColors[inv.status] ?? "bg-gray-100 text-gray-700"}`}
                    variant="secondary"
                  >
                    {statusLabels[inv.status] ?? inv.status}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Forecast table
function ForecastTable({ data }: { data: TreasuryForecastItem[] }) {
  if (data.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8 text-sm">
        Aucune échéance dans les 30 prochains jours
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="pb-2 text-left font-medium">Échéance</th>
            <th className="pb-2 text-left font-medium">Client</th>
            <th className="pb-2 text-left font-medium">N° facture</th>
            <th className="pb-2 text-right font-medium">Montant attendu</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="border-b last:border-0 hover:bg-muted/30">
              <td className="py-2 pr-4 text-muted-foreground">
                {fmtDate(item.dueDate)}
              </td>
              <td className="py-2 pr-4 font-medium">{item.clientName}</td>
              <td className="py-2 pr-4 text-primary">{item.invoiceNumber}</td>
              <td className="py-2 text-right font-semibold">
                {fmt(parseFloat(item.amountDue ?? "0"))}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t">
            <td colSpan={3} className="pt-3 font-semibold text-muted-foreground">
              Total prévisionnel 30j
            </td>
            <td className="pt-3 text-right font-bold text-[#8B89F7]">
              {fmt(
                data.reduce(
                  (acc, item) => acc + parseFloat(item.amountDue ?? "0"),
                  0
                )
              )}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function TreasuryPage() {
  const [data, setData] = useState<TreasuryPageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/treasury");
        const text = await res.text();
        if (!text) {
          setLoading(false);
          return;
        }
        const json = JSON.parse(text);
        if (json.success) setData(json.data as TreasuryPageStats);
      } catch {
        // DB not ready
      }
      setLoading(false);
    }
    load();
  }, []);

  // ── Loading state ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-40" />
          <Skeleton className="mt-1 h-4 w-52" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-60 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <p className="text-muted-foreground">Erreur de chargement des données</p>
      </div>
    );
  }

  const { summary, monthly, topClients, unpaidInvoices, forecast } = data;

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trésorerie</h1>
          <p className="text-muted-foreground capitalize">{getCurrentMonthLabel()}</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Encaissé ce mois"
          value={summary.receivedThisMonth}
          icon={TrendingUp}
          colorClass="text-green-600"
        />
        <StatCard
          title="En attente"
          value={summary.pending}
          icon={Clock}
          colorClass="text-amber-600"
        />
        <StatCard
          title="En retard"
          value={summary.overdue}
          icon={AlertCircle}
          colorClass="text-red-600"
        />
        <StatCard
          title="MRR (contrats actifs)"
          value={summary.mrr}
          icon={Wallet}
          colorClass="text-[#8B89F7]"
        />
      </div>

      {/* Revenue area chart (12 months) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <TrendingUp className="h-4 w-4 text-[#8B89F7]" />
            Revenus encaissés sur 12 mois
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthly.every((m) => m.received === 0) ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Aucun encaissement sur les 12 derniers mois
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthly} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B89F7" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8B89F7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E4E1" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${Math.round(v / 1000)}k€` : `${v}€`
                  }
                  tick={{ fontSize: 12 }}
                  width={48}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Area
                  type="monotone"
                  dataKey="received"
                  stroke="#8B89F7"
                  fill="url(#colorRevenue)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: "#8B89F7" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top clients + Unpaid invoices */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Top clients (encaissements)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TopClientsChart data={topClients} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Factures impayées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UnpaidInvoicesTable data={unpaidInvoices} />
          </CardContent>
        </Card>
      </div>

      {/* 30-day forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Clock className="h-4 w-4 text-amber-500" />
            Prévisionnel 30 jours — Encaissements attendus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ForecastTable data={forecast} />
        </CardContent>
      </Card>
    </div>
  );
}
