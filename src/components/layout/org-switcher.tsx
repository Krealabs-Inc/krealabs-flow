"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, ChevronDown, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrg } from "@/contexts/org-context";
import { Badge } from "@/components/ui/badge";

const LEGAL_FORM_SHORT: Record<string, string> = {
  micro_entreprise: "ME",
  auto_entrepreneur: "AE",
  sas: "SAS",
  sasu: "SASU",
  sarl: "SARL",
  eurl: "EURL",
  gie: "GIE",
  association: "Asso",
  autre: "",
};

export function OrgSwitcher() {
  const { orgs, currentOrg, currentOrgId, setCurrentOrgId } = useOrg();
  const [open, setOpen] = useState(false);

  if (!currentOrg) return null;

  const legalShort = currentOrg.legalForm
    ? LEGAL_FORM_SHORT[currentOrg.legalForm]
    : null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left",
          "bg-primary/5 hover:bg-primary/10 transition-colors",
          "border border-primary/10"
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/15">
          <Building2 className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">
            {currentOrg.name}
          </p>
          {legalShort && (
            <p className="text-xs text-muted-foreground">{legalShort}</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border bg-popover shadow-lg overflow-hidden">
            <div className="p-1.5">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Mes entreprises
              </p>
              {orgs.map((org) => {
                const short = org.legalForm
                  ? LEGAL_FORM_SHORT[org.legalForm]
                  : null;
                const isSelected = org.id === currentOrgId;
                return (
                  <button
                    key={org.id}
                    onClick={() => {
                      setCurrentOrgId(org.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors",
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                        isSelected ? "bg-primary/20" : "bg-muted"
                      )}
                    >
                      <Building2
                        className={cn(
                          "h-3.5 w-3.5",
                          isSelected ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-tight">
                        {org.name}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {short && (
                          <span className="text-xs text-muted-foreground">
                            {short}
                          </span>
                        )}
                        {org.isPrimary && (
                          <Badge
                            variant="secondary"
                            className="h-4 px-1 text-[10px]"
                          >
                            Principale
                          </Badge>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="border-t p-1.5">
              <Link
                href="/organizations"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Plus className="h-4 w-4" />
                Gérer mes entreprises
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
