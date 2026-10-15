import { redirect } from "next/navigation";

// proxy.ts sends visitors without a session to /login; everyone else lands here.
export default function Home() {
  redirect("/dashboard");
}
