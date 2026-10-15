/** Dates are stored as UTC midnight, so always format them in UTC to avoid off-by-one days. */
export function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** ISO string -> value for <input type="date"> */
export const toDateInput = (iso?: string | null) => (iso ? iso.slice(0, 10) : "");

/** Today's date (local time) as yyyy-mm-dd, for <input type="date"> defaults. Call it from handlers/forms, not at module level. */
export function todayInput() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 1234.5 -> "1,234.50" (no currency symbol, since the system doesn't store one) */
export const formatMoney = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const FINISHED = ["COMPLETED", "CANCELLED", "RECEIVED"];

/** Past its due day and not finished. */
export function isOverdue(due?: string | null, status?: string) {
  if (!due || FINISHED.includes(status ?? "")) return false;
  return new Date(due).getTime() + 24 * 60 * 60 * 1000 < Date.now();
}

/** nextNumber("WO", ["WO-0001", "WO-0007"]) -> "WO-0008" */
export function nextNumber(prefix: string, existing: string[]) {
  const re = new RegExp(`^${prefix}-(\\d+)$`);
  const max = existing.reduce((m, n) => {
    const hit = re.exec(n);
    return hit ? Math.max(m, Number(hit[1])) : m;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}