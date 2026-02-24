"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-bold">Une erreur est survenue</h2>
        <p className="mt-2 text-muted-foreground">
          Quelque chose s&apos;est mal passé. Veuillez réessayer.
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre className="mt-4 max-w-lg overflow-auto rounded-md bg-muted p-3 text-left text-xs">
            {error.message}
          </pre>
        )}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          Tableau de bord
        </Button>
        <Button onClick={reset}>Réessayer</Button>
      </div>
    </div>
  );
}
