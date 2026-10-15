"use client";

import { useCallback, useEffect, useState } from "react";
import { productService } from "@/services/product.service";
import type { Product } from "@/types/product";
import { getErrorMessage } from "@/utils/getErrorMessage";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    productService
      .list()
      .then((data) => {
        if (!active) return;
        setProducts(data);
        setError(null);
      })
      .catch((err) => active && setError(getErrorMessage(err, "Could not load products.")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [tick]);

  const reload = useCallback(() => {
    setLoading(true);
    setTick((t) => t + 1);
  }, []);

  return { products, setProducts, loading, error, reload };
}