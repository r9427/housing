"use client";

import { useState } from "react";

export function useApiError() {
  const [error, setError] = useState<string | null>(null);

  return {
    error,
    clear() {
      setError(null);
    },
    capture(value: unknown) {
      if (value instanceof Error) setError(value.message);
      else if (typeof value === "string") setError(value);
      else setError("Something went wrong.");
    },
  };
}
