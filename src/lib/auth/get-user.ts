import "server-only";
import { isAuthConfigured, stackServerApp } from "./index";

/**
 * Get the current authenticated user.
 * Returns a mock user when Stack Auth is not configured (dev mode).
 */
export async function getAuthUser() {
  if (!isAuthConfigured) {
    // Dev mode: return mock user
    return {
      id: "dev-user-001",
      displayName: "Dev User",
      primaryEmail: "dev@krealabs.fr",
    };
  }

  return stackServerApp.getUser();
}
