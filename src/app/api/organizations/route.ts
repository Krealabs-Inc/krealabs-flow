import {
  getOrCreateDefaultOrg,
  updateOrganization,
} from "@/lib/services/organization.service";
import { success, error } from "@/lib/utils/api-response";

const DEFAULT_ORG_ID = "ab33997e-aa9b-4fcd-ab56-657971f81e8a";

export async function GET() {
  try {
    const org = await getOrCreateDefaultOrg(DEFAULT_ORG_ID);
    return success(org);
  } catch {
    return success({
      id: DEFAULT_ORG_ID,
      name: "Mon entreprise",
    });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    await getOrCreateDefaultOrg(DEFAULT_ORG_ID);
    const updated = await updateOrganization(DEFAULT_ORG_ID, body);
    return success(updated);
  } catch (e) {
    return error(e instanceof Error ? e.message : "Erreur de mise à jour", 500);
  }
}
