"use client";

import { ArrowLeft, MapPin, Pencil, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import MachineForm from "@/components/machines/MachineForm";
import MachineStatusBadge from "@/components/machines/MachineStatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import { useMachines } from "@/hooks/useMachines";
import { machineService } from "@/services/machine.service";
import { getStatusMeta, MACHINE_STATUSES, type Machine, type MachineInput, type MachineStatus } from "@/types/machine";
import { getErrorMessage } from "@/utils/getErrorMessage";

/** /machines/details -> pick a machine.   /machines/details?id=<id> -> view / edit it. */
function MachinePicker() {
  const { machines, loading, error } = useMachines();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return machines.filter((m) => !q || m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q));
  }, [machines, search]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Machine Details</h1>
      <p className="mb-6 mt-1 text-sm text-slate-400">Choose a machine to view its details.</p>

      <Input label="" aria-label="Search machines" icon={Search} placeholder="Search by name or code…"
        value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="mt-4 divide-y divide-slate-800 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        {loading ? (
          <div className="flex justify-center p-12"><Spinner /></div>
        ) : error ? (
          <p className="p-8 text-center text-red-400">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-slate-400">No machines found.</p>
        ) : (
          filtered.map((m) => (
            <Link key={m._id} href={`/machines/details?id=${m._id}`}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-800/50">
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="font-mono text-xs text-slate-400">{m.code}</p>
              </div>
              <MachineStatusBadge status={m.status} />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-100">{children}</dd>
    </div>
  );
}

function MachineDetails({ id }: { id: string }) {
  const router = useRouter();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [savingStatus, setSavingStatus] = useState<MachineStatus | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    machineService
      .get(id)
      .then((data) => active && setMachine(data))
      .catch((err) => active && setError(getErrorMessage(err, "Could not load machine.")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  async function changeStatus(status: MachineStatus) {
    if (!machine || status === machine.status) return;
    setSavingStatus(status);
    try {
      const updated = await machineService.update(id, { status });
      setMachine(updated);
      toast.success(`Status set to ${getStatusMeta(status).label}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not update status."));
    } finally {
      setSavingStatus(null);
    }
  }

  async function handleUpdate(values: MachineInput) {
    try {
      const updated = await machineService.update(id, values);
      setMachine(updated);
      setEditing(false);
      toast.success(`${updated.code} updated`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not update machine."));
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await machineService.remove(id);
      toast.success("Machine deleted");
      router.push("/machines");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete machine."));
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/machines" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to machines
      </Link>

      {loading ? (
        <div className="flex justify-center p-16"><Spinner className="h-7 w-7" /></div>
      ) : error || !machine ? (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
          {error ?? "Machine not found."}{" "}
          <Link href="/machines/details" className="font-medium underline">Choose another machine</Link>
        </div>
      ) : (
        <>
          <div className="mb-6 mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{machine.name}</h1>
              <p className="mt-1 font-mono text-sm text-slate-400">{machine.code}</p>
            </div>
            {!editing && (
              <div className="flex gap-3">
                <button onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium hover:bg-slate-800">
                  <Pencil className="h-4 w-4" /> Edit
                </button>
                <button onClick={() => setConfirmOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 px-4 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/10">
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            )}
          </div>

          {editing ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <MachineForm
                submitLabel="Save changes"
                onSubmit={handleUpdate}
                onCancel={() => setEditing(false)}
                initial={{
                  name: machine.name,
                  code: machine.code,
                  status: machine.status,
                  location: machine.location ?? "",
                  isActive: machine.isActive,
                }}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="text-sm font-medium text-slate-300">Current status</h2>
                <div className="mt-3"><MachineStatusBadge status={machine.status} /></div>
                <p className="mb-3 mt-5 text-xs text-slate-500">Change status</p>
                <div className="flex flex-wrap gap-2">
                  {MACHINE_STATUSES.map((s) => {
                    const current = s.value === machine.status;
                    return (
                      <button key={s.value} onClick={() => changeStatus(s.value)}
                        disabled={current || savingStatus !== null}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition disabled:cursor-not-allowed ${
                          current
                            ? "border-blue-500 bg-blue-500/10 text-blue-300"
                            : "border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                        }`}>
                        {savingStatus === s.value ? <Spinner className="h-3.5 w-3.5" /> : <span className={`h-2 w-2 rounded-full ${s.dot}`} />}
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <dl className="grid gap-6 sm:grid-cols-2">
                  <Detail label="Location">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-slate-500" /> {machine.location || "Not set"}
                    </span>
                  </Detail>
                  <Detail label="Active">
                    <span className={machine.isActive ? "text-emerald-400" : "text-slate-500"}>
                      {machine.isActive ? "Yes" : "No"}
                    </span>
                  </Detail>
                  <Detail label="Created">{new Date(machine.createdAt).toLocaleString()}</Detail>
                  <Detail label="Last updated">{new Date(machine.updatedAt).toLocaleString()}</Detail>
                </dl>
              </section>
            </div>
          )}

          <ConfirmDialog
            open={confirmOpen}
            title="Delete machine?"
            message={`“${machine.name}” (${machine.code}) will be permanently removed. This can't be undone.`}
            loading={deleting}
            onConfirm={handleDelete}
            onCancel={() => setConfirmOpen(false)}
          />
        </>
      )}
    </div>
  );
}

function DetailsRouter() {
  const id = useSearchParams().get("id");
  return id ? <MachineDetails key={id} id={id} /> : <MachinePicker />;
}

export default function MachineDetailsPage() {
  return (
    <Suspense fallback={null}>
      <DetailsRouter />
    </Suspense>
  );
}