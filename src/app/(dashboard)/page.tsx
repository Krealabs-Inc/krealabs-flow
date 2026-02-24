"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  FileText,
  Users,
  ScrollText,
  AlertTriangle,
  CreditCard,
  BarChart3,
  Activity,
  FileTextIcon,
} from "lucide-react";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import type { DashboardStats } from "@/lib/services/dashboard.service";
import type { ActivityItem } from "@/app/api/activity/route";
import { useOrg } from "@/contexts/org-context";

const fmt = (val: number) =>
  val.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export default function DashboardPage() {
  const router = useRouter();
  const { currentOrgId } = useOrg();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/dashboard?orgId=${currentOrgId}`);
        const text = await res.text();
        if (!text) { setLoading(false); return; }
        const data = JSON.parse(text);
        if (data.success) setStats(data.data);
      } catch {
        // DB not ready
      }
      setLoading(false);
    }
    load();

    // Load activity feed independently
    fetch(`/api/activity?orgId=${currentOrgId}`)
      .then((r) => r.json())
      .then((j) => { if (j.success) setActivityItems(j.data); })
      .catch(() => {});
  }, [currentOrgId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-muted-foreground">Erreur de chargement</p>;
  }

  const revenueGrowth =
    stats.revenue.lastMonth > 0
      ? ((stats.revenue.thisMonth - stats.revenue.lastMonth) /
          stats.revenue.lastMonth) *
        100
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Vue d&apos;ensemble de votre activité</p>
      </div>

      {/* Main KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              CA ce mois
            </CardTitle>
            {revenueGrowth >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fmt(stats.revenue.thisMonth)}
            </div>
            <p className="text-xs text-muted-foreground">
              {revenueGrowth >= 0 ? "+" : ""}
              {revenueGrowth.toFixed(1)}% vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              CA annuel
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fmt(stats.revenue.thisYear)}
            </div>
            <p className="text-xs text-muted-foreground">
              MRR contrats : {fmt(stats.contracts.monthlyRecurring)}
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => router.push("/invoices")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Impayés
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {fmt(stats.invoices.totalDue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.invoices.unpaid} facture(s) en attente
              {stats.invoices.overdue > 0 && (
                <span className="text-red-600">
                  {" "}
                  dont {stats.invoices.overdue} en retard
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taux de conversion
            </CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.quotes.conversionRate.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.quotes.acceptedThisMonth} devis accepté(s) ce mois
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.clients.total}</div>
            {stats.clients.newThisMonth > 0 && (
              <p className="text-xs text-green-600">
                +{stats.clients.newThisMonth} ce mois
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Devis en attente
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.quotes.pending}</div>
            <p className="text-xs text-muted-foreground">
              {stats.quotes.total} au total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Factures
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.invoices.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contrats actifs
            </CardTitle>
            <ScrollText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.contracts.active}</div>
            {stats.contracts.renewalPending > 0 && (
              <p className="text-xs text-amber-600">
                {stats.contracts.renewalPending} renouvellement(s)
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly revenue chart */}
      {stats.monthlyRevenue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Évolution du CA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-40">
              {stats.monthlyRevenue.map((m) => {
                const maxAmount = Math.max(
                  ...stats.monthlyRevenue.map((r) => r.amount)
                );
                const heightPercent =
                  maxAmount > 0 ? (m.amount / maxAmount) * 100 : 0;
                return (
                  <div
                    key={m.month}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <span className="text-xs text-muted-foreground truncate max-w-full">
                      {m.amount > 0 ? fmt(m.amount) : ""}
                    </span>
                    <div
                      className="w-full bg-primary/80 rounded-t min-h-[2px]"
                      style={{ height: `${Math.max(heightPercent, 1)}%` }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {m.month.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Dernières factures
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune facture
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded p-2 -mx-2"
                    onClick={() => router.push(`/invoices/${inv.id}`)}
                  >
                    <div>
                      <p className="text-sm font-medium font-mono">
                        {inv.invoiceNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {inv.clientName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <InvoiceStatusBadge status={inv.status} />
                      <span className="text-sm font-medium">
                        {fmt(parseFloat(inv.totalTtc ?? "0"))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Derniers paiements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun paiement
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentPayments.map((pay) => (
                  <div
                    key={pay.id}
                    className="flex items-center justify-between p-2 -mx-2"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {pay.clientName ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pay.invoiceNumber} —{" "}
                        {new Date(pay.paymentDate).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      + {fmt(parseFloat(pay.amount))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activité récente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activityItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune activité récente
            </p>
          ) : (
            <div className="space-y-1">
              {activityItems.map((item) => {
                const relativeDate = (() => {
                  const diff = Date.now() - new Date(item.date).getTime();
                  const mins = Math.floor(diff / 60000);
                  const hours = Math.floor(mins / 60);
                  const days = Math.floor(hours / 24);
                  if (days > 0) return `il y a ${days}j`;
                  if (hours > 0) return `il y a ${hours}h`;
                  if (mins > 0) return `il y a ${mins}min`;
                  return "à l'instant";
                })();
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex items-center justify-between rounded-lg p-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        {item.type === "invoice" && <Receipt className="h-4 w-4 text-primary" />}
                        {item.type === "payment" && <CreditCard className="h-4 w-4 text-green-600" />}
                        {item.type === "quote" && <FileTextIcon className="h-4 w-4 text-violet-600" />}
                        {item.type === "client" && <Users className="h-4 w-4 text-blue-600" />}
                        {item.type === "contract" && <ScrollText className="h-4 w-4 text-amber-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-tight">
                          {item.action}{" "}
                          <span className="font-mono">{item.label}</span>
                        </p>
                        {item.amount && (
                          <p className="text-xs text-muted-foreground">
                            {parseFloat(item.amount).toLocaleString("fr-FR", {
                              style: "currency",
                              currency: "EUR",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-4">
                      {relativeDate}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
