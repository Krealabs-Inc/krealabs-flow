"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CircleDot,
  Euro,
  List,
  CalendarDays,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ObligationType, ObligationStatus } from "@/lib/fiscal/obligation.types";

// ─── Types (sérialisés depuis l'API) ─────────────────────────────────────────

interface ObligationApi {
  id: string;
  obligationKey: string;
  type: ObligationType;
  label: string;
  description: string;
  dueDate: string; // ISO string
  warningDate: string;
  fiscalYear: number;
  calendarYear: number;
  recurring: boolean;
  isFirstYear: boolean;
  status: ObligationStatus;
  amount?: number;
  tags: string[];
  legalReference?: string;
}

interface FiscalApiResult {
  year: number;
  warnings: string[];
  obligations: ObligationApi[];
}

// ─── Helpers visuels ─────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  ObligationType,
  { label: string; color: string; dot: string }
> = {
  TVA_CA12: {
    label: "CA12",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    dot: "bg-blue-500",
  },
  TVA_ACOMPTE: {
    label: "Acompte TVA",
    color: "bg-violet-100 text-violet-800 border-violet-200",
    dot: "bg-violet-500",
  },
  LIASSE: {
    label: "Liasse",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    dot: "bg-orange-500",
  },
  CFE: {
    label: "CFE",
    color: "bg-red-100 text-red-800 border-red-200",
    dot: "bg-red-500",
  },
  URSSAF: {
    label: "URSSAF",
    color: "bg-teal-100 text-teal-800 border-teal-200",
    dot: "bg-teal-500",
  },
  OTHER: {
    label: "Autre",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    dot: "bg-gray-400",
  },
};

const STATUS_CONFIG: Record<
  ObligationStatus,
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  pending: { label: "À régler", color: "text-amber-600", icon: Clock },
  paid: { label: "Réglée", color: "text-green-600", icon: CheckCircle2 },
  overdue: { label: "En retard", color: "text-red-600", icon: AlertTriangle },
};

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getDaysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(iso);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Obligation Card ──────────────────────────────────────────────────────────

function ObligationCard({
  o,
  onMarkPaid,
  loading,
}: {
  o: ObligationApi;
  onMarkPaid: (key: string) => void;
  loading: boolean;
}) {
  const typeConf = TYPE_CONFIG[o.type];
  const statusConf = STATUS_CONFIG[o.status];
  const StatusIcon = statusConf.icon;
  const daysUntil = getDaysUntil(o.dueDate);
  const isUrgent = o.status === "pending" && daysUntil <= 30 && daysUntil >= 0;

  return (
    <Card
      className={`border-l-4 ${
        o.status === "overdue"
          ? "border-l-red-500"
          : o.status === "paid"
            ? "border-l-green-500"
            : isUrgent
              ? "border-l-amber-400"
              : "border-l-muted"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${typeConf.color}`}
              >
                {typeConf.label}
              </span>
              {o.isFirstYear && (
                <span className="inline-flex items-center rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 px-2 py-0.5 text-xs font-medium">
                  Première année
                </span>
              )}
              <span className={`flex items-center gap-1 text-xs ${statusConf.color}`}>
                <StatusIcon className="h-3.5 w-3.5" />
                {statusConf.label}
              </span>
            </div>

            {/* Label */}
            <h3 className="font-semibold text-sm">{o.label}</h3>

            {/* Description */}
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {o.description}
            </p>

            {/* Footer info */}
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">Échéance :</span>{" "}
                {fmtDate(o.dueDate)}
                {o.status === "pending" && (
                  <span
                    className={
                      daysUntil < 0
                        ? " text-red-600 font-medium"
                        : daysUntil <= 30
                          ? " text-amber-600 font-medium"
                          : ""
                    }
                  >
                    {daysUntil < 0
                      ? ` (${Math.abs(daysUntil)}j de retard)`
                      : daysUntil === 0
                        ? " (aujourd'hui)"
                        : ` (dans ${daysUntil}j)`}
                  </span>
                )}
              </span>
              {o.amount !== undefined && (
                <span>
                  <span className="font-medium text-foreground">Montant :</span>{" "}
                  {fmt(o.amount)}
                </span>
              )}
              {o.legalReference && (
                <span className="text-muted-foreground/70">
                  {o.legalReference}
                </span>
              )}
            </div>
          </div>

          {/* Action */}
          {o.status !== "paid" && (
            <Button
              size="sm"
              variant={o.status === "overdue" ? "destructive" : "outline"}
              disabled={loading}
              onClick={() => onMarkPaid(o.obligationKey)}
              className="shrink-0"
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Réglée
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Vue annuelle (12 mois) ───────────────────────────────────────────────────

function AnnualView({
  obligations,
  year,
}: {
  obligations: ObligationApi[];
  year: number;
}) {
  const byMonth: ObligationApi[][] = Array.from({ length: 12 }, () => []);
  for (const o of obligations) {
    const m = new Date(o.dueDate).getMonth();
    byMonth[m].push(o);
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
      {MONTHS_FR.map((month, mi) => {
        const items = byMonth[mi];
        const hasOverdue = items.some((o) => o.status === "overdue");
        const hasPending = items.some((o) => o.status === "pending");

        return (
          <Card
            key={mi}
            className={`${items.length > 0 ? "border-primary/30" : ""}`}
          >
            <CardContent className="p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {month}
              </p>
              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground/50">—</p>
              ) : (
                <div className="space-y-1.5">
                  {items.map((o) => (
                    <div key={o.id} className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${TYPE_CONFIG[o.type].dot}`}
                      />
                      <span className="text-xs leading-tight truncate">
                        {TYPE_CONFIG[o.type].label}
                        {o.amount !== undefined && (
                          <span className="text-muted-foreground">
                            {" "}
                            {fmt(o.amount)}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                  {(hasOverdue || hasPending) && (
                    <div className="flex items-center gap-1 pt-0.5">
                      {hasOverdue && (
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                      )}
                      {hasPending && !hasOverdue && (
                        <Clock className="h-3 w-3 text-amber-500" />
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function FiscalPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<FiscalApiResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  const load = useCallback(async (y: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/fiscal?year=${y}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(year);
  }, [year, load]);

  async function handleMarkPaid(obligationKey: string) {
    setUpdatingKey(obligationKey);
    await fetch(`/api/fiscal/${obligationKey}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" }),
    });
    await load(year);
    setUpdatingKey(null);
  }

  // KPI
  const obligations = data?.obligations ?? [];
  const total = obligations.length;
  const overdue = obligations.filter((o) => o.status === "overdue").length;
  const paid = obligations.filter((o) => o.status === "paid").length;
  const urgent = obligations.filter((o) => {
    const d = getDaysUntil(o.dueDate);
    return o.status === "pending" && d >= 0 && d <= 30;
  }).length;

  // Grouper par mois pour vue chronologique
  const byMonth: Map<number, ObligationApi[]> = new Map();
  for (const o of obligations) {
    const m = new Date(o.dueDate).getMonth();
    if (!byMonth.has(m)) byMonth.set(m, []);
    byMonth.get(m)!.push(o);
  }
  const sortedMonths = Array.from(byMonth.entries()).sort(([a], [b]) => a - b);

  // Estimation total annuel
  const totalAmount = obligations.reduce((s, o) => s + (o.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Obligations fiscales</h1>
          <p className="text-muted-foreground text-sm">
            Régime réel simplifié TVA · Clôture 31/12 · GIE
          </p>
        </div>
        {/* Navigation année */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setYear((y) => y - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-bold w-16 text-center">{year}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setYear((y) => y + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Alertes overdue */}
      {overdue > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>
            <strong>{overdue} obligation{overdue > 1 ? "s" : ""} en retard</strong> —
            vérifiez les échéances dépassées ci-dessous.
          </span>
        </div>
      )}

      {/* Warnings du générateur */}
      {data?.warnings?.map((w, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700 text-sm"
        >
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{w}</span>
        </div>
      ))}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-muted-foreground">Total obligations</p>
              <CircleDot className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{total}</p>
            {totalAmount > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                ≈ {fmt(totalAmount)} estimé
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-muted-foreground">
                Urgentes (≤ 30 jours)
              </p>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600">{urgent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-muted-foreground">En retard</p>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-600">{overdue}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-muted-foreground">Réglées</p>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">{paid}</p>
            {total > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((paid / total) * 100)} % du total
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      )}

      {/* Aucune obligation */}
      {!loading && total === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-400 mb-3" />
            <p className="font-medium">Aucune obligation fiscale en {year}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {year === new Date().getFullYear() - 1 ||
              year === new Date().getFullYear()
                ? "Première année d'activité — les premières obligations apparaissent à partir de 2027."
                : "Aucune obligation générée pour cette année."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      {!loading && total > 0 && (
        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">
              <List className="mr-1.5 h-3.5 w-3.5" />
              Chronologique
            </TabsTrigger>
            <TabsTrigger value="annual">
              <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
              Vue annuelle
            </TabsTrigger>
          </TabsList>

          {/* Vue chronologique par mois */}
          <TabsContent value="list" className="space-y-6 mt-4">
            {sortedMonths.map(([month, items]) => (
              <div key={month}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {MONTHS_FR[month]} {year}
                </h2>
                <div className="space-y-3">
                  {items.map((o) => (
                    <ObligationCard
                      key={o.id}
                      o={o}
                      onMarkPaid={handleMarkPaid}
                      loading={updatingKey === o.obligationKey}
                    />
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Vue annuelle */}
          <TabsContent value="annual" className="mt-4">
            <AnnualView obligations={obligations} year={year} />
            {/* Légende */}
            <div className="mt-4 flex flex-wrap gap-4">
              {(Object.entries(TYPE_CONFIG) as [ObligationType, typeof TYPE_CONFIG[ObligationType]][]).map(
                ([type, conf]) => (
                  <div key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={`h-2.5 w-2.5 rounded-full ${conf.dot}`} />
                    {conf.label}
                  </div>
                )
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
