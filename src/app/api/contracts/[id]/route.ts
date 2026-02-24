import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { getPrimaryOrgId } from "@/lib/auth/get-user-orgs";
import {
  getContract,
  updateContract,
  deleteContract,
  updateContractStatus,
  renewContract,
  generateContractInvoice,
} from "@/lib/services/contract.service";
import { updateContractSchema } from "@/lib/validators/contract.validator";
import { success, error } from "@/lib/utils/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  const { id } = await params;
  const orgId = await getPrimaryOrgId(user.id);
  const contract = await getContract(id, orgId);

  if (!contract) return error("Contrat non trouvé", 404);
  return success(contract);
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
        case "activate":
          return success(
            await updateContractStatus(id, "active", orgId, user.id)
          );
        case "terminate":
          return success(
            await updateContractStatus(id, "terminated", orgId, user.id)
          );
        case "renew":
          return success(
            await renewContract(id, orgId, user.id)
          );
        case "generate_invoice":
          return success(
            await generateContractInvoice(id, orgId, user.id),
            201
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
  const parsed = updateContractSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0].message, 422);
  }

  try {
    const updated = await updateContract(id, parsed.data, orgId, user.id);
    if (!updated) return error("Contrat non trouvé", 404);
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
    const deleted = await deleteContract(id, orgId, user.id);
    if (!deleted) return error("Contrat non trouvé", 404);
    return success({ deleted: true });
  } catch (err) {
    return error(
      err instanceof Error ? err.message : "Erreur interne",
      400
    );
  }
}
