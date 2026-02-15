"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "@/stack/client";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="fr">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <StackProvider app={stackClientApp}>
            <StackTheme>{children}</StackTheme>
        </StackProvider>
        </body>
        </html>
    );
}