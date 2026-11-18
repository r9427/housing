"use client";

import { BarChart } from "@/components/bar-chart";
import { useWhatIf } from "@/hooks/use-what-if";
import { fieldLabel, formatNumber, formatPrice } from "@/lib/format";
import type { Features, Range } from "@/lib/types";
import { FIELD_DEFS } from "@/lib/validation";

export function WhatIfTool({
  baseline,
  ranges,
}: {
  baseline: Features;
  ranges: Record<string, Range>;
}) {
  const tool = useWhatIf(baseline, ranges);
  const active = FIELD_DEFS.find((field) => field.name === tool.vary);

  return (
    <section className="grid gap-4 rounded-2xl border border-line bg-card p-5" aria-labelledby="what-if-heading">
      <div>
        <h2 id="what-if-heading" className="text-3xl">What-if analysis</h2>
        <p className="mt-1 text-sm text-muted">
          Change one feature across a range. The Java service sends the whole series to the model in one batch.
        </p>
      </div>
      {tool.error ? <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">{tool.error}</p> : null}
      <form onSubmit={tool.run} className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FIELD_DEFS.map((field) => (
            <label key={field.name} className="grid gap-1 text-sm" htmlFor={`baseline-${field.name}`}>
              {field.label}
              <input
                id={`baseline-${field.name}`}
                type="number"
                step={field.step}
                value={tool.features[field.name]}
                onChange={(event) => tool.updateFeature(field.name, event.target.value)}
                className="rounded-xl border border-line px-3 py-2"
              />
            </label>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1 text-sm" htmlFor="vary">
            Feature to vary
            <select id="vary" value={tool.vary} onChange={(event) => tool.chooseFeature(event.target.value as typeof tool.vary)} className="rounded-xl border border-line px-3 py-2">
              {FIELD_DEFS.map((field) => (
                <option key={field.name} value={field.name}>{field.label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm" htmlFor="start">
            Start
            <input id="start" type="number" step={active?.step} value={tool.start} onChange={(event) => tool.setStart(event.target.value)} className="rounded-xl border border-line px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm" htmlFor="end">
            End
            <input id="end" type="number" step={active?.step} value={tool.end} onChange={(event) => tool.setEnd(event.target.value)} className="rounded-xl border border-line px-3 py-2" />
          </label>
        </div>
        <button type="submit" disabled={tool.pending} className="w-fit rounded-full bg-copper px-4 py-2 text-sm text-white disabled:opacity-60">
          {tool.pending ? "Running…" : "Run what-if"}
        </button>
      </form>
      {tool.result ? (
        <div className="grid gap-4">
          <p className="text-sm">Baseline prediction: <strong>{formatPrice(tool.result.baseline_price)}</strong></p>
          <BarChart
            title={`${fieldLabel(tool.result.vary)} and predicted price`}
            tone="copper"
            items={tool.result.points.map((point) => ({
              label: formatNumber(point.value, Number.isInteger(point.value) ? 0 : 1),
              value: point.predicted_price,
              display: formatPrice(point.predicted_price),
            }))}
          />
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <caption className="sr-only">What-if predictions</caption>
              <thead>
                <tr className="text-muted">
                  <th scope="col" className="py-2">{fieldLabel(tool.result.vary)}</th>
                  <th scope="col" className="py-2">Predicted price</th>
                  <th scope="col" className="py-2">Change from baseline</th>
                </tr>
              </thead>
              <tbody>
                {tool.result.points.map((point) => (
                  <tr key={point.value} className="border-t border-line">
                    <td className="py-2">{formatNumber(point.value, 1)}</td>
                    <td className="py-2">{formatPrice(point.predicted_price)}</td>
                    <td className="py-2">{formatPrice(point.delta)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
