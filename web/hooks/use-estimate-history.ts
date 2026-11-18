"use client";

import { useState } from "react";
import { useApiError } from "@/hooks/use-api-error";
import type { CompareResponse, Estimate } from "@/lib/types";
import { normalizeError } from "@/lib/validation";

export function useEstimateHistory(initial: Estimate[]) {
  const [items, setItems] = useState(initial);
  const [selected, setSelected] = useState<number[]>([]);
  const [comparison, setComparison] = useState<CompareResponse | null>(null);
  const [pending, setPending] = useState(false);
  const api = useApiError();

  function add(estimate: Estimate) {
    setItems((current) => [estimate, ...current.filter((item) => item.id !== estimate.id)]);
  }

  function toggle(id: number) {
    setComparison(null);
    setSelected((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 4) return current;
      return [...current, id];
    });
    api.clear();
  }

  async function compare() {
    if (selected.length < 2) {
      api.capture("Select at least two estimates to compare.");
      return;
    }
    setPending(true);
    api.clear();
    try {
      const response = await fetch("/api/estimates/compare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids: selected }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        api.capture(normalizeError(body));
        return;
      }
      setComparison(body as CompareResponse);
    } catch {
      api.capture("The estimator service is unavailable.");
    } finally {
      setPending(false);
    }
  }

  return { items, add, selected, toggle, comparison, compare, pending, error: api.error };
}
