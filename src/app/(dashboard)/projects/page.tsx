"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectTable } from "@/components/projects/project-table";
import { ProjectCard } from "@/components/shared/project-card";
import { projectStatusLabels } from "@/types/project";
import type { Project } from "@/types/project";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { PaginatedResponse } from "@/types";
import { useOrg } from "@/contexts/org-context";

export default function ProjectsPage() {
  const { currentOrgId } = useOrg();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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

  const fetchProjects = useCallback(
    async (page = 1) => {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);

      try {
        params.set("orgId", currentOrgId);
      const res = await fetch(`/api/projects?${params}`);
        const text = await res.text();
        if (!text) { setLoading(false); return; }
        const data: PaginatedResponse<Project> = JSON.parse(text);
        if (data.success) {
          setProjects(data.data);
          setPagination(data.pagination);
        }
      } catch {
        // DB not ready
      }
      setLoading(false);
    },
    [search, statusFilter, currentOrgId]
  );

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  function handleDelete(id: string) {
    setConfirmState({
      open: true,
      title: "Supprimer ce projet",
      description: "Cette action est irréversible. Voulez-vous vraiment supprimer ce projet ?",
      confirmText: "Supprimer",
      variant: "destructive",
      onConfirm: async () => {
        await fetch(`/api/projects/${id}`, { method: "DELETE" });
        fetchProjects(pagination.page);
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projets</h1>
          <p className="text-muted-foreground">
            {pagination.total} projet(s)
          </p>
        </div>
        <Button onClick={() => router.push("/projects/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau projet
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un projet..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-52">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(projectStatusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <ProjectTable projects={projects} onDelete={handleDelete} />
          </div>
          <div className="md:hidden space-y-3">
            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                <p className="text-muted-foreground">Aucun projet pour le moment</p>
              </div>
            ) : (
              projects.map((p) => <ProjectCard key={p.id} project={p} />)
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
            onClick={() => fetchProjects(pagination.page - 1)}
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
            onClick={() => fetchProjects(pagination.page + 1)}
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
