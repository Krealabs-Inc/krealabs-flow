"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  CreditCard,
  FolderKanban,
  ScrollText,
  Wallet,
  Settings,
  CalendarDays,
  FileBarChart2,
  CalendarClock,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OrgSwitcher } from "./org-switcher";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navigation: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Devis", href: "/quotes", icon: FileText },
  { label: "Factures", href: "/invoices", icon: Receipt },
  { label: "Paiements", href: "/payments", icon: CreditCard },
  { label: "Projets", href: "/projects", icon: FolderKanban },
  { label: "Contrats", href: "/contracts", icon: ScrollText },
  { label: "Trésorerie", href: "/treasury", icon: Wallet },
  { label: "Calendrier", href: "/calendar", icon: CalendarDays },
  { label: "Obligations fiscales", href: "/fiscal", icon: CalendarClock },
  { label: "Déclarations TVA", href: "/declarations", icon: FileBarChart2 },
];

const bottomNavigation: NavItem[] = [
  { label: "Mes entreprises", href: "/organizations", icon: Building2 },
  { label: "Paramètres", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
      <aside className="hidden md:flex h-screen w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
          <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center px-2 py-1">
                  <Image
                      src="/logo.png"
                      alt="KreaLabs"
                      width={139}
                      height={87}
                      className="h-6 w-auto"
                      priority
                  />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Flow</span>
          </Link>
      </div>

        <div className="px-3 py-3 border-b">
          <OrgSwitcher />
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
            return (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
            );
          })}
        </nav>

        <div className="border-t px-3 py-4">
          {bottomNavigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
            );
          })}
        </div>
      </aside>
  );
}
