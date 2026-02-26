// All dashboard pages are authenticated — disable static prerendering at build time
export const dynamic = "force-dynamic";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { OrgProvider } from "@/contexts/org-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <OrgProvider>
            <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <div className="flex flex-1 flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">{children}</main>
                </div>
            </div>
            <MobileNav />
        </OrgProvider>
    );
}