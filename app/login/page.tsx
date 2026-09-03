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
    <div className="flex min-h-dvh flex-col justify-between bg-background selection:bg-primary/20 selection:text-primary">
      {/* Top Header */}
      <header className="flex h-14 items-center justify-between border-b border-border/40 bg-background/80 px-4 backdrop-blur-md sm:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-85"
          aria-label="Back to home"
        >
          <FluxLogo className="text-primary size-5.5 shrink-0" />
          <span className="font-mono text-base font-normal tracking-tight text-foreground">
            Flux
          </span>
        </Link>
        <ThemeSwitch className="size-8" />
      </header>

      {/* Main Auth Container */}
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm">
          {/* Brand Icon + Title */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-4 ring-primary/5">
              <FluxLogo className="size-5.5" />
            </div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p className="font-inter text-muted-foreground mt-1.5 text-xs font-normal sm:text-sm">
              {isSignUp
                ? "Start building your grounded knowledge workspace."
                : "Sign in to continue to your workspaces."}
            </p>
          </div>

          {/* Social Logins */}
          <div className="mt-8 grid gap-2.5">
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => handleSocial("google")}
              className="border-border/60 bg-card/60 hover:bg-card hover:border-primary/40 h-10 w-full gap-2.5 rounded-xl text-xs font-medium shadow-xs transition-all duration-150"
            >
              {socialPending === "google" ? (
                <HugeiconsIcon
                  icon={Loading02Icon}
                  strokeWidth={1.5}
                  className="text-muted-foreground size-4 animate-spin"
                  aria-hidden
                />
              ) : (
                <GoogleIcon className="size-4" />
              )}
              <span>Continue with Google</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => handleSocial("github")}
              className="border-border/60 bg-card/60 hover:bg-card hover:border-primary/40 h-10 w-full gap-2.5 rounded-xl text-xs font-medium shadow-xs transition-all duration-150"
            >
              {socialPending === "github" ? (
                <HugeiconsIcon
                  icon={Loading02Icon}
                  strokeWidth={1.5}
                  className="text-muted-foreground size-4 animate-spin"
                  aria-hidden
                />
              ) : (
                <GithubIcon className="size-4 text-foreground" />
              )}
              <span>Continue with GitHub</span>
            </Button>
          </div>

          {/* Divider */}
          <div className="font-inter text-muted-foreground/60 my-6 flex items-center gap-3 text-xs font-normal">
            <span className="bg-border/60 h-px flex-1" aria-hidden />
            <span>or continue with email</span>
            <span className="bg-border/60 h-px flex-1" aria-hidden />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isSignUp && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="name"
                  className="text-xs font-medium text-foreground"
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
                  className="border-border/60 bg-card/40 focus-visible:ring-primary/40 h-9.5 rounded-xl px-3 text-xs shadow-xs"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-xs font-medium text-foreground"
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
                className="border-border/60 bg-card/40 focus-visible:ring-primary/40 h-9.5 rounded-xl px-3 text-xs shadow-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-xs font-medium text-foreground"
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
                className="border-border/60 bg-card/40 focus-visible:ring-primary/40 h-9.5 rounded-xl px-3 text-xs shadow-xs"
              />
              {isSignUp && (
                <p className="font-inter text-muted-foreground text-[11px]">
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
              className="h-10 w-full rounded-xl text-xs font-medium shadow-sm transition-all"
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

      {/* Footer */}
      <footer className="border-border/40 text-muted-foreground/60 border-t py-5 text-center text-[11px]">
        Flux knowledge workspace · Turn your sources into answers
      </footer>
    </div>
  );
}
