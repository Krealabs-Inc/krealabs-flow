import "server-only";
import { StackServerApp } from "@stackframe/stack";

const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;

export const isAuthConfigured = !!projectId;

export const stackServerApp: StackServerApp = isAuthConfigured
  ? new StackServerApp({
      tokenStore: "nextjs-cookie",
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
