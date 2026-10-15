import { isAxiosError } from "axios";

export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message.trim();
    if (error.code === "ERR_NETWORK") return "Cannot reach the server. Check your connection.";
  }
  return fallback;
}
