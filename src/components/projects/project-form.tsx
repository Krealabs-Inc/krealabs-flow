"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { projectStatusLabels, type Project, type ProjectStatus } from "@/types/project";
import type { Client, ApiResponse } from "@/types";

interface ProjectFormProps {
  project?: Project;
}

interface MilestoneForm {
  name: string;
  description: string;
  dueDate: string;
}

export function ProjectForm({ project }: ProjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState(project?.clientId || "");
  const [status, setStatus] = useState(project?.status || "prospect");
  const [milestones, setMilestones] = useState<MilestoneForm[]>(
    project?.milestones?.map((m) => ({
      name: m.name,
      description: m.description || "",
      dueDate: m.dueDate || "",
    })) || []
  );

  useEffect(() => {
    fetch("/api/clients?limit=100")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setClients(d.data);
      });
  }, []);

  function addMilestone() {
    setMilestones([...milestones, { name: "", description: "", dueDate: "" }]);
  }

  function removeMilestone(index: number) {
    setMilestones(milestones.filter((_, i) => i !== index));
  }

  function updateMilestone(
    index: number,
    field: keyof MilestoneForm,
    value: string
  ) {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      clientId,
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      status,
      startDate: (formData.get("startDate") as string) || undefined,
      endDate: (formData.get("endDate") as string) || undefined,
      estimatedBudget: parseFloat(
        (formData.get("estimatedBudget") as string) || "0"
      ) || undefined,
      notes: (formData.get("notes") as string) || undefined,
      milestones: milestones
        .filter((m) => m.name.trim())
        .map((m, i) => ({
          name: m.name,
          description: m.description || undefined,
          dueDate: m.dueDate || undefined,
          sortOrder: i,
        })),
    };

    const url = project ? `/api/projects/${project.id}` : "/api/projects";
    const method = project ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data: ApiResponse<Project> = await res.json();

    if (data.success) {
      router.push(`/projects/${data.data.id}`);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations du projet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={clientId} onValueChange={setClientId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nom du projet *</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={project?.name}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={project?.description ?? ""}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                <SelectTrigger>
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
            <div className="space-y-2">
              <Label htmlFor="startDate">Date de début</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={project?.startDate ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={project?.endDate ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedBudget">Budget estimé</Label>
              <Input
                id="estimatedBudget"
                name="estimatedBudget"
                type="number"
                step="0.01"
                min="0"
                defaultValue={project?.estimatedBudget ?? ""}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Jalons</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un jalon
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {milestones.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun jalon défini
            </p>
          ) : (
            <div className="space-y-3">
              {milestones.map((m, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <div className="flex-1 grid gap-3 md:grid-cols-3">
                    <Input
                      placeholder="Nom du jalon"
                      value={m.name}
                      onChange={(e) =>
                        updateMilestone(i, "name", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Description"
                      value={m.description}
                      onChange={(e) =>
                        updateMilestone(i, "description", e.target.value)
                      }
                    />
                    <Input
                      type="date"
                      value={m.dueDate}
                      onChange={(e) =>
                        updateMilestone(i, "dueDate", e.target.value)
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMilestone(i)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            name="notes"
            rows={3}
            defaultValue={project?.notes ?? ""}
          />
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading
            ? "Enregistrement..."
            : project
              ? "Mettre à jour"
              : "Créer le projet"}
        </Button>
      </div>
    </form>
  );
}
