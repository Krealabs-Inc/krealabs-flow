// All dashboard pages are authenticated — disable static prerendering at build time
export const dynamic = "force-dynamic";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { OrgProvider } from "@/contexts/org-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <OrgProvider>
            <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <div className="flex flex-1 flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-6">{children}</main>
                </div>
            </div>
        </OrgProvider>
    );
}