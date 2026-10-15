import View from "@/components/ui/view";

// The auth gate in the protected layout shows a spinner until the session is restored,
// so these pages can't be part of the prerendered shell. Allow them to block instead.
export const instant = false;

export default function Page() {
  return <View />;
}