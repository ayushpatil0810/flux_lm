"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon, Logout01Icon } from "@hugeicons/core-free-icons";
import { authClient } from "@/lib/auth-client";
import { cn, getInitials } from "@/lib/utils";
import { useToast } from "@/components/providers/toast-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  /**
   * "full" shows the avatar alongside name and email (rail footer).
   * "avatar" shows only the avatar (mobile header).
   */
  variant?: "full" | "avatar";
  /** Optional callback to open the user's memories sheet */
  onMemoriesOpen?: () => void;
}

/** Account control: session identity with a sign-out action. */
export function UserMenu({
  variant = "full",
  onMemoriesOpen,
}: UserMenuProps) {
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
          "bg-muted animate-pulse rounded-full",
          variant === "full" ? "h-9 w-9" : "size-8.5",
        )}
      />
    );
  }

  const user = session?.user;
  if (!user) {
    return null;
  }

  const avatar = (
    <Avatar
      className={cn(
        "transition-all",
        variant === "full"
          ? "size-9 ring-1 ring-border/50"
          : "size-8.5 ring-1 ring-border/60 group-hover:ring-primary/60 shadow-xs",
      )}
    >
      <AvatarImage
        src={user.image ?? undefined}
        alt={user.name ? `${user.name}'s avatar` : "Account avatar"}
      />
      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
        {getInitials(user.name, user.email)}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className={cn(
          "group flex min-w-0 items-center text-left transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
          variant === "full"
            ? "flex-1 gap-2.5 rounded-xl px-2.5 py-2 hover:bg-accent"
            : "rounded-full cursor-pointer hover:opacity-90",
        )}
      >
        {avatar}
        {variant === "full" ? (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm leading-tight font-medium">
              {user.name || "Account"}
            </span>
            <span className="text-muted-foreground block truncate text-xs font-inter font-normal">
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
        className="w-64 rounded-2xl border border-border/60 bg-popover/95 p-1.5 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex items-center gap-3 px-2.5 py-2.5">
          <Avatar className="size-9 shrink-0 ring-1 ring-border/50">
            <AvatarImage
              src={user.image ?? undefined}
              alt={user.name ?? "Avatar"}
            />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {user.name || "Account"}
            </span>
            <span className="truncate text-xs text-muted-foreground font-inter font-normal">
              {user.email}
            </span>
          </div>
        </div>

        <DropdownMenuSeparator />

        {onMemoriesOpen && (
          <>
            <DropdownMenuItem
              onSelect={onMemoriesOpen}
              className="cursor-pointer gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors"
            >
              <HugeiconsIcon
                icon={Clock01Icon}
                strokeWidth={1.5}
                className="size-4 text-muted-foreground"
              />
              <span>Memories</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem
          variant="destructive"
          disabled={isSigningOut}
          onSelect={handleSignOut}
          className="cursor-pointer gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors"
        >
          <HugeiconsIcon
            icon={Logout01Icon}
            strokeWidth={1.5}
            className="size-4"
          />
          <span>{isSigningOut ? "Signing out…" : "Sign out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
