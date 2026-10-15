"use client";

import { useCallback, useEffect, useState } from "react";
import { machineService } from "@/services/machine.service";
import type { Machine } from "@/types/machine";
import { getErrorMessage } from "@/utils/getErrorMessage";

export function useMachines() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    machineService
      .list()
      .then((data) => {
        if (!active) return;
        setMachines(data);
        setError(null);
      })
      .catch((err) => active && setError(getErrorMessage(err, "Could not load machines.")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [tick]);

  const reload = useCallback(() => {
    setLoading(true);
    setTick((t) => t + 1);
  }, []);

  return { machines, setMachines, loading, error, reload };
}