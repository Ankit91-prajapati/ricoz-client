import { CheckCircle2, Factory } from "lucide-react";
import type { ReactNode } from "react";

const highlights = [
  "Production plans, work orders and shop-floor execution",
  "Machines, maintenance and quality in one place",
  "Inventory, suppliers, purchasing and BOM tracking",
];

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden flex-col justify-between border-r border-slate-800 bg-linear-to-br from-slate-900 via-slate-900 to-blue-950 p-12 lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
            <Factory className="h-5 w-5 text-white" />
          </span>
          <span className="text-xl font-semibold tracking-tight">Ricoz</span>
        </div>

        <div>
          <h2 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">
            Run your manufacturing floor from one dashboard.
          </h2>
          <ul className="mt-8 space-y-4">
            {highlights.map((h) => (
              <li key={h} className="flex items-start gap-3 text-slate-300">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
                {h}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-slate-500">© Ricoz. All rights reserved.</p>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
              <Factory className="h-4 w-4 text-white" />
            </span>
            <span className="text-lg font-semibold">Ricoz</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-400">{subtitle}</p>}

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-6 text-center text-sm text-slate-400">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
