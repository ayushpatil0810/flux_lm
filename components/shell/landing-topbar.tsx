"use client";

import * as React from "react";
import Link from "next/link";

import { AppTopbar } from "@/components/shell/app-topbar";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

interface LandingTopbarProps {
  isLoggedIn?: boolean;
}

/**
 * Split-edge pill navigation for the landing page, built on the unified AppTopbar shell.
 */
export function LandingTopbar({ isLoggedIn: initialIsLoggedIn }: LandingTopbarProps = {}) {
  const { data: session } = authClient.useSession();
  const authenticated = session?.user
    ? true
    : session === null
      ? false
      : !!initialIsLoggedIn;

  const authRight = authenticated ? null : (
    <div className="flex items-center gap-1 sm:gap-1.5">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="h-7.5 rounded-full px-2 text-xs text-muted-foreground hover:text-foreground sm:h-8 sm:px-3"
      >
        <Link href="/login">Log in</Link>
      </Button>
      <Button
        asChild
        size="sm"
        className="h-7.5 rounded-full px-2.5 text-xs font-medium shadow-xs sm:h-8 sm:px-3.5"
      >
        <Link href="/dashboard">Try Flux</Link>
      </Button>
    </div>
  );

  const openAppAction = authenticated ? (
    <Button
      asChild
      size="sm"
      className="h-7.5 rounded-full px-2.5 text-xs font-medium shadow-xs sm:h-8 sm:px-3.5"
    >
      <Link href="/dashboard">Open App</Link>
    </Button>
  ) : null;

  return (
    <AppTopbar
      homeHref="/"
      homeAriaLabel="Flux home"
      rightActions={openAppAction}
      rightEnd={authRight}
      showThemeSwitch={true}
      showUserMenu={authenticated}
    />
  );
}

