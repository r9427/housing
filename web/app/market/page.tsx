import Link from "next/link";
import { BarChart } from "@/components/bar-chart";
import { ExportActions } from "@/components/export-actions";
import { WhatIfTool } from "@/components/what-if-tool";
import { fieldLabel, formatNumber, formatPrice } from "@/lib/format";
import { marketHref, propertyQuery, type MarketQuery } from "@/lib/market-query";
import { marketUrl, readJson } from "@/lib/server-api";
import type { CacheReport, Property, StatsResponse, Summary } from "@/lib/types";

export const metadata = { title: "Market analysis" };

const COLUMNS = [
  ["price", "Price"],
  ["square_footage", "Sq ft"],
  ["bedrooms", "Beds"],
  ["bathrooms", "Baths"],
  ["year_built", "Year"],
  ["lot_size", "Lot"],
  ["distance_to_city_center", "Distance"],
  ["school_rating", "School"],
] as const;

const GROUPS = [
  ["bedrooms", "Bedrooms"],
  ["decade", "Decade built"],
  ["school_band", "School rating"],
] as const;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const query: MarketQuery = {
    bedrooms: one(raw.bedrooms),
    min_year: one(raw.min_year),
    max_year: one(raw.max_year),
    min_price: one(raw.min_price),
    max_price: one(raw.max_price),
    min_school: one(raw.min_school),
    max_distance: one(raw.max_distance),
    sort: one(raw.sort) || "price",
    dir: one(raw.dir) || "desc",
    group: one(raw.group) || "bedrooms",
  };
  const group = GROUPS.some(([value]) => value === query.group) ? query.group || "bedrooms" : "bedrooms";

  const [summary, properties, stats, cache] = await Promise.all([
    readJson<Summary>(`${marketUrl()}/api/market/summary`),
    readJson<Property[]>(`${marketUrl()}/api/market/properties?${propertyQuery({ ...query, group: undefined })}`),
    readJson<StatsResponse>(`${marketUrl()}/api/market/stats?groupBy=${group}`),
    readJson<CacheReport>(`${marketUrl()}/api/market/cache`),
  ]);

  if (!summary.ok) throw new Error(summary.error);
  if (!properties.ok) throw new Error(properties.error);
  if (!stats.ok) throw new Error(stats.error);

  const hits = cache.ok ? cache.data.caches.reduce((total, item) => total + item.hit_count, 0) : 0;
  const rows = properties.data.map((property) => [
    String(property.id),
    formatNumber(property.square_footage),
    String(property.bedrooms),
    formatNumber(property.bathrooms, 1),
    String(property.year_built),
    formatNumber(property.lot_size),
    formatNumber(property.distance_to_city_center, 1),
    formatNumber(property.school_rating, 1),
    formatPrice(property.price),
  ]);

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-copper">App 2 · Java backend</p>
          <h1 className="mt-2 text-4xl">Property market analysis</h1>
          <p className="mt-3 text-muted">
            Aggregates come from the housing sample. What-if prices come from the same model used by the estimator.
          </p>
        </div>
        <ExportActions
          filename="housing-market"
          title="Harbor Housing market extract"
          headers={["Id", "Sq ft", "Beds", "Baths", "Year", "Lot", "Distance", "School", "Price"]}
          rows={rows}
        />
      </header>

      <section className="grid gap-3 sm:grid-cols-4" aria-label="Market summary">
        <Stat label="Homes" value={String(summary.data.count)} />
        <Stat label="Median price" value={formatPrice(summary.data.price.median)} />
        <Stat label="Average price" value={formatPrice(summary.data.price.mean)} />
        <Stat label="Price range" value={`${formatPrice(summary.data.price.min)} – ${formatPrice(summary.data.price.max)}`} />
      </section>

      <section className="grid gap-4" aria-labelledby="segments-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="segments-heading" className="text-3xl">Segment prices</h2>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Segment grouping">
            {GROUPS.map(([value, label]) => (
              <Link
                key={value}
                href={marketHref(query, { group: value })}
                aria-current={group === value ? "true" : undefined}
                className={`rounded-full px-3 py-1 text-sm no-underline ${group === value ? "bg-teal text-white" : "border border-line bg-card"}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <BarChart
          title={`Average price by ${GROUPS.find(([value]) => value === group)?.[1].toLowerCase()}`}
          items={stats.data.segments.map((segment) => ({
            label: segment.label,
            value: segment.average_price,
            display: formatPrice(segment.average_price),
          }))}
        />
        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="min-w-full text-left text-sm">
            <caption className="sr-only">Aggregate statistics for the selected segment</caption>
            <thead className="text-muted">
              <tr>
                <th scope="col" className="px-4 py-2">Segment</th>
                <th scope="col" className="px-4 py-2">Homes</th>
                <th scope="col" className="px-4 py-2">Average price</th>
                <th scope="col" className="px-4 py-2">Median price</th>
              </tr>
            </thead>
            <tbody>
              {stats.data.segments.map((segment) => (
                <tr key={segment.label} className="border-t border-line">
                  <th scope="row" className="px-4 py-2 font-medium">{segment.label}</th>
                  <td className="px-4 py-2">{segment.count}</td>
                  <td className="px-4 py-2">{formatPrice(segment.average_price)}</td>
                  <td className="px-4 py-2">{formatPrice(segment.median_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4" aria-labelledby="listings-heading">
        <h2 id="listings-heading" className="text-3xl">Listings</h2>
        <form method="get" className="grid gap-3 rounded-2xl border border-line bg-card p-4 md:grid-cols-4">
          <label className="grid gap-1 text-sm">
            Bedrooms
            <select name="bedrooms" defaultValue={query.bedrooms || ""} className="rounded-xl border border-line px-3 py-2">
              <option value="">Any</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Min year
            <input name="min_year" type="number" defaultValue={query.min_year || ""} className="rounded-xl border border-line px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            Max year
            <input name="max_year" type="number" defaultValue={query.max_year || ""} className="rounded-xl border border-line px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            Min school rating
            <input name="min_school" type="number" step="0.1" defaultValue={query.min_school || ""} className="rounded-xl border border-line px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            Min price
            <input name="min_price" type="number" defaultValue={query.min_price || ""} className="rounded-xl border border-line px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            Max price
            <input name="max_price" type="number" defaultValue={query.max_price || ""} className="rounded-xl border border-line px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            Max distance
            <input name="max_distance" type="number" step="0.1" defaultValue={query.max_distance || ""} className="rounded-xl border border-line px-3 py-2" />
          </label>
          <input type="hidden" name="sort" value={query.sort} />
          <input type="hidden" name="dir" value={query.dir} />
          <input type="hidden" name="group" value={group} />
          <div className="flex items-end gap-2">
            <button type="submit" className="rounded-full bg-teal px-4 py-2 text-sm text-white">Apply filters</button>
            <Link href="/market" className="rounded-full border border-line px-4 py-2 text-sm no-underline">Clear</Link>
          </div>
        </form>
        <p className="text-sm text-muted">{properties.data.length} homes match the current filters.</p>
        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="min-w-full text-left text-sm">
            <caption className="sr-only">Filtered housing sample</caption>
            <thead className="text-muted">
              <tr>
                <th scope="col" className="px-3 py-2">Id</th>
                {COLUMNS.map(([key, label]) => {
                  const active = query.sort === key;
                  const nextDir = active && query.dir === "asc" ? "desc" : "asc";
                  return (
                    <th key={key} scope="col" aria-sort={active ? (query.dir === "asc" ? "ascending" : "descending") : "none"} className="px-3 py-2">
                      <Link href={marketHref(query, { sort: key, dir: active ? nextDir : "asc" })} className="no-underline">
                        {label}{active ? (query.dir === "asc" ? " ↑" : " ↓") : ""}
                      </Link>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {properties.data.map((property) => (
                <tr key={property.id} className="border-t border-line">
                  <th scope="row" className="px-3 py-2 font-medium">{property.id}</th>
                  <td className="px-3 py-2">{formatPrice(property.price)}</td>
                  <td className="px-3 py-2">{formatNumber(property.square_footage)}</td>
                  <td className="px-3 py-2">{property.bedrooms}</td>
                  <td className="px-3 py-2">{formatNumber(property.bathrooms, 1)}</td>
                  <td className="px-3 py-2">{property.year_built}</td>
                  <td className="px-3 py-2">{formatNumber(property.lot_size)}</td>
                  <td className="px-3 py-2">{formatNumber(property.distance_to_city_center, 1)}</td>
                  <td className="px-3 py-2">{formatNumber(property.school_rating, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <WhatIfTool baseline={summary.data.medians} ranges={summary.data.ranges} />
      <p className="text-xs text-muted">
        Aggregate responses are cached in the Java service. Cache hits so far: {hits}. {fieldLabel("price")} stays the recorded sale price; what-if figures are model predictions.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-line bg-card p-4">
      <h2 className="text-sm font-sans text-muted">{label}</h2>
      <p className="mt-1 text-xl">{value}</p>
    </article>
  );
}
