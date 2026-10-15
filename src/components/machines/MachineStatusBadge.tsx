import { getStatusMeta, type MachineStatus } from "@/types/machine";

export default function MachineStatusBadge({ status }: { status: MachineStatus }) {
  const meta = getStatusMeta(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}