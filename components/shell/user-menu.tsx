"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { cn, getInitials } from "@/lib/utils";
import { useToast } from "@/components/providers/toast-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  /**
   * "full" shows the avatar alongside name and email (rail footer).
   * "avatar" shows only the avatar (mobile header).
   */
  variant?: "full" | "avatar";
}

/** Account control: session identity with a sign-out action. */
export function UserMenu({ variant = "full" }: UserMenuProps) {
  const router = useRouter();
  const { push } = useToast();
  const { data: session, isPending } = authClient.useSession();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      setIsSigningOut(false);
      push({
        variant: "destructive",
        title: "Could not sign out",
        description: "Check your connection and try again.",
      });
    }
  }

  if (isPending) {
    return (
      <div
        aria-hidden
        className={cn(
          "animate-pulse rounded-full bg-muted",
          variant === "full" ? "h-9 w-9" : "h-8 w-8",
        )}
      />
    );
  }

  const user = session?.user;
  if (!user) {
    return null;
  }

  const avatar = (
    <Avatar className={variant === "full" ? "h-9 w-9" : "h-8 w-8"}>
      <AvatarImage
        src={user.image ?? undefined}
        alt={user.name ? `${user.name}'s avatar` : "Account avatar"}
      />
      <AvatarFallback className="bg-secondary text-xs font-medium text-secondary-foreground">
        {getInitials(user.name, user.email)}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className={cn(
          "flex min-w-0 items-center gap-2.5 rounded-md text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
          variant === "full" ? "flex-1 px-2 py-1.5" : "rounded-full",
        )}
      >
        {avatar}
        {variant === "full" ? (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium leading-tight">
              {user.name || "Account"}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </span>
        ) : (
          <span className="sr-only">{user.name || user.email}</span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side={variant === "full" ? "top" : "bottom"}
        sideOffset={8}
        className="w-56"
      >
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm font-medium">
            {user.name || "Account"}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isSigningOut}
          onSelect={handleSignOut}
        >
          {isSigningOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
