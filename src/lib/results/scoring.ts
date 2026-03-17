import type { ResponseDetailItem } from "./types";

export function getStrengthWeight(strengthValue: number): number {
  const weights: Record<number, number> = {
    1: 1,
    2: 3,
    3: 6,
    4: 10,
    5: 15
  };
  return weights[strengthValue] ?? 0;
}

export function getPositionWeight(positionIndex: number): number {
  return Math.max(1, 8 - positionIndex);
}

export function computeFactorScore(
  stackPosition: number,
  strengthValue: number
): number {
  const positionWeight = getPositionWeight(stackPosition);
  const strengthWeight = getStrengthWeight(strengthValue);
  return 3 * positionWeight * strengthWeight;
}

export function computeResponseTotalPoints(
  items: Pick<ResponseDetailItem, "stackPosition" | "strengthValue">[]
): number {
  return items.reduce(
    (total, item) =>
      total + computeFactorScore(item.stackPosition, item.strengthValue),
    0
  );
}

export function computeAverageStrength(
  items: Pick<ResponseDetailItem, "strengthValue">[]
): number {
  if (items.length === 0) return 0;
  const sum = items.reduce((total, item) => total + item.strengthValue, 0);
  return sum / items.length;
}

export function computeRigidityScore(
  items: Pick<ResponseDetailItem, "stackPosition" | "strengthValue">[]
): number {
  if (items.length === 0) return 0;
  // Simple heuristic: higher when stack is short and strengths are high.
  const distinctPositions = new Set(items.map((i) => i.stackPosition)).size;
  const avgStrength = computeAverageStrength(items);
  const lengthPenalty = Math.log(distinctPositions + 1);
  return (avgStrength * 5) / lengthPenalty;
}

