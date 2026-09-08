"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function HeroCta({ initialIsLoggedIn }: { initialIsLoggedIn?: boolean } = {}) {
  const { data: session } = authClient.useSession();
  const isLoggedIn = session?.user
    ? true
    : session === null
      ? false
      : !!initialIsLoggedIn;

  return (
    <Button asChild size="lg" className="h-11 rounded-xl px-7 text-sm gap-2 shadow-sm">
      <Link href="/dashboard">
        {isLoggedIn ? "Open App" : "Try Flux"}
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          strokeWidth={1.5}
          className="size-4"
          aria-hidden
        />
      </Link>
    </Button>
  );
}

export function FinalCtaButton({ initialIsLoggedIn }: { initialIsLoggedIn?: boolean } = {}) {
  const { data: session } = authClient.useSession();
  const isLoggedIn = session?.user
    ? true
    : session === null
      ? false
      : !!initialIsLoggedIn;

  return (
    <Button asChild size="lg" className="h-11 rounded-xl px-7 text-sm gap-2 shadow-sm">
      <Link href="/dashboard">
        {isLoggedIn ? "Open App" : "Get started for free"}
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          strokeWidth={1.5}
          className="size-4"
          aria-hidden
        />
      </Link>
    </Button>
  );
}
