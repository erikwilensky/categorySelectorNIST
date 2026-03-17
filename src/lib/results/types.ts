export type ConsensusLabel =
  | "Strong consensus"
  | "Moderate consensus"
  | "Mixed views"
  | "Polarizing"
  | "Low support";

export type DisagreementLabel =
  | "High disagreement"
  | "Moderate disagreement"
  | "Low disagreement";

export interface FactorAggregate {
  factorId: string;
  factorName: string;
  category: "core" | "secondary" | "blue_sky";
  description?: string | null;
  selectionCount: number;
  selectionPercentage: number;
  averageRank: number | null;
  medianRank: number | null;
  minRank: number | null;
  maxRank: number | null;
  rankStdDev: number | null;
  averageStrength: number | null;
  medianStrength: number | null;
  minStrength: number | null;
  maxStrength: number | null;
  strengthStdDev: number | null;
  totalPoints: number;
  averagePoints: number;
  top3Count: number;
  highStrengthCount: number;
  consensusLabel: ConsensusLabel;
  disagreementLabel: DisagreementLabel;
}

export interface ResponseSummary {
  responseId: string;
  submittedAt: string;
  factorCount: number;
  topFactor: string | null;
  topThreeFactors: string[];
  averageStrength: number | null;
  totalPointsUsed: number;
  rigidityScore: number | null;
}

export interface ResponseDetailItem {
  factorId: string;
  factorName: string;
  category: "core" | "secondary" | "blue_sky";
  stackPosition: number;
  strengthValue: number;
  itemScore: number;
}

export interface HonorableAggregate {
  factorId: string;
  factorName: string;
  category: "core" | "secondary" | "blue_sky";
  honorableCount: number;
  honorableSelectionPercentage: number;
}

export interface CooccurrenceRow {
  factorAId: string;
  factorAName: string;
  factorBId: string;
  factorBName: string;
  coSelectedCount: number;
  coSelectedPercentage: number;
  conditionalPercentage: number;
}

export interface ResultsFilters {
  minSelections?: number;
  category?: "all" | "core" | "secondary" | "blue_sky";
  consensus?:
    | "all"
    | "Strong consensus"
    | "Moderate consensus"
    | "Mixed views"
    | "Polarizing"
    | "Low support";
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortKey?:
    | "selectionCount"
    | "selectionPercentage"
    | "averageRank"
    | "averageStrength"
    | "averagePoints";
  sortDirection?: "asc" | "desc";
  selectedFactorId?: string | null;
  factorInTopN?: number;
  minStrength?: number;
  minPoints?: number;
  maxPoints?: number;
  minFactorCount?: number;
  maxFactorCount?: number;
}

