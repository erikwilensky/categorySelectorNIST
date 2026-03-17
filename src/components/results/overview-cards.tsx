import React from "react";

interface OverviewMetrics {
  totalFinalizedStacks: number;
  totalUniqueFactorsSelected: number;
  averageFactorsPerStack: number;
  averagePointsUsed: number;
  maxPointsUsed: number;
  minPointsUsed: number;
}

interface OverviewCardsProps {
  metrics: OverviewMetrics | null;
  loading: boolean;
}

export function OverviewCards({ metrics, loading }: OverviewCardsProps) {
  if (loading && !metrics) {
    return <p className="text-xs text-[#4F529B]">Loading overview…</p>;
  }

  if (!metrics) {
    return (
      <p className="text-xs text-[#4F529B]">
        Overview metrics are not available yet.
      </p>
    );
  }

  const cards = [
    {
      label: "Finalized stacks",
      value: metrics.totalFinalizedStacks
    },
    {
      label: "Unique factors selected",
      value: metrics.totalUniqueFactorsSelected
    },
    {
      label: "Avg. factors per stack",
      value: metrics.averageFactorsPerStack.toFixed(1)
    },
    {
      label: "Avg. points used",
      value: metrics.averagePointsUsed.toFixed(1)
    },
    {
      label: "Max points used",
      value: metrics.maxPointsUsed
    },
    {
      label: "Min points used",
      value: metrics.minPointsUsed
    }
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl bg-white/90 p-3 shadow-sm ring-1 ring-[#4F529B]/40"
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#4F529B]">
            {card.label}
          </p>
          <p className="mt-1 text-lg font-semibold text-[#002855]">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}

