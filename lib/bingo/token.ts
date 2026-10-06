import { isCardNumbers } from "./generate-card";
import type { SignedCard, UnsignedCard } from "./types";
export function encodeBase64Url(text: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(text)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
export function decodeBase64Url(input: string): string {
  if (
    !/^[A-Za-z0-9_-]+$/.test(input) ||
    input.length > 4096 ||
    input.length % 4 === 1
  )
    throw new Error("Base64URL inválido.");
  const bytes = Uint8Array.from(
    atob(input.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0),
  );
  const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (encodeBase64Url(decoded) !== input)
    throw new Error("Base64URL não canônico.");
  return decoded;
}
const timestamp = (v: unknown) =>
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
export function isSignedCard(value: unknown): value is SignedCard {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return (
    p.v === 1 &&
    typeof p.uid === "number" &&
    Number.isSafeInteger(p.uid) &&
    p.uid > 0 &&
    typeof p.gid === "string" &&
    /^[\w-]{1,64}$/.test(p.gid) &&
    typeof p.cid === "string" &&
    /^[\w-]{1,64}$/.test(p.cid) &&
    timestamp(p.iat) &&
    isCardNumbers(p.nums)
  );
}
export type ParsedToken =
  | { kind: "unsigned"; payload: UnsignedCard; encoded: string }
  | { kind: "signed"; payload: SignedCard; encoded: string; signature: string };
/** Parsing a signed token does NOT verify authenticity. */
export function parseToken(token: string): ParsedToken {
  if (token.length > 4600) throw new Error("Código de cartela muito longo.");
  const parts = token.trim().split(".");
  if (!(
    (parts[0] === "BNG1U" && parts.length === 2) ||
    (parts[0] === "BNG1S" && parts.length === 3)
  ))
    throw new Error("Código inválido ou versão não suportada.");
  let payload: unknown;
  try {
    payload = JSON.parse(decodeBase64Url(parts[1]));
  } catch {
    throw new Error("Conteúdo do código inválido.");
  }
  if (parts[0] === "BNG1U" && isUnsignedCard(payload))
    return { kind: "unsigned", payload, encoded: parts[1] };
  if (
    parts[0] === "BNG1S" &&
    isSignedCard(payload) &&
    /^[A-Za-z0-9_-]{43}$/.test(parts[2])
  )
    return { kind: "signed", payload, encoded: parts[1], signature: parts[2] };
  throw new Error("Cartela inválida: confira números, campos e versão.");
}
export function encodeUnsigned(card: UnsignedCard): string {
  if (!isUnsignedCard(card)) throw new Error("Cartela inválida.");
  return `BNG1U.${encodeBase64Url(JSON.stringify(card))}`;
}
