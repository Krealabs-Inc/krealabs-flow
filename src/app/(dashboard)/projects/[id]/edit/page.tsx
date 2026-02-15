"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProjectForm } from "@/components/projects/project-form";
import type { Project } from "@/types/project";
import type { ApiResponse } from "@/types";

export default function EditProjectPage() {
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/projects/${params.id}`);
      const data: ApiResponse<Project> = await res.json();
      if (data.success) setProject(data.data);
      setLoading(false);
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
      </div>
    );
  }

  if (!project) {
    return <p className="text-center text-muted-foreground">Projet non trouvé</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        Modifier — {project.name}
      </h1>
      <ProjectForm project={project} />
    </div>
  );
}
