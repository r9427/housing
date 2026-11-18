type ChartItem = { label: string; value: number; display: string };

export function BarChart({
  title,
  items,
  tone = "teal",
}: {
  title: string;
  items: ChartItem[];
  tone?: "teal" | "copper";
}) {
  const maximum = Math.max(...items.map((item) => Math.abs(item.value)), 1);
  const width = 640;
  const rowHeight = 32;
  const height = Math.max(items.length, 1) * rowHeight + 8;

  return (
    <figure className="overflow-x-auto rounded-2xl border border-line bg-card p-4">
      <figcaption className="mb-3 font-serif text-lg">{title}</figcaption>
      {items.length === 0 ? (
        <p className="text-sm text-muted">No values to chart.</p>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title} className="min-w-[36rem]">
          {items.map((item, index) => {
            const bar = Math.max(4, (Math.abs(item.value) / maximum) * 250);
            const y = 8 + index * rowHeight;
            return (
              <g key={`${item.label}-${index}`}>
                <text x="0" y={y + 14} className="chart-label">{item.label}</text>
                <rect x="190" y={y} width={bar} height="18" rx="4" className={tone === "teal" ? "bar-teal" : "bar-copper"} />
                <text x={198 + bar} y={y + 14} className="chart-value">{item.display}</text>
              </g>
            );
          })}
        </svg>
      )}
    </figure>
  );
}
