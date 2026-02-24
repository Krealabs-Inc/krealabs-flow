"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Building2, Settings, Users, Receipt, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useOrg } from "@/contexts/org-context";

interface OrgWithStats {
  id: string;
  name: string;
  legalForm?: string;
  tvaRegime?: string;
  siren?: string;
  city?: string;
  email?: string;
  role: string;
  isPrimary: boolean;
  invoiceCount: number;
  clientCount: number;
}

const LEGAL_FORM_LABELS: Record<string, string> = {
  micro_entreprise: "Micro-entreprise",
  auto_entrepreneur: "Auto-entrepreneur",
  sas: "SAS",
  sasu: "SASU",
  sarl: "SARL",
  eurl: "EURL",
  gie: "GIE",
  association: "Association",
  autre: "Autre",
};

const TVA_REGIME_LABELS: Record<string, string> = {
  franchise_base: "Franchise en base",
  reel_simplifie: "Réel simplifié",
  reel_normal: "Réel normal",
};

export default function OrganizationsPage() {
  const router = useRouter();
  const { refresh: refreshContext } = useOrg();
  const [orgs, setOrgs] = useState<OrgWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: "default" | "destructive";
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    variant: "default",
    onConfirm: () => {},
  });

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/user/organizations");
      const json = await res.json();
      if (json.success) setOrgs(json.data);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSetPrimary(orgId: string) {
    setSettingPrimary(orgId);
    const res = await fetch(`/api/user/organizations/${orgId}/primary`, {
      method: "PUT",
    });
    const json = await res.json();
    if (json.success) {
      setOrgs((prev) =>
        prev.map((o) => ({ ...o, isPrimary: o.id === orgId }))
      );
      refreshContext();
    }
    setSettingPrimary(null);
  }

  async function handleRemove(orgId: string, orgName: string) {
    setConfirmState({
      open: true,
      title: `Quitter "${orgName}"`,
      description:
        "Vous n'aurez plus accès à cette entreprise. Cette action est irréversible.",
      variant: "destructive",
      onConfirm: async () => {
        const res = await fetch(`/api/user/organizations/${orgId}`, {
          method: "DELETE",
        });
        const json = await res.json();
        if (json.success) {
          setOrgs((prev) => prev.filter((o) => o.id !== orgId));
        }
      },
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mes entreprises</h1>
          <p className="text-muted-foreground">
            Gérez vos différentes structures juridiques. Les clients sont partagés entre toutes.
          </p>
        </div>
        <Button asChild>
          <Link href="/organizations/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle entreprise
          </Link>
        </Button>
      </div>

      {orgs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Aucune entreprise</p>
            <p className="text-sm text-muted-foreground mt-1">
              Créez votre première structure pour commencer.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/organizations/new">
                <Plus className="mr-2 h-4 w-4" />
                Créer une entreprise
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orgs.map((org) => (
            <Card key={org.id} className="relative">
              {org.isPrimary && (
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Star className="h-3 w-3 fill-current" />
                    Principale
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base truncate pr-16">
                      {org.name}
                    </CardTitle>
                    <CardDescription className="mt-0.5">
                      {org.siren && <span className="mr-2">SIREN {org.siren}</span>}
                      {org.city && <span>{org.city}</span>}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {org.legalForm && org.legalForm !== "autre" && (
                    <Badge variant="outline" className="text-xs">
                      {LEGAL_FORM_LABELS[org.legalForm] ?? org.legalForm}
                    </Badge>
                  )}
                  {org.tvaRegime && (
                    <Badge variant="outline" className="text-xs">
                      {TVA_REGIME_LABELS[org.tvaRegime] ?? org.tvaRegime}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Receipt className="h-3.5 w-3.5" />
                    {org.invoiceCount} facture{org.invoiceCount !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {org.clientCount} client{org.clientCount !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex gap-2 pt-1 flex-wrap">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/settings?orgId=${org.id}`}>
                      <Settings className="mr-1.5 h-3.5 w-3.5" />
                      Paramètres
                    </Link>
                  </Button>
                  {!org.isPrimary && orgs.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary"
                      disabled={settingPrimary === org.id}
                      onClick={() => handleSetPrimary(org.id)}
                    >
                      <Star className="mr-1.5 h-3.5 w-3.5" />
                      {settingPrimary === org.id ? "..." : "Principale"}
                    </Button>
                  )}
                  {orgs.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRemove(org.id, org.name)}
                    >
                      Quitter
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        {...confirmState}
        onClose={() => setConfirmState((s) => ({ ...s, open: false }))}
      />
    </div>
  );
}
