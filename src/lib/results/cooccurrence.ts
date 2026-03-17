import type { CooccurrenceRow } from "./types";

export function buildCooccurrenceMatrix(
  responseItems: { response_id: string; factor_id: string }[],
  factors: { id: string; name: string }[]
): CooccurrenceRow[] {
  const factorNameById = new Map<string, string>();
  for (const f of factors) {
    factorNameById.set(f.id, f.name);
  }

  const responses = new Map<string, string[]>();
  for (const item of responseItems) {
    const list = responses.get(item.response_id) ?? [];
    list.push(item.factor_id);
    responses.set(item.response_id, list);
  }

  const pairCounts = new Map<string, number>();
  const factorCounts = new Map<string, number>();
  const totalResponses = responses.size || 1;

  for (const [, factorIds] of responses) {
    const unique = Array.from(new Set(factorIds));
    for (const id of unique) {
      factorCounts.set(id, (factorCounts.get(id) ?? 0) + 1);
    }
    for (let i = 0; i < unique.length; i++) {
      for (let j = i + 1; j < unique.length; j++) {
        const [a, b] =
          unique[i] < unique[j] ? [unique[i], unique[j]] : [unique[j], unique[i]];
        const key = `${a}|${b}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    }
  }

  const rows: CooccurrenceRow[] = [];
  for (const [key, coSelectedCount] of pairCounts.entries()) {
    const [factorAId, factorBId] = key.split("|");
    const countA = factorCounts.get(factorAId) ?? 1;
    const coSelectedPercentage = (coSelectedCount / totalResponses) * 100;
    const conditionalPercentage = (coSelectedCount / countA) * 100;

    rows.push({
      factorAId,
      factorAName: factorNameById.get(factorAId) ?? factorAId,
      factorBId,
      factorBName: factorNameById.get(factorBId) ?? factorBId,
      coSelectedCount,
      coSelectedPercentage,
      conditionalPercentage
    });
  }

  return rows;
}

export function getTopPairs(
  matrix: CooccurrenceRow[],
  limit: number
): CooccurrenceRow[] {
  return [...matrix]
    .sort((a, b) => b.coSelectedCount - a.coSelectedCount)
    .slice(0, limit);
}

export function getPairsForFactor(
  factorId: string,
  matrix: CooccurrenceRow[]
): CooccurrenceRow[] {
  return matrix.filter(
    (row) => row.factorAId === factorId || row.factorBId === factorId
  );
}

export function getRarePairsForFactor(
  factorId: string,
  matrix: CooccurrenceRow[]
): CooccurrenceRow[] {
  return getPairsForFactor(factorId, matrix)
    .filter((row) => row.coSelectedCount <= 2)
    .sort((a, b) => a.coSelectedCount - b.coSelectedCount);
}

