"use client";

import { Lock, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import AuthShell from "@/components/layout/AuthShell";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { authService } from "@/services/auth.service";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { MIN_PASSWORD } from "@/utils/validators";

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <AuthShell
        title="Invalid reset link"
        footer={
          <Link href="/forgot-password" className="font-medium text-blue-400 hover:text-blue-300">
            Request a new link
          </Link>
        }
      >
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
          This reset link is missing its token. Please use the link from your email or request a new one.
        </div>
      </AuthShell>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (password.length < MIN_PASSWORD) next.password = `Use at least ${MIN_PASSWORD} characters`;
    if (confirm !== password) next.confirm = "Passwords do not match";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await authService.resetPassword(token as string, password);
      toast.success("Password reset! Please sign in.");
      router.replace("/login");
    } catch (err) {
      toast.error(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a strong password you haven't used before."
      footer={
        <Link href="/login" className="font-medium text-blue-400 hover:text-blue-300">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <Input label="New password" type="password" icon={Lock} placeholder="At least 6 characters"
          autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)}
          error={errors.password} />
        <Input label="Confirm new password" type="password" icon={Lock} placeholder="Repeat password"
          autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm} />
        <Button type="submit" loading={submitting}>
          Reset password
        </Button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
