import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { getPrimaryOrgId } from "@/lib/auth/get-user-orgs";
import {
  getProject,
  updateProject,
  deleteProject,
  updateProjectStatus,
  completeMilestone,
} from "@/lib/services/project.service";
import { updateProjectSchema } from "@/lib/validators/project.validator";
import { success, error } from "@/lib/utils/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  const { id } = await params;
  const orgId = await getPrimaryOrgId(user.id);
  const project = await getProject(id, orgId);

  if (!project) return error("Projet non trouvé", 404);
  return success(project);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  const { id } = await params;
  const body = await request.json();
  const orgId = await getPrimaryOrgId(user.id);

  // Handle actions
  if (body.action) {
    try {
      switch (body.action) {
        case "update_status":
          return success(
            await updateProjectStatus(id, body.status, orgId, user.id)
          );
        case "complete_milestone":
          return success(
            await completeMilestone(id, body.milestoneId, orgId, user.id)
          );
        default:
          return error("Action inconnue", 400);
      }
    } catch (err) {
      return error(
        err instanceof Error ? err.message : "Erreur interne",
        400
      );
    }
  }

  // Standard update
  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0].message, 422);
  }

  try {
    const updated = await updateProject(id, parsed.data, orgId, user.id);
    if (!updated) return error("Projet non trouvé", 404);
    return success(updated);
  } catch (err) {
    return error(
      err instanceof Error ? err.message : "Erreur interne",
      400
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  const { id } = await params;
  const orgId = await getPrimaryOrgId(user.id);

  try {
    const deleted = await deleteProject(id, orgId, user.id);
    if (!deleted) return error("Projet non trouvé", 404);
    return success({ deleted: true });
  } catch (err) {
    return error(
      err instanceof Error ? err.message : "Erreur interne",
      400
    );
  }
}
