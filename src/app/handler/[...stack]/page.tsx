import { stackServerApp, isAuthConfigured } from "@/lib/auth";

export default function Handler(props: { params: Promise<unknown>; searchParams: Promise<unknown> }) {
  if (!isAuthConfigured) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">
          Stack Auth non configuré. Renseignez les variables d&apos;environnement.
        </p>
      </div>
    );
  }

  // Dynamic import to avoid build crash
  const { StackHandler } = require("@stackframe/stack");
  return <StackHandler app={stackServerApp} routeProps={props} fullPage />;
}
