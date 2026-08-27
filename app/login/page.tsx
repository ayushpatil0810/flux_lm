"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SpinnerGapIcon as Loader2 } from "@/components/ui/icons";

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
      <aside className="hidden border-r bg-secondary/40 lg:flex lg:flex-col lg:justify-between lg:p-10">
        <Link
          href="/"
          className="w-fit rounded-sm font-serif text-lg font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          Flux
        </Link>
        <div>
          <p className="max-w-sm font-serif text-title">
            Your sources, ready to answer.
          </p>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Import PDFs, web pages, YouTube videos, and notes. Ask questions
            and get answers that cite your material.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Flux knowledge workspace
        </p>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-10 inline-block rounded-sm font-serif text-lg font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 lg:hidden"
          >
            Flux
          </Link>
          <h1 className="font-serif text-title">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
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
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              Continue with GitHub
            </Button>
            <Button
              variant="outline"
              disabled={isBusy}
              onClick={() => handleSocial("google")}
            >
              {socialPending === "google" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              Continue with Google
            </Button>
          </div>

          <div
            aria-hidden
            className="my-6 flex items-center gap-3 text-xs text-muted-foreground"
          >
            <span className="h-px flex-1 bg-border" />
            or with email
            <span className="h-px flex-1 bg-border" />
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
                <p id="password-hint" className="text-xs text-muted-foreground">
                  At least 8 characters.
                </p>
              ) : null}
            </div>

            {error ? (
              <p role="alert" className="text-sm text-destructive">
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

          <p className="mt-6 text-sm text-muted-foreground">
            {isSignUp ? "Already have an account?" : "New to Flux?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(isSignUp ? "sign-in" : "sign-up");
                setError(null);
              }}
              className="rounded-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              {isSignUp ? "Sign in" : "Create an account"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}