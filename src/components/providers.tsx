"use client";

import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "@/stack/client";
import { ThemeProvider } from "@/components/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider defaultTheme="system" storageKey="krealabs-flow-theme">
            <StackProvider app={stackClientApp}>
                <StackTheme>{children}</StackTheme>
            </StackProvider>
        </ThemeProvider>
    );
}
