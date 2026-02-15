"use client";

import { StackProvider, StackTheme, StackHandler } from "@stackframe/stack";
import { stackClientApp } from "@/stack/client"; // client-only version

export default function ClientStack({ routeProps }: any) {
    return (
        <StackProvider app={stackClientApp}>
            <StackTheme>
                <StackHandler routeProps={routeProps} fullPage />
            </StackTheme>
        </StackProvider>
    );
}