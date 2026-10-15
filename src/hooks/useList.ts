"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/utils/getErrorMessage";

/** Loads a list once, exposes loading / error state and a reload(). `fetcher` must be a stable function. */
export function useList<T>(fetcher: () => Promise<T[]>, errorMessage: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    fetcher()
      .then((data) => {
        if (!active) return;
        setItems(data);
        setError(null);
      })
      .catch((err) => active && setError(getErrorMessage(err, errorMessage)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [fetcher, errorMessage, tick]);

  const reload = useCallback(() => {
    setLoading(true);
    setTick((t) => t + 1);
  }, []);

  return { items, setItems, loading, error, reload };
}