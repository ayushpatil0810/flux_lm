"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Settings, UploadCloud, LogOut, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-[100dvh] w-full bg-background text-foreground overflow-hidden selection:bg-primary/30 selection:text-primary">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border/60 bg-secondary/30 flex flex-col hidden md:flex shrink-0">
        {/* Sidebar Header */}
        <div className="h-14 flex items-center px-5 border-b border-border/60">
          <Link href="/" className="flex items-center gap-2.5 text-foreground hover:opacity-80 transition-opacity">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
              <UploadCloud className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold tracking-tight text-lg">Flux</span>
          </Link>
        </div>

        {/* Navigation */}
        <div className="p-3 flex flex-col gap-1 mt-2">
          <Link href="/dashboard">
            <Button
              variant={pathname === "/dashboard" ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 h-10 px-3 text-sm font-medium rounded-lg ${pathname !== "/dashboard" && "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}
            >
              <Home className="h-4 w-4 shrink-0" />
              Home
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-10 px-3 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="h-4 w-4 shrink-0" />
            Settings
          </Button>
        </div>

        {/* User Profile Footer Dropdown */}
        <div className="mt-auto border-t border-border/60 p-3">
          {isPending ? (
            <div className="flex items-center gap-3 p-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Loading session...</span>
            </div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/40 cursor-pointer transition-colors overflow-hidden">
                  <Avatar className="h-9 w-9 border border-border shadow-sm shrink-0">
                    <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {getInitials(user.name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden text-left">
                    <span className="text-sm font-medium leading-none truncate">{user.name || "User"}</span>
                    <span className="text-xs text-muted-foreground mt-1 truncate">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mb-2">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} variant="destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button className="w-full h-10 rounded-lg text-white bg-primary hover:bg-primary/90">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full bg-background relative min-w-0">{children}</div>

      {/* Account Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-border/60">
          <DialogHeader>
            <DialogTitle>Account Settings</DialogTitle>
            <DialogDescription>Your profile and authentication details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-1">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Name</span>
              <span className="text-sm font-semibold">{user?.name || "N/A"}</span>
            </div>
            <div className="grid gap-1">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Email</span>
              <span className="text-sm font-semibold">{user?.email || "N/A"}</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="rounded-full shadow-none bg-primary text-white hover:bg-primary/90"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

