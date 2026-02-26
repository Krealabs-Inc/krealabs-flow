"use client";

import { useState, useEffect } from "react";
import { Bell, LogOut, User, Settings, ChevronDown, AlertCircle, Clock, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@stackframe/stack";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import type { AppNotification } from "@/app/api/notifications/route";

const URGENCY_ICON: Record<AppNotification["urgency"], React.ReactNode> = {
  high: <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />,
  medium: <Clock className="h-4 w-4 text-amber-500 shrink-0" />,
  low: <RefreshCw className="h-4 w-4 text-blue-500 shrink-0" />,
};

export function Header() {
  const user = useUser();
  const [editOpen, setEditOpen] = useState(false);
  const [nameEdit, setNameEdit] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState("");

  const isLoading = user === undefined || user === null;

  // Best display name: displayName > email prefix > fallback
  const displayName =
    user?.displayName ||
    user?.primaryEmail?.split("@")[0] ||
    "Utilisateur";
  const email = user?.primaryEmail || "";

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  function openEdit() {
    setNameEdit(user?.displayName || "");
    setNameError("");
    setEditOpen(true);
  }

  async function handleSaveName() {
    if (!user) return;
    if (!nameEdit.trim()) {
      setNameError("Le nom ne peut pas être vide.");
      return;
    }
    setSavingName(true);
    setNameError("");
    try {
      await user.update({ displayName: nameEdit.trim() });
      setEditOpen(false);
    } catch {
      setNameError("Erreur lors de la mise à jour. Réessayez.");
    }
    setSavingName(false);
  }

  // Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setNotifications(j.data);
      })
      .catch(() => {});
  }, []);

  // Load dismissed from localStorage
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem("dismissed-notifs") || "[]");
      setDismissed(new Set(d));
    } catch {
      // ignore
    }
  }, []);

  const activeNotifs = notifications.filter((n) => !dismissed.has(n.id));
  const urgentCount = activeNotifs.filter((n) => n.urgency === "high").length;
  const badgeCount = urgentCount > 0 ? urgentCount : activeNotifs.length;

  function dismiss(id: string) {
    const newDismissed = new Set([...dismissed, id]);
    setDismissed(newDismissed);
    try {
      localStorage.setItem("dismissed-notifs", JSON.stringify([...newDismissed]));
    } catch {
      // ignore
    }
  }

  function dismissAll() {
    const newDismissed = new Set([...dismissed, ...activeNotifs.map((n) => n.id)]);
    setDismissed(newDismissed);
    try {
      localStorage.setItem("dismissed-notifs", JSON.stringify([...newDismissed]));
    } catch {
      // ignore
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <div />

      <div className="flex items-center gap-3">
        <ThemeToggle />

        {/* Notification bell */}
        <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {badgeCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {badgeCount > 9 ? "9+" : badgeCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-h-[420px] overflow-auto">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <DropdownMenuLabel className="p-0 text-sm font-semibold">
                Notifications {activeNotifs.length > 0 && `(${activeNotifs.length})`}
              </DropdownMenuLabel>
              {activeNotifs.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground"
                  onClick={dismissAll}
                >
                  Tout ignorer
                </Button>
              )}
            </div>
            {activeNotifs.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                Aucune notification
              </div>
            ) : (
              activeNotifs.map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-start gap-2 px-3 py-2.5 hover:bg-muted/50 border-b last:border-b-0"
                >
                  <div className="mt-0.5">{URGENCY_ICON[notif.urgency]}</div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={notif.href}
                      className="block"
                      onClick={() => setNotifOpen(false)}
                    >
                      <p className="text-sm font-medium leading-tight line-clamp-1">
                        {notif.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notif.description}
                      </p>
                    </Link>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => dismiss(notif.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {isLoading ? (
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-2 h-9"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium">{displayName}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal pb-2">
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-semibold leading-none">
                    {displayName}
                  </p>
                  {email && (
                    <p className="text-xs text-muted-foreground leading-none mt-1">
                      {email}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={openEdit} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Modifier le profil
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Paramètres
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => user?.signOut?.()}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Profile edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Modifier le profil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="headerDisplayName">Nom d&apos;affichage</Label>
              <Input
                id="headerDisplayName"
                value={nameEdit}
                onChange={(e) => {
                  setNameEdit(e.target.value);
                  setNameError("");
                }}
                placeholder="Votre nom"
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                autoFocus
              />
              {nameError && (
                <p className="text-xs text-destructive">{nameError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">
                L&apos;email ne peut pas être modifié ici.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSaveName}
              disabled={savingName || !nameEdit.trim()}
            >
              {savingName ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
