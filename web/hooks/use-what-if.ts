"use client";

import { type FormEvent, useState } from "react";
import { useApiError } from "@/hooks/use-api-error";
import type { Features, FieldName, Range, WhatIfResult } from "@/lib/types";
import { FIELD_DEFS, normalizeError } from "@/lib/validation";

export function useWhatIf(baseline: Features, ranges: Record<string, Range>) {
  const [features, setFeatures] = useState(baseline);
  const [vary, setVary] = useState<FieldName>("school_rating");
  const [start, setStart] = useState(String(ranges.school_rating.min));
  const [end, setEnd] = useState(String(ranges.school_rating.max));
  const [result, setResult] = useState<WhatIfResult | null>(null);
  const [pending, setPending] = useState(false);
  const api = useApiError();

  function chooseFeature(name: FieldName) {
    setVary(name);
    setStart(String(ranges[name]?.min ?? ""));
    setEnd(String(ranges[name]?.max ?? ""));
    setResult(null);
  }

  function updateFeature(name: FieldName, value: string) {
    const parsed = Number(value);
    setFeatures((current) => ({ ...current, [name]: Number.isFinite(parsed) ? parsed : current[name] }));
  }

  async function run(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const field = FIELD_DEFS.find((item) => item.name === vary);
    const startValue = Number(start);
    const endValue = Number(end);
    if (!field || !Number.isFinite(startValue) || !Number.isFinite(endValue)) {
      api.capture("Enter a numeric start and end for the feature you want to vary.");
      return;
    }
    if (startValue === endValue) {
      api.capture("The what-if range needs two different values.");
      return;
    }
    if (startValue < field.min || endValue < field.min || (field.max !== undefined && (startValue > field.max || endValue > field.max))) {
      api.capture(`${field.label} must stay between ${field.min} and ${field.max}.`);
      return;
    }

    setPending(true);
    api.clear();
    try {
      const response = await fetch("/api/market/what-if", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          baseline: features,
          vary,
          start: startValue,
          end: endValue,
          steps: 7,
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        api.capture(normalizeError(body));
        return;
      }
      setResult(body as WhatIfResult);
    } catch {
      api.capture("The market service is unavailable.");
    } finally {
      setPending(false);
    }
  }

  return {
    features,
    updateFeature,
    vary,
    chooseFeature,
    start,
    setStart,
    end,
    setEnd,
    result,
    pending,
    run,
    error: api.error,
  };
}
