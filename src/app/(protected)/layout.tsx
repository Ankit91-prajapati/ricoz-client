


import { Suspense } from "react";
import { FullScreenSpinner } from "@/components/ui/Spinner";
import AppShell from "@/components/layout/AppShell";


export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<FullScreenSpinner />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
