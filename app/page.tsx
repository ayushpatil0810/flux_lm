import type { Metadata } from "next";
import Link from "next/link";
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowRight01Icon as ArrowRight,
  ArrowUpRight01Icon as ArrowUpRight,
  BrainIcon as Brain,
  CheckmarkBadge01Icon as Check,
  File01Icon as FileText,
  Copy01Icon as Files,
  Globe02Icon as Globe,
  Chat01Icon as MessageSquare,
  PlusSignIcon as Plus,
  QuoteIcon as Quote,
  SparkleIcon as Sparkles,
  PlaySquareIcon as SquarePlay,
  Note01Icon as StickyNote,
} from '@hugeicons/core-free-icons';

import { ThemeSwitch } from "@/components/ui/theme-switch";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: { absolute: "Flux — Turn your sources into answers" },
  description:
    "Flux is a knowledge workspace. Import PDFs, web pages, YouTube videos, and notes — then ask questions and get answers that cite their sources.",
};

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "FAQ", href: "#faq" },
] as const;

const PROOF_POINTS = [
  "Every answer cites its sources",
  "PDFs, web, YouTube & notes",
  "Summaries, flashcards & more",
] as const;

const MOCK_SOURCES = [
  { icon: FileText, title: "Attention Is All You Need", meta: "PDF · 15 pages" },
  { icon: Globe, title: "transformer-explainer", meta: "Web · saved" },
  { icon: SquarePlay, title: "CS224n · Lecture 7", meta: "YouTube · 1h 12m" },
  { icon: StickyNote, title: "Reading notes", meta: "Note · 842 words" },
] as const;

const FEATURES = [
  {
    icon: Files,
    title: "Import anything",
    body: "PDFs, web pages, YouTube lectures, and plain notes land in one place — no reformatting, no busywork.",
  },
  {
    icon: MessageSquare,
    title: "Ask in plain language",
    body: "No query syntax to learn. Ask the way you would ask a colleague and follow up naturally.",
  },
  {
    icon: Quote,
    title: "Every answer, cited",
    body: "Responses link back to the exact passages they came from, so you can verify anything in one click.",
  },
  {
    icon: Brain,
    title: "It remembers",
    body: "Memories carry your context between sessions, so answers get sharper the more you work.",
  },
] as const;

const ARTIFACT_CHIPS = [
  "Summaries",
  "Key takeaways",
  "Flashcards",
  "Quizzes",
  "Mind maps",
  "Reports",
] as const;

const STEPS = [
  {
    n: "01",
    title: "Collect",
    body: "Drop in PDFs, links, videos, and notes. Flux indexes everything for retrieval the moment it arrives.",
  },
  {
    n: "02",
    title: "Converse",
    body: "Ask questions in plain language. Answers are grounded in your material — never the open web.",
  },
  {
    n: "03",
    title: "Create",
    body: "Turn the same sources into summaries, flashcards, quizzes, and reports with one request.",
  },
] as const;

const FAQS = [
  {
    q: "What kinds of sources can I import?",
    a: "PDFs, web pages, YouTube videos, and plain-text notes. Each source is indexed as soon as it lands, so it is ready to answer questions within moments.",
  },
  {
    q: "How do citations work?",
    a: "Every answer is assembled from passages retrieved from your sources. Claims carry reference markers you can open to jump straight to the original material, so nothing has to be taken on faith.",
  },
  {
    q: "What can Flux generate besides answers?",
    a: "Summaries, key takeaways, flashcards, quizzes, mind maps, and reports — all drawn from the same sources you imported, and all kept alongside your conversation.",
  },
  {
    q: "Who can see my workspaces?",
    a: "Only you. Workspaces are private to your account, and your sources are never shared with other users.",
  },
] as const;

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="flex size-7 items-center justify-center rounded-md bg-foreground font-serif text-sm italic text-background"
      >
        F
      </span>
      <span className="font-serif text-lg font-semibold tracking-tight">
        Flux
      </span>
    </span>
  );
}

function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          aria-label="Flux home"
          className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <Logo />
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Button
              key={link.href}
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <ThemeSwitch />
          </div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard">
              Get started
              <HugeiconsIcon icon={ArrowRight} aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function SectionHeading({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="mt-4 font-serif text-title text-balance sm:text-4xl sm:leading-[1.12] sm:tracking-[-0.015em]">
        {title}
      </h2>
      <p className="mt-4 text-lead text-muted-foreground text-pretty">{lead}</p>
    </div>
  );
}


function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Atmosphere: faint grid dissolving downward + a single accent glow */}
      <div
        aria-hidden="true"
        className="bg-grid mask-fade-b absolute inset-0"
      />
      <div
        aria-hidden="true"
        className="glow-primary absolute left-1/2 top-[-20%] size-[42rem] -translate-x-1/2 rounded-full opacity-70 blur-3xl"
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-6 pt-40 pb-16 text-center sm:pt-48 sm:pb-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground backdrop-blur">
          <span
            aria-hidden="true"
            className="size-1.5 animate-pulse rounded-full bg-primary"
          />
          AI knowledge workspace
        </div>

        <h1 className="mt-8 max-w-3xl font-serif text-display-lg text-balance">
          Turn your sources into <em className="italic">answers</em>.
        </h1>

        <p className="mt-6 max-w-xl text-lead text-muted-foreground text-pretty">
          Flux is a quiet place for serious reading. Import PDFs, web pages,
          YouTube videos, and notes — then ask questions in plain language and
          get answers that cite the material you gave it.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/dashboard">
              Get started
              <HugeiconsIcon icon={ArrowRight} aria-hidden="true" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full bg-background/60 backdrop-blur sm:w-auto"
          >
            <Link href="#how">See how it works</Link>
          </Button>
        </div>

        <ul className="mt-12 flex flex-wrap items-center justify-center gap-x-7 gap-y-2.5">
          {PROOF_POINTS.map((point) => (
            <li
              key={point}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <HugeiconsIcon icon={Check} aria-hidden="true" className="size-3.5 text-primary" />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Cite({ n }: { n: number }) {
  return (
    <sup
      aria-hidden="true"
      className="mx-0.5 inline-flex size-4 translate-y-0.5 items-center justify-center rounded-sm bg-primary/15 font-mono text-[9px] font-medium text-primary"
    >
      {n}
    </sup>
  );
}


function ProductMock() {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="glow-primary absolute -inset-x-8 -top-10 bottom-1/2 -z-10 rounded-full opacity-50 blur-3xl"
      />
      <div className="overflow-hidden rounded-2xl border border-border bg-card text-left shadow-2xl shadow-foreground/[0.06]">
        {/* Window chrome */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-3">
          <div aria-hidden="true" className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
          </div>
          <p className="font-mono text-[11px] tracking-wide text-muted-foreground">
            flux / research-brief
          </p>
        </div>

        <div className="grid md:grid-cols-[240px_1fr]">
          {/* Sources rail */}
          <aside className="hidden border-r border-border bg-muted/30 p-4 md:block">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Sources · 4
            </p>
            <ul className="mt-3 space-y-1">
              {MOCK_SOURCES.map((source) => (
                <li
                  key={source.title}
                  className="flex items-center gap-2.5 rounded-md px-2 py-2"
                >
                  <HugeiconsIcon icon={source.icon}
                    aria-hidden="true"
                    className="size-3.5 shrink-0 text-muted-foreground"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">
                      {source.title}
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {source.meta}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border px-2 py-2 text-xs text-muted-foreground">
              <HugeiconsIcon icon={Plus} aria-hidden="true" className="size-3.5" />
              Add source
            </div>
          </aside>

          {/* Conversation */}
          <div className="space-y-5 p-6 sm:p-8">
            <div className="flex justify-end">
              <p className="max-w-md rounded-2xl rounded-br-sm bg-muted px-4 py-2.5 text-sm">
                Why do transformers use multi-head attention instead of a
                single head?
              </p>
            </div>

            <div className="max-w-lg space-y-3">
              <p className="text-sm leading-relaxed">
                A single attention head can only focus on one kind of
                relationship at a time. Multi-head attention runs several heads
                in parallel — each learns to attend to different positions and
                patterns, and their outputs are combined
                <Cite n={1} />
                <Cite n={3} />
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                In practice, this lets the model track syntax in one head and
                semantics in another, which a single averaged distribution
                would blur together.
                <Cite n={4} />
              </p>
            </div>

            {/* Composer */}
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
              <HugeiconsIcon icon={Sparkles}
                aria-hidden="true"
                className="size-4 shrink-0 text-primary"
              />
              <p className="flex-1 text-sm text-muted-foreground">
                Ask a follow-up…
              </p>
              <div className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
                <HugeiconsIcon icon={ArrowUpRight} aria-hidden="true" className="size-3.5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function Features() {
  return (
    <section id="features" className="scroll-mt-24">
      <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-32">
        <SectionHeading
          eyebrow="Features"
          title={
            <>
              Everything around the answer,{" "}
              <em className="italic">considered</em>.
            </>
          }
          lead="Flux stays out of your way. Sources, conversations, and generated study material live in one workspace — each part quiet on its own, stronger together."
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <article
              key={feature.title}
              className="group rounded-xl border border-border bg-card p-6 transition-colors duration-200 hover:border-foreground/20"
            >
              <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors duration-200 group-hover:border-primary/40 group-hover:text-primary">
                <HugeiconsIcon icon={feature.icon} aria-hidden="true" className="size-4" />
              </div>
              <h3 className="mt-5 text-base font-semibold tracking-[-0.01em]">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.body}
              </p>
            </article>
          ))}

          {/* Artifacts — wide card */}
          <article className="group rounded-xl border border-border bg-card p-6 transition-colors duration-200 hover:border-foreground/20 sm:col-span-2">
            <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors duration-200 group-hover:border-primary/40 group-hover:text-primary">
              <HugeiconsIcon icon={Sparkles} aria-hidden="true" className="size-4" />
            </div>
            <h3 className="mt-5 text-base font-semibold tracking-[-0.01em]">
              Artifacts on demand
            </h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              The same sources become whatever the moment calls for — generated
              in one request, kept beside your conversation.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {ARTIFACT_CHIPS.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-border bg-background px-3 py-1 font-mono text-[11px] text-muted-foreground"
                >
                  {chip}
                </span>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 border-t border-border/60">
      <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-32">
        <SectionHeading
          eyebrow="How it works"
          title={
            <>
              Three moves, <em className="italic">no manual</em>.
            </>
          }
          lead="The path from raw material to something you can use is deliberately short. Most people go from sign-up to their first cited answer in under two minutes."
        />
        <ol className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.n} className="bg-card p-6 sm:p-8">
              <p className="font-mono text-xs tracking-[0.16em] text-primary">
                {step.n}
              </p>
              <h3 className="mt-6 font-serif text-heading">{step.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}


function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 border-t border-border/60">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-24 sm:py-32 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <div>
          <SectionHeading
            eyebrow="FAQ"
            title={
              <>
                Questions, <em className="italic">answered</em>.
              </>
            }
            lead="The short version of what people usually ask before their first import."
          />
        </div>
        <div className="border-t border-border">
          {FAQS.map((item) => (
            <details
              key={item.q}
              className="group border-b border-border"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-[15px] font-medium tracking-[-0.01em] transition-colors hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 [&::-webkit-details-marker]:hidden">
                {item.q}
                <HugeiconsIcon icon={Plus}
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45"
                />
              </summary>
              <p className="max-w-prose pb-6 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="border-t border-border/60">
      <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-32">
        <div className="relative overflow-hidden rounded-3xl bg-foreground px-6 py-20 text-center text-background sm:px-16 sm:py-24">
          <div
            aria-hidden="true"
            className="glow-primary absolute left-1/2 top-0 size-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
          />
          <p className="relative font-mono text-[11px] uppercase tracking-[0.16em] text-background/60">
            Ready when you are
          </p>
          <h2 className="relative mx-auto mt-5 max-w-xl font-serif text-display text-balance">
            Start asking <em className="italic">better</em> questions.
          </h2>
          <p className="relative mx-auto mt-5 max-w-md text-lead text-background/70">
            Create a workspace, add your first source, and ask it something
            real.
          </p>
          <div className="relative mt-10 flex justify-center">
            <Button asChild size="lg">
              <Link href="/dashboard">
                Get started
                <HugeiconsIcon icon={ArrowRight} aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="text-sm text-muted-foreground">
            © 2026 Flux. Turn your sources into answers.
          </p>
        </div>
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center gap-x-6 gap-y-2"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            Log in
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <section id="product" className="scroll-mt-24">
          <div className="mx-auto w-full max-w-6xl px-6 pb-24 sm:pb-32">
            <ProductMock />
          </div>
        </section>
        <Features />
        <HowItWorks />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

