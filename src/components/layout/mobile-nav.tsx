"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  MoreHorizontal,
  Briefcase,
  ScrollText,
  CreditCard,
  TrendingUp,
  CalendarDays,
  Calculator,
  ClipboardList,
  Building2,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

const PRIMARY_TABS: NavItem[] = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/clients", icon: Users, label: "Clients" },
  { href: "/invoices", icon: Receipt, label: "Factures" },
  { href: "/quotes", icon: FileText, label: "Devis" },
];

const SECONDARY_LINKS: NavItem[] = [
  { href: "/projects", icon: Briefcase, label: "Projets" },
  { href: "/contracts", icon: ScrollText, label: "Contrats" },
  { href: "/payments", icon: CreditCard, label: "Paiements" },
  { href: "/treasury", icon: TrendingUp, label: "Trésorerie" },
  { href: "/calendar", icon: CalendarDays, label: "Calendrier" },
  { href: "/fiscal", icon: Calculator, label: "Fiscal" },
  { href: "/declarations", icon: ClipboardList, label: "Déclarations" },
  { href: "/organizations", icon: Building2, label: "Entreprises" },
  { href: "/settings", icon: Settings, label: "Paramètres" },
];

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const isSecondaryActive = SECONDARY_LINKS.some((l) => isActive(l.href));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background">
      <div className="flex h-16 items-stretch">
        {PRIMARY_TABS.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                isSecondaryActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span>Plus</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[70vh]">
            <SheetHeader className="pb-4">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-3 pb-6">
              {SECONDARY_LINKS.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl p-3 text-xs font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <link.icon className="h-6 w-6" />
                    <span className="text-center leading-tight">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
