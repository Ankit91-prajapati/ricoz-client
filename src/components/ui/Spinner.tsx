import { LoaderCircle } from "lucide-react";

export default function Spinner({ className = "h-6 w-6" }: { className?: string }) {
  return <LoaderCircle className={`animate-spin text-blue-500 ${className}`} />;
}

export function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
