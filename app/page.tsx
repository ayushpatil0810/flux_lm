import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, Globe, UploadCloud } from "lucide-react";

export default function Home() {
  return (
    <div className="h-[100dvh] w-full bg-background text-foreground font-sans overflow-hidden flex flex-col relative selection:bg-primary/30 selection:text-primary">
      
      {/* Split Minimal Navbar */}
      <header className="absolute top-8 left-0 right-0 z-50 px-6 sm:px-12 w-full flex items-center justify-between max-w-7xl mx-auto pointer-events-none">
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <UploadCloud className="h-4 w-4" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">Flux</span>
        </div>
        <nav className="flex items-center gap-1 bg-secondary/50 backdrop-blur-md border border-border/50 p-1.5 rounded-full pointer-events-auto shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <Link href="/dashboard" className="hidden sm:block px-5 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-background/80">
            Log in
          </Link>
          <Link href="/dashboard" className="px-5 py-2 text-sm font-semibold bg-foreground text-background hover:bg-foreground/90 rounded-full transition-all hover:scale-105 active:scale-95">
            Get Started
          </Link>
        </nav>
      </header>

      {/* Main Content Centered in Viewport */}
      <main className="flex-1 flex flex-col items-center justify-center w-full px-6 pt-24 pb-6 relative">
        
        <div className="max-w-3xl w-full flex flex-col items-center text-center gap-6 z-10">
          
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/50 px-4 py-1.5 text-sm font-medium text-secondary-foreground">
            Intelligent knowledge workspace
          </div>
          
          {/* Headline - Solid Colors, No Gradients */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.15]">
            Your Personal <br className="hidden sm:block" />
            <span className="text-primary">AI Research Assistant</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Upload your PDFs, notes, websites, YouTube videos, and transcripts. Ask questions in plain English and get answers backed by your own sources.
          </p>

          {/* CTA */}
          <div className="mt-2">
            <Link href="/dashboard">
              <Button size="lg" className="h-14 px-8 rounded-full shadow-none hover:bg-primary/90 transition-colors text-base font-medium text-white bg-primary">
                Get Started
              </Button>
            </Link>
          </div>
          
          {/* Visual Source Indicators */}
          <div className="flex flex-col items-center gap-4 mt-8 w-full">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">Works seamlessly with</p>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-muted-foreground/80">
              <div className="flex items-center gap-2.5">
                <FileText className="h-5 w-5" />
                <span className="font-medium text-sm sm:text-base">PDFs & Docs</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Globe className="h-5 w-5" />
                <span className="font-medium text-sm sm:text-base">Websites</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Image src="/youtube.svg" alt="YouTube" width={20} height={20} className="h-5 w-5 opacity-75" />
                <span className="font-medium text-sm sm:text-base">YouTube</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
