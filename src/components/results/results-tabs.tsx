import React from "react";

interface ResultsTabsProps {
  activeTab:
    | "overview"
    | "factors"
    | "responses"
    | "query"
    | "cooccurrence"
    | "honorable"
    | "exports";
  onChange: (tab: ResultsTabsProps["activeTab"]) => void;
}

const tabs: { id: ResultsTabsProps["activeTab"]; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "factors", label: "Factor analysis" },
  { id: "responses", label: "Response explorer" },
  { id: "query", label: "Query / cross-analysis" },
  { id: "cooccurrence", label: "Co-occurrence" },
  { id: "honorable", label: "Honorable mentions" },
  { id: "exports", label: "Exports" }
];

export function ResultsTabs({ activeTab, onChange }: ResultsTabsProps) {
  return (
    <div className="mb-4 flex flex-wrap gap-2 border-b border-[#4F529B]/30 pb-2">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={
              "rounded-full px-3 py-1 text-xs font-medium transition " +
              (isActive
                ? "bg-[#002855] text-white"
                : "bg-white text-[#4F529B] ring-1 ring-[#4F529B]/40 hover:bg-[#F4F7FB]")
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

