import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KreaLabs Flow",
  description: "Plateforme de gestion interne",
};

async function AuthProviders({ children }: { children: React.ReactNode }) {
  // Dynamic import to avoid build-time crash when Stack Auth is not configured
  const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;

  if (!projectId) {
    return <>{children}</>;
  }

  const { StackProvider, StackTheme } = await import("@stackframe/stack");
  const { stackServerApp } = await import("@/lib/auth");

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <StackProvider app={stackServerApp as any} lang="fr-FR">
      <StackTheme>{children}</StackTheme>
    </StackProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProviders>{children}</AuthProviders>
      </body>
    </html>
  );
}
