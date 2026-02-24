"use client";

import { useState } from "react";
import { Bell, LogOut, User, Settings, ChevronDown } from "lucide-react";
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

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div />

      <div className="flex items-center gap-3">
        <ThemeToggle />

        {/* Notification bell — will be wired in feat/notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
        </Button>

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
                <span className="text-sm font-medium">{displayName}</span>
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
