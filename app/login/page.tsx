"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading02Icon } from "@hugeicons/core-free-icons";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FluxLogo } from "@/components/ui/logo";
import { ThemeSwitch } from "@/components/ui/theme-switch";

type Mode = "sign-in" | "sign-up";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
      />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z"
      />
    </svg>
  );
}

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
  }

  return (
    <div className="relative flex min-h-dvh flex-col justify-between overflow-x-hidden bg-background selection:bg-primary/20 selection:text-primary">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden"
        aria-hidden="true"
      >
        <div className="h-[420px] w-[560px] rounded-full bg-primary/6 blur-[140px] dark:bg-primary/8" />
      </div>

      {/* Top Header */}
      <header className="pointer-events-none sticky top-0 z-40 flex w-full items-center justify-between gap-2 pt-3 pb-2 sm:gap-4 sm:pt-4">
        {/* ── Left Pill: Logo stuck flush to left screen edge ── */}
        <div className="pointer-events-auto shrink-0">
          <Link
            href="/"
            className="group flex h-11 items-center gap-2.5 rounded-r-full border border-l-0 border-border/80 bg-background/85 py-1.5 pl-4 pr-4 shadow-xs backdrop-blur-md transition-all hover:border-border hover:bg-background/95 sm:h-12 sm:pl-5 sm:pr-5 dark:border-border/60 dark:bg-card/85 dark:shadow-md dark:hover:bg-card/95"
            aria-label="Back to home"
          >
            <FluxLogo className="text-primary size-4.5 shrink-0 transition-transform duration-200 group-hover:scale-105 sm:size-5" />
            <span className="font-mono text-sm font-semibold tracking-tight text-foreground sm:text-[15px]">
              Flux
            </span>
          </Link>
        </div>

        {/* ── Right Pill: Theme switch & Mode toggle stuck flush to right screen edge ── */}
        <div className="pointer-events-auto shrink-0">
          <div className="flex h-11 items-center gap-1.5 rounded-l-full border border-r-0 border-border/80 bg-background/85 py-1.5 pl-3.5 pr-4 shadow-xs backdrop-blur-md sm:h-12 sm:gap-2 sm:pl-4 sm:pr-5 dark:border-border/60 dark:bg-card/85 dark:shadow-md">
            <ThemeSwitch className="size-8 shrink-0 rounded-full" />
            <div
              aria-hidden="true"
              className="h-3.5 w-px shrink-0 bg-border/60 dark:bg-border/40"
            />
            <button
              type="button"
              onClick={() => {
                setMode(isSignUp ? "sign-in" : "sign-up");
                setError(null);
              }}
              className="cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground sm:px-3 sm:text-sm"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Auth Container */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:py-12 sm:px-6">
        <div className="w-full max-w-[420px] rounded-3xl border border-border/80 bg-card/75 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-border/60 dark:bg-card/60 dark:shadow-2xl">
          {/* Brand Icon + Title */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/25 shadow-xs">
              <FluxLogo className="size-6 shrink-0" />
            </div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-[26px]">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p className="font-inter text-muted-foreground mt-1.5 text-xs font-normal sm:text-sm text-balance">
              {isSignUp
                ? "Start building your grounded knowledge workspace."
                : "Sign in to continue to your workspaces."}
            </p>
          </div>

          {/* Social Logins — Single Line (2 cols) */}
          <div className="mt-7 grid grid-cols-2 gap-2.5">
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => handleSocial("google")}
              className="border-border/70 bg-background/60 hover:bg-muted/80 hover:border-border h-10 w-full gap-2 rounded-xl text-xs font-medium shadow-xs transition-all active:scale-[0.99]"
            >
              {socialPending === "google" ? (
                <HugeiconsIcon
                  icon={Loading02Icon}
                  strokeWidth={1.5}
                  className="text-muted-foreground size-4 animate-spin"
                  aria-hidden
                />
              ) : (
                <GoogleIcon className="size-4 shrink-0" />
              )}
              <span>Google</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => handleSocial("github")}
              className="border-border/70 bg-background/60 hover:bg-muted/80 hover:border-border h-10 w-full gap-2 rounded-xl text-xs font-medium shadow-xs transition-all active:scale-[0.99]"
            >
              {socialPending === "github" ? (
                <HugeiconsIcon
                  icon={Loading02Icon}
                  strokeWidth={1.5}
                  className="text-muted-foreground size-4 animate-spin"
                  aria-hidden
                />
              ) : (
                <GithubIcon className="size-4 shrink-0 text-foreground" />
              )}
              <span>GitHub</span>
            </Button>
          </div>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60" />
            </div>
            <span className="relative bg-card/90 px-3 font-inter text-[11px] font-medium text-muted-foreground/70">
              or continue with email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isSignUp && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="name"
                  className="text-xs font-medium text-foreground/90"
                >
                  Name
                </Label>
                <Input
                  id="name"
                  required
                  placeholder="Your name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  disabled={isBusy}
                  className="border-border/70 bg-background/70 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/20 h-10 rounded-xl px-3 text-sm sm:text-xs shadow-xs transition-all"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-xs font-medium text-foreground/90"
              >
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                disabled={isBusy}
                className="border-border/70 bg-background/70 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/20 h-10 rounded-xl px-3 text-sm sm:text-xs shadow-xs transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-xs font-medium text-foreground/90"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                disabled={isBusy}
                className="border-border/70 bg-background/70 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/20 h-10 rounded-xl px-3 text-sm sm:text-xs shadow-xs transition-all"
              />
              {isSignUp && (
                <p className="font-inter text-muted-foreground/80 text-[11px]">
                  Must be at least 8 characters.
                </p>
              )}
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isBusy}
              className="h-10.5 w-full cursor-pointer rounded-xl text-xs font-medium shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-[0.99]"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <HugeiconsIcon
                    icon={Loading02Icon}
                    strokeWidth={1.5}
                    className="size-3.5 animate-spin"
                  />
                  {isSignUp ? "Creating account…" : "Signing in…"}
                </span>
              ) : isSignUp ? (
                "Create account"
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          {/* Mode Switcher */}
          <p className="font-inter text-muted-foreground mt-6 text-center text-xs">
            {isSignUp ? "Already have an account?" : "New to Flux?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(isSignUp ? "sign-in" : "sign-up");
                setError(null);
              }}
              className="text-foreground hover:text-primary cursor-pointer font-medium underline underline-offset-4 transition-colors"
            >
              {isSignUp ? "Sign in" : "Create an account"}
            </button>
          </p>
        </div>
      </main>

      {/* Minimal Bottom Footer */}
      <footer className="text-muted-foreground/60 py-6 text-center font-inter text-[11px] pb-safe">
        © 2026 Flux. Your AI-Powered Research Partner.
      </footer>
    </div>
  );
}
