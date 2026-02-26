"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import {
  projectStatusLabels,
  type Project,
  type ProjectStatus,
} from "@/types/project";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { ApiResponse } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fmt = (val: number) =>
  val.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  async function load() {
    const res = await fetch(`/api/projects/${params.id}`);
    const data: ApiResponse<Project> = await res.json();
    if (data.success) setProject(data.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleStatusChange(newStatus: string) {
    const res = await fetch(`/api/projects/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_status", status: newStatus }),
    });
    const data = await res.json();
    if (data.success) setProject(data.data);
  }

  async function handleCompleteMilestone(milestoneId: string) {
    const res = await fetch(`/api/projects/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete_milestone", milestoneId }),
    });
    const data = await res.json();
    if (data.success) setProject(data.data);
  }

  function handleDelete() {
    setConfirmState({
      open: true,
      title: "Supprimer ce projet",
      description: "Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.",
      confirmText: "Supprimer",
      variant: "destructive",
      onConfirm: async () => {
        await fetch(`/api/projects/${params.id}`, { method: "DELETE" });
        router.push("/projects");
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

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Projet non trouvé</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 mt-0.5"
            onClick={() => router.push("/projects")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">
                {project.name}
              </h1>
              <ProjectStatusBadge status={project.status} />
            </div>
            <p className="text-muted-foreground truncate">{project.clientName}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/projects/${project.id}/edit`)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="icon" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="ml-11">
          <Select
            value={project.status}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(projectStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Devis
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-bold">
            {project.quotesCount ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Factures
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-bold">
            {project.invoicesCount ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total facturé
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-bold">
            {fmt(project.totalInvoiced ?? 0)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total encaissé
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-bold text-green-600">
            {fmt(project.totalPaid ?? 0)}
          </CardContent>
        </Card>
      </div>

      {/* Budget */}
      {project.estimatedBudget && (
        <Card>
          <CardHeader>
            <CardTitle>Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Budget estimé</span>
              <span className="font-medium">
                {fmt(parseFloat(project.estimatedBudget))}
              </span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Facturé</span>
              <span className="font-medium">
                {fmt(project.totalInvoiced ?? 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Restant</span>
              <span className="font-medium">
                {fmt(
                  parseFloat(project.estimatedBudget) -
                    (project.totalInvoiced ?? 0)
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestones */}
      {project.milestones && project.milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Jalons ({project.milestones.filter((m) => m.completedAt).length}/
              {project.milestones.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {project.milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {milestone.completedAt ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <button
                        onClick={() => handleCompleteMilestone(milestone.id)}
                        className="hover:text-green-600 transition-colors"
                      >
                        <Circle className="h-5 w-5" />
                      </button>
                    )}
                    <div>
                      <p
                        className={
                          milestone.completedAt
                            ? "line-through text-muted-foreground"
                            : "font-medium"
                        }
                      >
                        {milestone.name}
                      </p>
                      {milestone.description && (
                        <p className="text-xs text-muted-foreground">
                          {milestone.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {milestone.dueDate &&
                      new Date(milestone.dueDate).toLocaleDateString("fr-FR")}
                    {milestone.completedAt && (
                      <span className="ml-2 text-green-600">
                        Terminé le{" "}
                        {new Date(milestone.completedAt).toLocaleDateString(
                          "fr-FR"
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Description / Notes */}
      {(project.description || project.notes) && (
        <div className="grid gap-4 md:grid-cols-2">
          {project.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">
                  {project.description}
                </p>
              </CardContent>
            </Card>
          )}
          {project.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{project.notes}</p>
              </CardContent>
            </Card>
          )}
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
