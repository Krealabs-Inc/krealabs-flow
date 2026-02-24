"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileBarChart2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type TvaDeclarationStatus = "pending" | "declared" | "paid";

interface TvaDeclaration {
  id: string;
  organizationId: string;
  year: number;
  quarter: number;
  periodStart: string;
  periodEnd: string;
  caHt: string | null;
  tvaCollected: string | null;
  tvaDeductible: string | null;
  tvaToPay: string | null;
  declaredAt: string | null;
  paymentDueDate: string | null;
  status: TvaDeclarationStatus | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

const fmt = (n: string | null): string =>
  parseFloat(n ?? "0").toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";

const fmtDate = (d: string | null): string =>
  d ? new Date(d).toLocaleDateString("fr-FR") : "—";

const quarterLabel = (q: number): string => {
  const labels: Record<number, string> = {
    1: "Jan. → Mars",
    2: "Avr. → Juin",
    3: "Juil. → Sep.",
    4: "Oct. → Déc.",
  };
  return labels[q] ?? "";
};

function StatusBadge({ status }: { status: TvaDeclarationStatus | null }) {
  switch (status) {
    case "paid":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="mr-1 h-3 w-3" />
          Payée
        </Badge>
      );
    case "declared":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          <FileBarChart2 className="mr-1 h-3 w-3" />
          Déclarée
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          <AlertCircle className="mr-1 h-3 w-3" />
          En attente
        </Badge>
      );
  }
}

interface QuarterCardProps {
  declaration: TvaDeclaration;
  onAction: (
    id: string,
    action: "mark_declared" | "mark_paid" | "refresh"
  ) => Promise<void>;
  loadingId: string | null;
}

function QuarterCard({ declaration, onAction, loadingId }: QuarterCardProps) {
  const isLoading = loadingId === declaration.id;
  const isOverdue =
    declaration.paymentDueDate !== null &&
    new Date(declaration.paymentDueDate) < new Date() &&
    declaration.status !== "paid";

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold leading-tight">
            T{declaration.quarter} · {quarterLabel(declaration.quarter)}{" "}
            {declaration.year}
          </CardTitle>
          <StatusBadge status={declaration.status} />
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">CA HT</span>
            <span className="font-medium tabular-nums">
              {fmt(declaration.caHt)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">TVA collectée</span>
            <span className="font-medium tabular-nums">
              {fmt(declaration.tvaCollected)}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="font-medium">TVA à reverser</span>
            <span className="font-bold tabular-nums text-primary">
              {fmt(declaration.tvaToPay)}
            </span>
          </div>
        </div>

        {declaration.paymentDueDate && (
          <div
            className={`rounded-md px-3 py-2 text-xs ${
              isOverdue
                ? "bg-orange-50 text-orange-700"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <span className="font-medium">Échéance :</span>{" "}
            {fmtDate(declaration.paymentDueDate)}
            {isOverdue && (
              <span className="ml-1 font-semibold">(dépassée)</span>
            )}
          </div>
        )}

        {declaration.declaredAt && (
          <p className="text-xs text-muted-foreground">
            Déclarée le {fmtDate(declaration.declaredAt)}
          </p>
        )}

        <div className="mt-auto flex flex-col gap-2">
          {declaration.status === "pending" && (
            <Button
              size="sm"
              className="w-full"
              disabled={isLoading}
              onClick={() => onAction(declaration.id, "mark_declared")}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Marquer comme déclarée
            </Button>
          )}

          {declaration.status === "declared" && (
            <Button
              size="sm"
              variant="default"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading}
              onClick={() => onAction(declaration.id, "mark_paid")}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Marquer comme payée
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            className="w-full"
            disabled={isLoading}
            onClick={() => onAction(declaration.id, "refresh")}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Recalculer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DeclarationsPage() {
  const [declarations, setDeclarations] = useState<TvaDeclaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const fetchDeclarations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/declarations");
      const text = await res.text();
      if (!text) {
        setLoading(false);
        return;
      }
      const data: { success: boolean; data: TvaDeclaration[] } =
        JSON.parse(text);
      if (data.success) {
        setDeclarations(data.data);
      }
    } catch {
      // DB not ready
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDeclarations();
  }, [fetchDeclarations]);

  async function handleAction(
    id: string,
    action: "mark_declared" | "mark_paid" | "refresh"
  ) {
    setLoadingId(id);
    try {
      await fetch(`/api/declarations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await fetchDeclarations();
    } finally {
      setLoadingId(null);
    }
  }

  // Grouper les déclarations par année
  const byYear = declarations.reduce<Record<number, TvaDeclaration[]>>(
    (acc, d) => {
      if (!acc[d.year]) acc[d.year] = [];
      acc[d.year].push(d);
      return acc;
    },
    {}
  );

  // Afficher par année décroissante
  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">
            Déclarations TVA
          </h1>
          <Badge variant="outline" className="text-xs">
            Trimestrielle
          </Badge>
        </div>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Calcul basé sur les factures payées dans chaque trimestre
        </p>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      ) : declarations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileBarChart2 className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-lg font-medium">Aucune déclaration disponible</p>
          <p className="text-sm text-muted-foreground">
            Les déclarations seront générées automatiquement.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {years.map((year) => (
            <section key={year}>
              <h2 className="mb-4 text-xl font-semibold tracking-tight">
                {year}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {byYear[year]
                  .sort((a, b) => a.quarter - b.quarter)
                  .map((declaration) => (
                    <QuarterCard
                      key={declaration.id}
                      declaration={declaration}
                      onAction={handleAction}
                      loadingId={loadingId}
                    />
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
