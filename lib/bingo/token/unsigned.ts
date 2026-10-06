import { isCardNumbers } from "../generate-card";
import { encodeBase64Url } from "./base64url";
import type { UnsignedCard } from "./types";

const timestamp = (v: unknown): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0;

export function isUnsignedCard(value: unknown): value is UnsignedCard {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return (
    p.v === 1 &&
    typeof p.name === "string" &&
    p.name.trim().length > 0 &&
    p.name.length <= 60 &&
    timestamp(p.createdAt) &&
    isCardNumbers(p.nums)
  );
}

export function encodeUnsigned(card: UnsignedCard): string {
  if (!isUnsignedCard(card)) throw new Error("Cartela inválida.");
  return `BNG1U.${encodeBase64Url(JSON.stringify(card))}`;
}
