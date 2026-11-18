import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { estimatorUrl, marketUrl, mlUrl, readJson } from "@/lib/server-api";
import type { ModelInfo, ServiceState, Summary } from "@/lib/types";

export default async function HomePage() {
  const [model, estimator, market] = await Promise.all([
    readJson<ModelInfo>(`${mlUrl()}/model-info`),
    readJson<{ status: string }>(`${estimatorUrl()}/health`),
    readJson<Summary>(`${marketUrl()}/api/market/summary`),
  ]);

  const services: ServiceState[] = [
    {
      name: "Pricing model",
      ok: model.ok,
      detail: model.ok ? `${model.data.model_type} · R² ${model.data.metrics.r2.toFixed(3)}` : model.error,
    },
    {
      name: "Estimator API",
      ok: estimator.ok,
      detail: estimator.ok ? "Ready for new valuations" : estimator.error,
    },
    {
      name: "Market API",
      ok: market.ok,
      detail: market.ok ? `${market.data.count} homes in the sample` : market.error,
    },
  ];

  return (
    <div className="grid gap-8">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">Two applications, one model</p>
        <h1 className="mt-2 text-5xl">Harbor Housing</h1>
        <p className="mt-4 text-lg text-muted">
          Estimate a single property, or review the sample market and test how price moves when a feature changes.
        </p>
      </header>
      <section aria-label="Service status" className="grid gap-3 sm:grid-cols-3">
        {services.map((service) => (
          <article key={service.name} className={`rounded-2xl border p-4 ${service.ok ? "border-ok/20 bg-ok-bg" : "border-danger/20 bg-danger-bg"}`}>
            <h2 className="text-lg">{service.name}</h2>
            <p className="mt-1 text-sm">{service.ok ? "Available" : "Unavailable"}</p>
            <p className="mt-2 text-sm text-muted">{service.detail}</p>
          </article>
        ))}
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <Link href="/estimator" className="rounded-3xl border border-line bg-card p-6 no-underline">
          <p className="text-xs uppercase tracking-[0.14em] text-teal">Python</p>
          <h2 className="mt-2 text-3xl">Value estimator</h2>
          <p className="mt-2 text-sm text-muted">Validate a property form, store the prediction, and compare earlier estimates.</p>
        </Link>
        <Link href="/market" className="rounded-3xl border border-line bg-card p-6 no-underline">
          <p className="text-xs uppercase tracking-[0.14em] text-copper">Java</p>
          <h2 className="mt-2 text-3xl">Market analysis</h2>
          <p className="mt-2 text-sm text-muted">
            {market.ok
              ? `Median sale price in the sample is ${formatPrice(market.data.price.median)}.`
              : "Filter the sample, export it, and run a what-if against the model."}
          </p>
        </Link>
      </section>
    </div>
  );
}
