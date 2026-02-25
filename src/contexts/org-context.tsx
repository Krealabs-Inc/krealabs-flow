"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

const STORAGE_KEY = "kf_current_org";

interface OrgOption {
  id: string;
  name: string;
  legalForm?: string;
  tvaRegime?: string;
  defaultDailyRate?: string | null;
  siren?: string;
  city?: string;
  isPrimary: boolean;
  invoiceCount: number;
  clientCount: number;
}

interface OrgContextValue {
  orgs: OrgOption[];
  currentOrgId: string;
  currentOrg: OrgOption | null;
  setCurrentOrgId: (id: string) => void;
  loading: boolean;
  refresh: () => void;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [currentOrgId, setCurrentOrgIdState] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const loadOrgs = useCallback(async () => {
    try {
      const res = await fetch("/api/user/organizations");
      const json = await res.json();
      if (!json.success) return;

      const data: OrgOption[] = json.data;
      setOrgs(data);

      if (data.length === 0) return;

      // Pick stored org, fallback to primary, fallback to first
      const stored = localStorage.getItem(STORAGE_KEY);
      const valid = stored && data.some((o) => o.id === stored);
      if (valid) {
        setCurrentOrgIdState(stored!);
      } else {
        const primary = data.find((o) => o.isPrimary) ?? data[0];
        setCurrentOrgIdState(primary.id);
        localStorage.setItem(STORAGE_KEY, primary.id);
      }
    } catch {
      // DB not ready
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrgs();
  }, [loadOrgs]);

  function setCurrentOrgId(id: string) {
    setCurrentOrgIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }

  const currentOrg = orgs.find((o) => o.id === currentOrgId) ?? null;

  return (
    <OrgContext.Provider
      value={{ orgs, currentOrgId, currentOrg, setCurrentOrgId, loading, refresh: loadOrgs }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg(): OrgContextValue {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used inside OrgProvider");
  return ctx;
}
