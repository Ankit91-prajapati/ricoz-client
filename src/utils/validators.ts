const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isEmail = (value: string) => EMAIL_RE.test(value.trim());

export const MIN_PASSWORD = 6;

/** Only allow same-site relative redirects (prevents open-redirect via ?next=). */
export function safeNext(next: string | null, fallback = "/dashboard") {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}
