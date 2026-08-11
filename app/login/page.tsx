"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UploadCloud } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (isSignUp) {
      const { error } = await authClient.signUp.email({
        email,
        password,
        name,
      });
      if (error) {
        setError(error.message || "Failed to sign up");
        setIsLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } else {
      const { error } = await authClient.signIn.email({
        email,
        password,
      });
      if (error) {
        setError(error.message || "Failed to sign in");
        setIsLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    }
  };

  const handleSocialSignIn = async (provider: "github" | "google") => {
    setIsLoading(true);
    setError("");
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: "/dashboard"
    });

    if (error) {
      setError(error.message || `Failed to sign in with ${provider}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background text-foreground font-sans selection:bg-primary/30 selection:text-primary relative overflow-hidden">
      
      {/* Back Link */}
      <Link href="/" className="absolute top-6 left-6 sm:left-8 z-20 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
        &larr; Back
      </Link>

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative z-10">
        <div className="w-full max-w-[400px] flex flex-col">
          
          {/* Header Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm mb-6">
              <UploadCloud className="h-6 w-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
              Welcome to Flux
            </h1>
            <p className="text-sm text-muted-foreground">
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <button 
                type="button" 
                onClick={() => { setIsSignUp(!isSignUp); setError(""); }} 
                className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-all duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] active:opacity-70"
              >
                {isSignUp ? "Log in" : "Sign up"}
              </button>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 text-sm font-medium text-destructive bg-destructive/10 rounded-xl text-center ui-enter-fade">
              {error}
            </div>
          )}

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isSignUp && (
              <div className="space-y-2 ui-enter-fade">
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-12 rounded-xl bg-secondary/20 border-border/50 focus-visible:ring-primary/50 px-4 text-base shadow-sm"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl bg-secondary/20 border-border/50 focus-visible:ring-primary/50 px-4 text-base shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-xl bg-secondary/20 border-border/50 focus-visible:ring-primary/50 px-4 text-base shadow-sm"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium rounded-full shadow-none hover:bg-orange-500/90 transition-colors text-white bg-orange-500 mt-2 flex items-center justify-center" 
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              {isSignUp ? "Create Account" : "Log in"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Social Logins */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              type="button"
              variant="outline" 
              className="flex-1 h-12 rounded-xl shadow-sm border-border/60 bg-secondary/10 hover:bg-secondary/40 font-medium transition-colors" 
              onClick={() => handleSocialSignIn("github")} 
              disabled={isLoading}
            >
              <img src="/github.svg" alt="GitHub" className="mr-2.5 h-5 w-5 dark:invert" />
              GitHub
            </Button>
            <Button 
              type="button"
              variant="outline" 
              className="flex-1 h-12 rounded-xl shadow-sm border-border/60 bg-secondary/10 hover:bg-secondary/40 font-medium transition-colors" 
              onClick={() => handleSocialSignIn("google")} 
              disabled={isLoading}
            >
              <svg viewBox="0 0 24 24" className="mr-2.5 h-5 w-5" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </Button>
          </div>

          <p className="text-center text-xs sm:text-sm text-muted-foreground mt-6 px-4 leading-relaxed">
            By clicking continue, you agree to our <a href="#" className="underline underline-offset-4 hover:text-foreground transition-colors">Terms of Service</a> and <a href="#" className="underline underline-offset-4 hover:text-foreground transition-colors">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
