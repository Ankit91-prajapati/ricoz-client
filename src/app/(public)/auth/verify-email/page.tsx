"use client";

import { CircleCheck, CircleX } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import AuthShell from "@/components/layout/AuthShell";
import Spinner from "@/components/ui/Spinner";
import { authService } from "@/services/auth.service";
import { getErrorMessage } from "@/utils/getErrorMessage";

type Status = "loading" | "success" | "error";

function VerifyEmail() {
  const token = useSearchParams().get("token");
  const [status, setStatus] = useState<Status>(token ? "loading" : "error");
  const [message, setMessage] = useState(token ? "" : "Verification token is missing.");
  const started = useRef(false); // StrictMode runs effects twice in dev

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;

    authService
      .verifyEmail(token)
      .then((res) => {
        // backend answers 200 + success:false when the email was already verified
        setStatus(res.success === false ? "error" : "success");
        setMessage(res.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(getErrorMessage(err, "This verification link is invalid or has expired."));
      });
  }, [token]);

  return (
    <AuthShell title="Email verification">
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
        {status === "loading" && (
          <>
            <Spinner className="mx-auto h-9 w-9" />
            <p className="mt-4 text-sm text-slate-300">Verifying your email…</p>
          </>
        )}
        {status === "success" && (
          <>
            <CircleCheck className="mx-auto h-12 w-12 text-emerald-400" />
            <p className="mt-4 font-medium">Email verified</p>
            <p className="mt-1 text-sm text-slate-400">{message}. You can now sign in.</p>
          </>
        )}
        {status === "error" && (
          <>
            <CircleX className="mx-auto h-12 w-12 text-red-400" />
            <p className="mt-4 font-medium">Couldn&apos;t verify</p>
            <p className="mt-1 text-sm text-slate-400">{message}</p>
          </>
        )}
      </div>

      {status !== "loading" && (
        <Link
          href="/login"
          className="mt-6 block rounded-lg bg-blue-600 py-3 text-center text-sm font-medium text-white hover:bg-blue-500"
        >
          Go to sign in
        </Link>
      )}
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmail />
    </Suspense>
  );
}
