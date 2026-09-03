import type { Metadata } from "next";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  BookOpen01Icon,
  Layers01Icon,
  SparkleIcon,
} from "@hugeicons/core-free-icons";

import { ThemeSwitch } from "@/components/ui/theme-switch";
import { Button } from "@/components/ui/button";
import { FluxLogo } from "@/components/ui/logo";

export const metadata: Metadata = {
  title: { absolute: "Flux — Understand Anything" },
  description:
    "Your research and thinking partner, grounded in the information you trust, built with the latest Gemini models.",
};

const USE_CASES = [
  {
    icon: BookOpen01Icon,
    title: "Power study",
    body: "Upload lecture recordings, textbook chapters, and research papers. Ask Flux to explain complex concepts in simple terms, provide real-world examples, and reinforce your understanding.",
    outcome: "Learn faster and deeper.",
  },
  {
    icon: Layers01Icon,
    title: "Organize your thinking",
    body: "Upload your source material and let Flux create a polished presentation outline, complete with key talking points and supporting evidence.",
    outcome: "Present with confidence.",
  },
  {
    icon: SparkleIcon,
    title: "Spark new ideas",
    body: "Upload brainstorming notes, market research, and competitor research. Ask Flux to identify trends, generate new product ideas, and uncover hidden opportunities.",
    outcome: "Unlock your creative potential.",
  },
] as const;

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-85"
          aria-label="Flux home"
        >
          <FluxLogo className="text-primary size-5.5 shrink-0" />
          <span className="font-mono text-base font-normal tracking-tight text-foreground">
            Flux
          </span>
        </Link>

        <div className="flex items-center gap-2.5">
          <ThemeSwitch className="size-8" />
          <Button asChild variant="ghost" size="sm" className="text-xs">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm" className="h-8 rounded-lg text-xs">
            <Link href="/dashboard">Try Flux</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center">
        <p className="font-mono text-xs font-medium uppercase tracking-wider text-primary">
          Your AI-Powered Research Partner
        </p>

        <h1 className="font-heading mt-4 text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-foreground text-balance">
          Understand Anything
        </h1>

        <p className="font-inter font-normal mt-5 max-w-2xl text-base sm:text-xl leading-relaxed text-muted-foreground text-balance">
          Your research and thinking partner, grounded in the information you
          trust.
        </p>

        <div className="mt-8 flex items-center justify-center">
          <Button asChild size="lg" className="h-11 rounded-xl px-7 text-sm gap-2 shadow-sm">
            <Link href="/dashboard">
              Try Flux
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={1.5}
                className="size-4"
                aria-hidden
              />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function UseCases() {
  return (
    <section className="py-16 sm:py-24 border-t border-border/40">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div className="max-w-xl">
          <p className="font-mono text-xs font-medium uppercase tracking-wider text-primary">
            Workflows
          </p>
          <h2 className="font-heading mt-2 text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            How you can use Flux ?
          </h2>
        </div>

        <div className="mt-12 grid gap-10 sm:grid-cols-3">
          {USE_CASES.map((item) => (
            <div
              key={item.title}
              className="flex flex-col justify-between"
            >
              <div>
                <HugeiconsIcon
                  icon={item.icon}
                  strokeWidth={1.5}
                  className="size-8 text-foreground"
                />
                <h3 className="font-heading mt-5 text-xl font-semibold tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="font-inter font-normal mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </div>

              <div className="mt-6 pt-2">
                <p className="font-heading text-xs font-semibold text-primary">
                  {item.outcome}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="py-20 sm:py-28 border-t border-border/40">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
        <h2 className="font-heading text-2xl sm:text-4xl font-semibold tracking-tight text-foreground">
          Ready to understand anything?
        </h2>
        <p className="font-inter font-normal mt-3 text-xs sm:text-base text-muted-foreground leading-relaxed">
          Create your first workspace and start learning faster and deeper.
        </p>
        <div className="mt-7 flex justify-center">
          <Button asChild size="lg" className="h-11 rounded-xl px-7 text-sm gap-2 shadow-sm">
            <Link href="/dashboard">
              Get started for free
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={1.5}
                className="size-4"
                aria-hidden
              />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/40 py-8 bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-4 px-4 sm:px-6 sm:flex-row">
        <div className="flex items-center gap-2">
          <FluxLogo className="text-primary size-4.5" />
          <span className="font-mono text-sm font-normal text-foreground">
            Flux
          </span>
          <span className="text-xs text-muted-foreground/60 ml-2 font-inter">
            © 2026 Flux. Your AI-Powered Research Partner.
          </span>
        </div>

        <div className="flex items-center gap-5 text-xs text-muted-foreground font-inter">
          <Link href="/login" className="hover:text-foreground transition-colors">
            Log in
          </Link>
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="min-h-dvh flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <Header />
      <main className="flex-1">
        <Hero />
        <UseCases />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
