"use client";

import { type FormEvent, useState } from "react";
import { useApiError } from "@/hooks/use-api-error";
import type { Estimate, Features, FieldName } from "@/lib/types";
import {
  EMPTY_VALUES,
  FIELD_DEFS,
  featuresToStrings,
  normalizeError,
  toFeatures,
  validateFeatures,
} from "@/lib/validation";

export function useEstimateForm(onCreated: (estimate: Estimate) => void) {
  const [values, setValues] = useState(EMPTY_VALUES);
  const [label, setLabel] = useState("");
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Estimate | null>(null);
  const api = useApiError();

  function update(name: FieldName, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function fill(features: Features, name: string) {
    setValues(featuresToStrings(features));
    setLabel(name);
    setErrors({});
    api.clear();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateFeatures(values);
    setErrors(nextErrors);
    const firstInvalid = FIELD_DEFS.find((field) => nextErrors[field.name]);
    if (firstInvalid) {
      document.getElementById(firstInvalid.name)?.focus();
      return;
    }
    if (label.trim().length > 80) {
      api.capture("Keep the property name to 80 characters.");
      return;
    }

    setPending(true);
    api.clear();
    try {
      const response = await fetch("/api/estimates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...toFeatures(values), label: label.trim() || null }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        api.capture(normalizeError(body));
        return;
      }
      const estimate = body as Estimate;
      setResult(estimate);
      onCreated(estimate);
    } catch {
      api.capture("The estimator service is unavailable.");
    } finally {
      setPending(false);
    }
  }

  return { values, update, label, setLabel, errors, pending, result, submit, fill, error: api.error };
}
