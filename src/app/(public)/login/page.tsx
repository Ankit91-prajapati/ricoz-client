"use client";

import { Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import AuthShell from "@/components/layout/AuthShell";
import Button from "@/components/ui/Button";
import GoogleButton from "@/components/ui/GoogleButton";
import Input from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { isEmail, safeNext } from "@/utils/validators";

function LoginForm() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // Already signed in -> skip the form.
  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, router, next]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (!isEmail(email)) nextErrors.email = "Enter a valid email address";
    if (!password) nextErrors.password = "Password is required";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      toast.success("Welcome back!");
      router.replace(next);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your Ricoz account"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-blue-400 hover:text-blue-300">
            Create one
          </Link>
        </>
      }
    >
      <div><Link href="/info" className="text-4xl text-orange-200">Information page</Link></div>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <Input
          label="Email"
          type="email"
          icon={Mail}
          placeholder="you@company.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <div className="space-y-2">
          <Input
            label="Password"
            type="password"
            icon={Lock}
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <div className="text-right">
            <Link href="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" loading={submitting}>
          Sign in
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-slate-500">
        <span className="h-px flex-1 bg-slate-800" />
        or
        <span className="h-px flex-1 bg-slate-800" />
      </div>

      <GoogleButton />
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
