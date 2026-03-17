import React from "react";

interface ResultsFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export function ResultsFilterBar({
  search,
  onSearchChange
}: ResultsFilterBarProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-3">
      <input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search factors"
        className="h-8 flex-1 min-w-[180px] rounded-md border border-[#4F529B]/60 bg-white px-3 text-xs text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#FF8F1C]"
      />
    </div>
  );
}

