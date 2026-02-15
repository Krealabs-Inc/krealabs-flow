import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import {
  getContract,
  updateContract,
  deleteContract,
  updateContractStatus,
  renewContract,
} from "@/lib/services/contract.service";
import { updateContractSchema } from "@/lib/validators/contract.validator";
import { success, error } from "@/lib/utils/api-response";

const DEFAULT_ORG_ID = "ab33997e-aa9b-4fcd-ab56-657971f81e8a";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  const { id } = await params;
  const contract = await getContract(id, DEFAULT_ORG_ID);

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

  // Handle actions
  if (body.action) {
    try {
      switch (body.action) {
        case "activate":
          return success(
            await updateContractStatus(id, "active", DEFAULT_ORG_ID, user.id)
          );
        case "terminate":
          return success(
            await updateContractStatus(
              id,
              "terminated",
              DEFAULT_ORG_ID,
              user.id
            )
          );
        case "renew":
          return success(
            await renewContract(id, DEFAULT_ORG_ID, user.id)
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
    const updated = await updateContract(
      id,
      parsed.data,
      DEFAULT_ORG_ID,
      user.id
    );
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

  try {
    const deleted = await deleteContract(id, DEFAULT_ORG_ID, user.id);
    if (!deleted) return error("Contrat non trouvé", 404);
    return success({ deleted: true });
  } catch (err) {
    return error(
      err instanceof Error ? err.message : "Erreur interne",
      400
    );
  }
}
