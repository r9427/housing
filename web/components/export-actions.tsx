"use client";

import { toCsv, downloadText } from "@/lib/csv";
import { buildPdf, downloadPdf } from "@/lib/pdf";

export function ExportActions({
  filename,
  title,
  headers,
  rows,
}: {
  filename: string;
  title: string;
  headers: string[];
  rows: string[][];
}) {
  function exportCsv() {
    downloadText(`${filename}.csv`, toCsv(headers, rows), "text/csv;charset=utf-8");
  }

  function exportPdf() {
    const lines = [
      headers.join(" | "),
      ...rows.map((row) => row.join(" | ")),
    ];
    downloadPdf(`${filename}.pdf`, buildPdf(title, lines));
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={exportCsv} className="rounded-full border border-line bg-card px-4 py-2 text-sm">
        Export CSV
      </button>
      <button type="button" onClick={exportPdf} className="rounded-full bg-ink px-4 py-2 text-sm text-white">
        Export PDF
      </button>
    </div>
  );
}
