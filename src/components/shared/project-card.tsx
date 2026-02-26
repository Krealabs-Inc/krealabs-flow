"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { projectStatusLabels, projectStatusColors, type Project } from "@/types/project";

interface ProjectCardProps {
  project: Project;
}

const fmt = (val: number | string | null | undefined) =>
  parseFloat(String(val ?? 0)).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();

  return (
    <div
      className="rounded-lg border bg-card p-4 cursor-pointer hover:border-primary/50 transition-colors active:bg-muted/30"
      onClick={() => router.push(`/projects/${project.id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{project.name}</p>
          {project.clientName && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{project.clientName}</p>
          )}
        </div>
        <Badge className={`${projectStatusColors[project.status]} text-xs shrink-0`}>
          {projectStatusLabels[project.status]}
        </Badge>
      </div>

      <div className="flex items-center justify-between mt-3">
        {project.endDate ? (
          <div className="text-xs text-muted-foreground">
            Fin : {new Date(project.endDate).toLocaleDateString("fr-FR")}
          </div>
        ) : (
          <div />
        )}
        {project.estimatedBudget && (
          <div className="text-sm font-semibold">{fmt(project.estimatedBudget)}</div>
        )}
      </div>
    </div>
  );
}
