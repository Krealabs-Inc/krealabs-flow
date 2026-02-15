import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import {
  getClient,
  updateClient,
  deleteClient,
} from "@/lib/services/client.service";
import { updateClientSchema } from "@/lib/validators/client.validator";
import { success, error } from "@/lib/utils/api-response";

const DEFAULT_ORG_ID = "ab33997e-aa9b-4fcd-ab56-657971f81e8a";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  const { id } = await params;
  const client = await getClient(id, DEFAULT_ORG_ID);

  if (!client) return error("Client non trouvé", 404);
  return success(client);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  const { id } = await params;
  const body = await request.json();
  const parsed = updateClientSchema.safeParse(body);

  if (!parsed.success) {
    return error(parsed.error.issues[0].message, 422);
  }

  const updated = await updateClient(
    id,
    parsed.data,
    DEFAULT_ORG_ID,
    user.id
  );

  if (!updated) return error("Client non trouvé", 404);
  return success(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return error("Non autorisé", 401);

  const { id } = await params;
  const deleted = await deleteClient(id, DEFAULT_ORG_ID, user.id);

  if (!deleted) return error("Client non trouvé", 404);
  return success({ deleted: true });
}
