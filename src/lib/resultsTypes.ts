export interface FactorAggregate {
  factorId: string;
  factorName: string;
  selectionCount: number;
  averageRank: number | null;
  averageStrength: number | null;
  consensus: "high" | "mixed" | "low";
  combinedScore?: number;
}

