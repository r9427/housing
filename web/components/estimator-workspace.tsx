"use client";

import { BarChart } from "@/components/bar-chart";
import { useEstimateForm } from "@/hooks/use-estimate-form";
import { useEstimateHistory } from "@/hooks/use-estimate-history";
import { fieldLabel, formatNumber, formatPrice, formatWhen } from "@/lib/format";
import type { Estimate, FieldName, ModelInfo } from "@/lib/types";
import { EDGE_PROPERTY, FIELD_DEFS, SAMPLE_PROPERTY } from "@/lib/validation";

const FEATURE_NAMES: FieldName[] = FIELD_DEFS.map((field) => field.name);

export function EstimatorWorkspace({
  model,
  modelError,
  initialHistory,
  historyError,
}: {
  model: ModelInfo | null;
  modelError: string | null;
  initialHistory: Estimate[];
  historyError: string | null;
}) {
  const history = useEstimateHistory(initialHistory);
  const form = useEstimateForm(history.add, history.items);

  return (
    <div className="grid gap-8">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">App 1 · Python backend</p>
        <h1 className="mt-2 text-4xl">Property value estimator</h1>
        <p className="mt-3 text-muted">
          Submit one property. The Python service checks the values, asks the pricing model for a prediction, and keeps the estimate in history.
        </p>
      </header>

      {modelError ? <Alert message={modelError} /> : null}
      {historyError ? <Alert message={historyError} /> : null}
      {form.error ? <Alert message={form.error} /> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <form noValidate onSubmit={form.submit} className="rounded-2xl border border-line bg-card p-5">
          <div className="mb-4 flex flex-wrap gap-2">
            <button type="button" className="rounded-full border border-line px-3 py-1 text-sm" onClick={() => form.fill(SAMPLE_PROPERTY, "Sample home")}>
              Use sample
            </button>
            <button type="button" className="rounded-full border border-line px-3 py-1 text-sm" onClick={() => form.fill(EDGE_PROPERTY, "Edge case")}>
              Use edge case
            </button>
          </div>
          <div className="grid gap-1 text-sm">
            <label htmlFor="label">Property name</label>
            <input
              id="label"
              value={form.label}
              onChange={(event) => form.changeLabel(event.target.value)}
              maxLength={80}
              aria-invalid={Boolean(form.nameError)}
              aria-describedby={form.nameError ? "label-error" : undefined}
              className="rounded-xl border border-line px-3 py-2"
            />
            {form.nameError ? <p id="label-error" role="alert" className="text-sm text-danger">{form.nameError}</p> : null}
          </div>
          <div className="mt-4 grid gap-4">
            {FIELD_DEFS.map((field) => {
              const error = form.errors[field.name];
              const describedBy = error ? `${field.name}-hint ${field.name}-error` : `${field.name}-hint`;
              return (
                <div key={field.name} className="grid gap-1 text-sm">
                  <label htmlFor={field.name}>{field.label}</label>
                  <input
                    id={field.name}
                    name={field.name}
                    type="number"
                    inputMode="decimal"
                    step={field.step}
                    min={field.min}
                    max={field.max}
                    value={form.values[field.name]}
                    aria-invalid={Boolean(error)}
                    aria-describedby={describedBy}
                    onChange={(event) => form.update(field.name, event.target.value)}
                    className="rounded-xl border border-line px-3 py-2"
                  />
                  <p id={`${field.name}-hint`} className="text-xs text-muted">{field.hint}</p>
                  {error ? <p id={`${field.name}-error`} role="alert" className="text-sm text-danger">{error}</p> : null}
                </div>
              );
            })}
          </div>
          <button type="submit" disabled={form.pending} className="mt-5 rounded-full bg-teal px-4 py-2 text-sm text-white disabled:opacity-60">
            {form.pending ? "Estimating…" : "Estimate value"}
          </button>
        </form>

        <div className="grid gap-4 content-start">
          {form.result ? <ResultCard estimate={form.result} model={model} /> : (
            <section className="rounded-2xl border border-dashed border-line bg-card p-6">
              <h2 className="text-2xl">No estimate yet</h2>
              <p className="mt-2 text-sm text-muted">The price, feature table, and chart appear here after a valid submission.</p>
            </section>
          )}
          {model ? <ModelCard model={model} /> : null}
        </div>
      </div>

      <section className="grid gap-4" aria-labelledby="history-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="history-heading" className="text-3xl">Estimate history</h2>
          <button type="button" onClick={history.compare} disabled={history.pending} className="rounded-full bg-ink px-4 py-2 text-sm text-white disabled:opacity-60">
            {history.pending ? "Comparing…" : "Compare selected"}
          </button>
        </div>
        {history.error ? <Alert message={history.error} /> : null}
        {history.items.length === 0 ? (
          <p className="text-sm text-muted">Previous estimates will be listed here.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line bg-card">
            <table className="min-w-full text-left text-sm">
              <caption className="sr-only">Previous property estimates</caption>
              <thead className="bg-paper text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2">Compare</th>
                  <th scope="col" className="px-3 py-2">Name</th>
                  <th scope="col" className="px-3 py-2">When</th>
                  <th scope="col" className="px-3 py-2">Price</th>
                  <th scope="col" className="px-3 py-2">Sq ft</th>
                  <th scope="col" className="px-3 py-2">Beds</th>
                </tr>
              </thead>
              <tbody>
                {history.items.map((item) => (
                  <tr key={item.id} className="border-t border-line">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={history.selected.includes(item.id)}
                        onChange={() => history.toggle(item.id)}
                        aria-label={`Select ${item.label || `estimate ${item.id}`} for comparison`}
                      />
                    </td>
                    <td className="px-3 py-2">{item.label || `Estimate ${item.id}`}</td>
                    <td className="px-3 py-2">{formatWhen(item.created_at)}</td>
                    <td className="px-3 py-2">{formatPrice(item.predicted_price)}</td>
                    <td className="px-3 py-2">{formatNumber(item.features.square_footage)}</td>
                    <td className="px-3 py-2">{item.features.bedrooms}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {history.items.length > 1 ? (
          <BarChart
            title="Recent predicted prices"
            tone="copper"
            items={history.items.slice(0, 8).map((item) => ({
              label: item.label || `#${item.id}`,
              value: item.predicted_price,
              display: formatPrice(item.predicted_price),
            }))}
          />
        ) : null}
        {history.comparison ? <Comparison comparison={history.comparison} /> : null}
      </section>
    </div>
  );
}

function ResultCard({ estimate, model }: { estimate: Estimate; model: ModelInfo | null }) {
  const rows = FEATURE_NAMES.map((name) => ({
    label: fieldLabel(name),
    value: estimate.features[name],
  }));
  const rangeItems = model
    ? FEATURE_NAMES.map((name) => {
        const range = model.feature_ranges[name];
        const span = Math.max(range.max - range.min, 1);
        const position = ((estimate.features[name] - range.min) / span) * 100;
        return {
          label: fieldLabel(name),
          value: position,
          display: formatNumber(estimate.features[name], name === "bedrooms" || name === "year_built" ? 0 : 1),
        };
      })
    : [];

  return (
    <section className="grid gap-4" aria-live="polite">
      <div className="rounded-2xl bg-teal px-5 py-4 text-white">
        <p className="text-sm text-white/80">{estimate.label || "Predicted price"}</p>
        <p className="font-serif text-4xl">{formatPrice(estimate.predicted_price)}</p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="min-w-full text-left text-sm">
          <caption className="px-4 py-3 text-left font-serif text-lg text-ink">Submitted features</caption>
          <thead>
            <tr className="text-muted">
              <th scope="col" className="px-4 py-2">Feature</th>
              <th scope="col" className="px-4 py-2">Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-line">
                <th scope="row" className="px-4 py-2 font-medium">{row.label}</th>
                <td className="px-4 py-2">{formatNumber(row.value, Number.isInteger(row.value) ? 0 : 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rangeItems.length > 0 ? (
        <BarChart title="Where this home sits in the training range" items={rangeItems} />
      ) : null}
    </section>
  );
}

function Comparison({ comparison }: { comparison: { estimates: Estimate[]; price_spread: number; highest_id: number; lowest_id: number } }) {
  return (
    <section className="grid gap-4" aria-labelledby="compare-heading">
      <div>
        <h2 id="compare-heading" className="text-3xl">Side-by-side comparison</h2>
        <p className="mt-1 text-sm text-muted">Spread between the highest and lowest estimate: {formatPrice(comparison.price_spread)}.</p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="min-w-full text-left text-sm">
          <caption className="sr-only">Selected estimates compared feature by feature</caption>
          <thead>
            <tr>
              <th scope="col" className="px-3 py-2">Feature</th>
              {comparison.estimates.map((estimate) => (
                <th key={estimate.id} scope="col" className="px-3 py-2">
                  {estimate.label || `Estimate ${estimate.id}`}
                  {estimate.id === comparison.highest_id ? " · highest" : ""}
                  {estimate.id === comparison.lowest_id ? " · lowest" : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-line">
              <th scope="row" className="px-3 py-2">Predicted price</th>
              {comparison.estimates.map((estimate) => (
                <td key={estimate.id} className="px-3 py-2">{formatPrice(estimate.predicted_price)}</td>
              ))}
            </tr>
            {FEATURE_NAMES.map((name) => (
              <tr key={name} className="border-t border-line">
                <th scope="row" className="px-3 py-2">{fieldLabel(name)}</th>
                {comparison.estimates.map((estimate) => (
                  <td key={estimate.id} className="px-3 py-2">{formatNumber(estimate.features[name], Number.isInteger(estimate.features[name]) ? 0 : 1)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <BarChart
        title="Compared prices"
        items={comparison.estimates.map((estimate) => ({
          label: estimate.label || `#${estimate.id}`,
          value: estimate.predicted_price,
          display: formatPrice(estimate.predicted_price),
        }))}
      />
    </section>
  );
}

function ModelCard({ model }: { model: ModelInfo }) {
  return (
    <details className="rounded-2xl border border-line bg-card p-4">
      <summary className="cursor-pointer font-medium">Model coefficients and metrics</summary>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div><dt className="text-muted">R²</dt><dd>{model.metrics.r2.toFixed(3)}</dd></div>
        <div><dt className="text-muted">MAE</dt><dd>{formatPrice(model.metrics.mae)}</dd></div>
        <div><dt className="text-muted">RMSE</dt><dd>{formatPrice(model.metrics.rmse)}</dd></div>
        <div><dt className="text-muted">Samples</dt><dd>{model.n_samples}</dd></div>
      </dl>
      <p className="mt-3 text-xs text-muted">
        Metrics come from {model.metrics.cv_folds}-fold cross-validation. Coefficients share explanatory power because the features move together.
      </p>
    </details>
  );
}

function Alert({ message }: { message: string }) {
  return <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">{message}</p>;
}
