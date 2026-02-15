"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import type { TreasuryStats } from "@/types/payment";

const fmt = (val: number) =>
  val.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export default function TreasuryPage() {
  const [stats, setStats] = useState<TreasuryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/payments?stats=true");
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
  }, []);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trésorerie</h1>
        <p className="text-muted-foreground">Vue d&apos;ensemble financière</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Encaissé cette année
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {fmt(stats.totalReceived)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En attente de paiement
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {fmt(stats.totalPending)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Factures en retard
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {fmt(stats.totalOverdue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly revenue chart (simple bar chart with CSS) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            CA mensuel (12 derniers mois)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.monthlyRevenue.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune donnée disponible
            </p>
          ) : (
            <div className="flex items-end gap-2 h-48">
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
                    <span className="text-xs text-muted-foreground">
                      {fmt(m.amount)}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
