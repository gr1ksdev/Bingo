import type { CardNumbers, UnsignedCard } from "./types";
import { randomInt } from "./random";

export function generateCard(
  pick: (max: number) => number = randomInt,
): CardNumbers {
  const nums: CardNumbers = Array(25).fill(null);
  for (let col = 0; col < 5; col++) {
    const pool = Array.from({ length: 15 }, (_, i) => col * 15 + i + 1);
    for (let row = 0; row < 5; row++) {
      if (row === 2 && col === 2) continue;
      nums[row * 5 + col] = pool.splice(pick(pool.length), 1)[0];
    }
  }
  return nums;
}
export function isCardNumbers(value: unknown): value is CardNumbers {
  if (!Array.isArray(value) || value.length !== 25 || value[12] !== null)
    return false;
  const seen = new Set<number>();
  return value.every((n: unknown, i: number) => {
    if (i === 12) return n === null;
    const low = (i % 5) * 15 + 1;
    if (
      typeof n !== "number" ||
      !Number.isInteger(n) ||
      n < low ||
      n > low + 14 ||
      seen.has(n)
    )
      return false;
    seen.add(n);
    return true;
  });
}
export function createUnsignedCard(name = "Visitante"): UnsignedCard {
  return {
    v: 1,
    name: name.trim().slice(0, 60) || "Visitante",
    nums: generateCard(),
    createdAt: Date.now(),
  };
}
