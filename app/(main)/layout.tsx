import { Suspense } from "react";
import { Shell } from "@/components/shell/shell";
import { ShellSkeleton } from "@/components/shell/shell-skeleton";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
