"use client";

import { Lock, Mail, MailCheck, User } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import AuthShell from "@/components/layout/AuthShell";
import Button from "@/components/ui/Button";
import GoogleButton from "@/components/ui/GoogleButton";
import Input from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { isEmail, MIN_PASSWORD } from "@/utils/validators";

type Errors = Partial<Record<"username" | "email" | "password" | "confirm", string>>;

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    if (form.username.trim().length < 2) next.username = "Enter your name";
    if (!isEmail(form.email)) next.email = "Enter a valid email address";
    if (form.password.length < MIN_PASSWORD) next.password = `Use at least ${MIN_PASSWORD} characters`;
    if (form.confirm !== form.password) next.confirm = "Passwords do not match";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setSentTo(form.email.trim());
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (sentTo) {
    return (
      <AuthShell title="Check your email">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center">
          <MailCheck className="mx-auto h-10 w-10 text-blue-400" />
          <p className="mt-4 text-sm text-slate-300">
            We sent a verification link to <span className="font-medium text-white">{sentTo}</span>.
            Open it to activate your account, then sign in.
          </p>
        </div>
        <Link
          href="/login"
          className="mt-6 block text-center text-sm font-medium text-blue-400 hover:text-blue-300"
        >
          Back to sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Get started with Ricoz in a minute"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-400 hover:text-blue-300">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Input label="Full name" icon={User} placeholder="Jane Doe" autoComplete="name"
          value={form.username} onChange={set("username")} error={errors.username} />
        <Input label="Email" type="email" icon={Mail} placeholder="you@company.com" autoComplete="email"
          value={form.email} onChange={set("email")} error={errors.email} />
        <Input label="Password" type="password" icon={Lock} placeholder="At least 6 characters" autoComplete="new-password"
          value={form.password} onChange={set("password")} error={errors.password} />
        <Input label="Confirm password" type="password" icon={Lock} placeholder="Repeat password" autoComplete="new-password"
          value={form.confirm} onChange={set("confirm")} error={errors.confirm} />

        <Button type="submit" loading={submitting} className="mt-2">
          Create account
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-slate-500">
        <span className="h-px flex-1 bg-slate-800" />
        or
        <span className="h-px flex-1 bg-slate-800" />
      </div>

      <GoogleButton label="Sign up with Google" />
    </AuthShell>
  );
}
