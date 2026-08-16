"use client";

import { authClient } from "@/lib/auth-client";
import { UserCheck, ShieldCheck, Mail, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

export default function DashboardHome() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome Back</h1>
          <p className="text-muted-foreground text-sm">
            You are logged into the authentication workspace.
          </p>
        </div>

        {user ? (
          <div className="grid gap-6">
            <div className="border border-border/60 bg-secondary/10 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-sm">
                  <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                    {getInitials(user.name, user.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">{user.name || "User"}</h2>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="h-4 w-4" />
                Session Active
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-border/60 bg-secondary/5 rounded-xl p-5 flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">User ID</span>
                  <p className="text-sm font-semibold text-foreground mt-1 break-all">{user.id}</p>
                </div>
              </div>

              <div className="border border-border/60 bg-secondary/5 rounded-xl p-5 flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Verified</span>
                  <p className="text-sm font-semibold text-foreground mt-1">
                    {user.emailVerified ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 border border-dashed rounded-2xl text-center text-muted-foreground">
            Loading session state...
          </div>
        )}
      </div>
    </div>
  );
}

