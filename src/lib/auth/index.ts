import "server-only";
import { StackServerApp } from "@stackframe/stack";

const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;

export const isAuthConfigured = !!projectId;

// Server-side URL: use STACK_API_URL (internal Docker hostname) when set,
// otherwise fall back to NEXT_PUBLIC_STACK_API_URL (works for local dev).
const stackApiUrl = process.env.NEXT_PUBLIC_STACK_API_URL || "http://localhost:8102";
const stackApiUrlServer = process.env.STACK_API_URL || stackApiUrl;

export const stackServerApp: StackServerApp = isAuthConfigured
    ? new StackServerApp({
        projectId,
        tokenStore: "nextjs-cookie",
        baseUrl: {
            browser: stackApiUrl,
            server: stackApiUrlServer,
        },
        urls: {
            home: "/",
            signIn: "/handler/sign-in",
            signUp: "/handler/sign-up",
            afterSignIn: "/",
            afterSignUp: "/",
            signOut: "/handler/sign-out",
            afterSignOut: "/handler/sign-in",
        },
    })
    : (null as unknown as StackServerApp);