import React from "react";

interface QuerySummaryProps {
  text: string;
}

export function QuerySummary({ text }: QuerySummaryProps) {
  if (!text) return null;
  return (
    <p className="text-xs text-[#4F529B]">
      {text}
    </p>
  );
}

