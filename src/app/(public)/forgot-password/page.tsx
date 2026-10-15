"use client";

import { ArrowLeft, Mail, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import AuthShell from "@/components/layout/AuthShell";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { authService } from "@/services/auth.service";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { isEmail } from "@/utils/validators";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isEmail(email)) {
      setError("Enter a valid email address");
      return;
    }
    setError(undefined);
    setSubmitting(true);
    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const backLink = (
    <Link href="/login" className="inline-flex items-center gap-2 font-medium text-blue-400 hover:text-blue-300">
      <ArrowLeft className="h-4 w-4" /> Back to sign in
    </Link>
  );

  if (sent) {
    return (
      <AuthShell title="Check your email" footer={backLink}>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center">
          <MailCheck className="mx-auto h-10 w-10 text-blue-400" />
          <p className="mt-4 text-sm text-slate-300">
            We sent a password reset link to{" "}
            <span className="font-medium text-white">{email.trim()}</span>. It expires in 15 minutes.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link."
      footer={backLink}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <Input
          label="Email"
          type="email"
          icon={Mail}
          placeholder="you@company.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
        />
        <Button type="submit" loading={submitting}>
          Send reset link
        </Button>
      </form>
    </AuthShell>
  );
}
