import { randomInt } from "./random";
export function isDrawn(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length <= 75 &&
    new Set(value).size === value.length &&
    value.every((n) => Number.isInteger(n) && n >= 1 && n <= 75)
  );
}
export function drawBall(
  drawn: readonly number[],
  pick: (max: number) => number = randomInt,
): number | null {
  if (!isDrawn(drawn)) throw new Error("Histórico de pedras inválido.");
  const used = new Set(drawn);
  const remaining = Array.from({ length: 75 }, (_, i) => i + 1).filter(
    (n) => !used.has(n),
  );
  return remaining.length ? remaining[pick(remaining.length)] : null;
}
