import { isCardNumbers } from "./generate-card";
import { isDrawn } from "./draw-ball";
import type { CardNumbers, WinPattern } from "./types";
function patterns(type: WinPattern): number[][] {
  switch (type) {
    case "line":
      return Array.from({ length: 5 }, (_, r) =>
        Array.from({ length: 5 }, (_, c) => r * 5 + c),
      );
    case "column":
      return Array.from({ length: 5 }, (_, c) =>
        Array.from({ length: 5 }, (_, r) => r * 5 + c),
      );
    case "diagonal":
      return [
        [0, 6, 12, 18, 24],
        [4, 8, 12, 16, 20],
      ];
    case "corners":
      return [[0, 4, 20, 24]];
    case "full":
      return [Array.from({ length: 25 }, (_, i) => i)];
    default:
      throw new Error("Padrão inválido.");
  }
}
export function validateBingo(
  nums: CardNumbers,
  drawn: readonly number[],
  pattern: WinPattern = "line",
) {
  if (!isCardNumbers(nums) || !isDrawn(drawn))
    throw new Error("Dados de Bingo inválidos.");
  const drawnSet = new Set(drawn);
  const combinations = patterns(pattern).map((indices) => ({
    indices,
    missing: indices
      .map((i) => nums[i])
      .filter((n): n is number => n !== null && !drawnSet.has(n)),
  }));
  const completed = combinations.filter((c) => c.missing.length === 0);
  const closest = combinations.reduce((best, current) =>
    current.missing.length < best.missing.length ? current : best,
  );
  return {
    won: completed.length > 0,
    pattern,
    completed,
    closest,
    matched: nums.filter((n) => n !== null && drawnSet.has(n)).length,
  };
}
