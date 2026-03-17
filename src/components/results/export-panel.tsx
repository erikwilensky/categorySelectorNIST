import React from "react";

const exportOptions = [
  {
    type: "factor-summary-csv",
    label: "Download factor summary (CSV)",
    description: "Aggregate metrics for each factor, including points and consensus."
  },
  {
    type: "response-summary-csv",
    label: "Download response summary (CSV)",
    description: "One row per finalized stack with points and top factors."
  },
  {
    type: "cooccurrence-csv",
    label: "Download co-occurrence matrix (CSV)",
    description: "Pairs of factors and how often they are selected together."
  }
];

export function ExportPanel() {
  const handleExport = (type: string) => {
    const url = `/api/results/export?type=${encodeURIComponent(type)}`;
    window.open(url, "_blank");
  };

  return (
    <section className="rounded-2xl bg-white/90 p-4 shadow-sm ring-2 ring-[#002855]">
      <h3 className="text-sm font-semibold text-[#002855]">Exports</h3>
      <p className="mb-4 mt-1 text-xs text-[#4F529B]">
        Download CSV files for further analysis in spreadsheets or BI tools. All
        exports are based on finalized stacks only.
      </p>
      <div className="space-y-3">
        {exportOptions.map((opt) => (
          <div
            key={opt.type}
            className="flex flex-col justify-between gap-2 rounded-xl border border-[#4F529B]/40 bg-white px-3 py-2 text-xs md:flex-row md:items-center"
          >
            <div>
              <p className="font-medium text-[#002855]">{opt.label}</p>
              <p className="text-[11px] text-[#4F529B]">{opt.description}</p>
            </div>
            <button
              type="button"
              onClick={() => handleExport(opt.type)}
              className="inline-flex items-center justify-center rounded-full bg-[#002855] px-3 py-1 text-[11px] font-medium text-white hover:bg-[#FF8F1C]"
            >
              Download
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

