"use client";

import { Badge } from "@/components/ui/badge";
import {
  projectStatusLabels,
  projectStatusColors,
  type ProjectStatus,
} from "@/types/project";

export function ProjectStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="secondary"
      className={projectStatusColors[status as ProjectStatus] ?? ""}
    >
      {projectStatusLabels[status as ProjectStatus] ?? status}
    </Badge>
  );
}
