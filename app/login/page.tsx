"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading02Icon } from "@hugeicons/core-free-icons";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "sign-in" | "sign-up";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = React.useState<Mode>("sign-in");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [socialPending, setSocialPending] = React.useState<
    "github" | "google" | null
  >(null);

  const isSignUp = mode === "sign-up";
  const isBusy = isSubmitting || socialPending !== null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = isSignUp
      ? await authClient.signUp.email({ email, password, name: name.trim() })
      : await authClient.signIn.email({ email, password });

    if (result.error) {
      setError(
        result.error.message ??
          (isSignUp
            ? "Could not create your account."
            : "Could not sign you in."),
      );
      setIsSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleSocial(provider: "github" | "google") {
    setError(null);
    setSocialPending(provider);
    const { error: socialError } = await authClient.signIn.social({
      provider,
      callbackURL: "/dashboard",
    });
    if (socialError) {
      setError(
        socialError.message ??
          `Could not continue with ${provider === "github" ? "GitHub" : "Google"}.`,
      );
      setSocialPending(null);
    }
    // On success the browser navigates to the provider; keep the pending state.
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="bg-secondary/40 hidden border-r lg:flex lg:flex-col lg:justify-between lg:p-10">
        <Link
          href="/"
          className="focus-visible:ring-ring/60 w-fit rounded-sm font-serif text-lg font-semibold tracking-tight focus-visible:ring-2 focus-visible:outline-none"
        >
          Flux
        </Link>
        <div>
          <p className="text-title max-w-sm font-serif">
            Your sources, ready to answer.
          </p>
          <p className="text-muted-foreground mt-3 max-w-sm text-sm">
            Import PDFs, web pages, YouTube videos, and notes. Ask questions and
            get answers that cite your material.
          </p>
        </div>
        <p className="text-muted-foreground text-xs">
          Flux knowledge workspace
        </p>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="focus-visible:ring-ring/60 mb-10 inline-block rounded-sm font-serif text-lg font-semibold tracking-tight focus-visible:ring-2 focus-visible:outline-none lg:hidden"
          >
            Flux
          </Link>
          <h1 className="text-title font-serif">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {isSignUp
              ? "Start building your knowledge workspace."
              : "Sign in to continue to your workspaces."}
          </p>

          <div className="mt-7 grid gap-2">
            <Button
              variant="outline"
              disabled={isBusy}
              onClick={() => handleSocial("github")}
            >
              {socialPending === "github" ? (
                <HugeiconsIcon
                  icon={Loading02Icon}
                  strokeWidth={1.5}
                  className="size-4 animate-spin"
                  aria-hidden
                />
              ) : null}
              Continue with GitHub
            </Button>
            <Button
              variant="outline"
              disabled={isBusy}
              onClick={() => handleSocial("google")}
            >
              {socialPending === "google" ? (
                <HugeiconsIcon
                  icon={Loading02Icon}
                  strokeWidth={1.5}
                  className="size-4 animate-spin"
                  aria-hidden
                />
              ) : null}
              Continue with Google
            </Button>
          </div>

          <div
            aria-hidden
            className="text-muted-foreground my-6 flex items-center gap-3 text-xs"
          >
            <span className="bg-border h-px flex-1" />
            or with email
            <span className="bg-border h-px flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            {isSignUp ? (
              <div className="grid gap-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  disabled={isBusy}
                />
              </div>
            ) : null}
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                disabled={isBusy}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                disabled={isBusy}
                aria-describedby={isSignUp ? "password-hint" : undefined}
              />
              {isSignUp ? (
                <p id="password-hint" className="text-muted-foreground text-xs">
                  At least 8 characters.
                </p>
              ) : null}
            </div>

            {error ? (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            ) : null}

            <Button type="submit" disabled={isBusy}>
              {isSubmitting
                ? isSignUp
                  ? "Creating account…"
                  : "Signing in…"
                : isSignUp
                  ? "Create account"
                  : "Sign in"}
            </Button>
          </form>

          <p className="text-muted-foreground mt-6 text-sm">
            {isSignUp ? "Already have an account?" : "New to Flux?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(isSignUp ? "sign-in" : "sign-up");
                setError(null);
              }}
              className="text-foreground focus-visible:ring-ring/60 rounded-sm font-medium underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
            >
              {isSignUp ? "Sign in" : "Create an account"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
