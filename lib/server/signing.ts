import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { encodeBase64Url, isSignedCard, parseToken } from "@/lib/bingo/token";
import type { SignedCard } from "@/lib/bingo/types";
export function getSigningSecret(): string | null {
  const secret = process.env.BINGO_SIGNING_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}
export function signCard(card: SignedCard, secret: string): string {
  if (secret.length < 32 || !isSignedCard(card))
    throw new Error("Configuração ou cartela inválida.");
  const message = `BNG1S.${encodeBase64Url(JSON.stringify(card))}`;
  return `${message}.${createHmac("sha256", secret).update(message).digest("base64url")}`;
}
export function verifyCard(token: string, secret: string): SignedCard {
  const parsed = parseToken(token);
  if (parsed.kind !== "signed") throw new Error("Cartela não assinada.");
  const expected = createHmac("sha256", secret)
    .update(`BNG1S.${parsed.encoded}`)
    .digest();
  const actual = Buffer.from(parsed.signature, "base64url");
  if (
    actual.toString("base64url") !== parsed.signature ||
    actual.length !== expected.length ||
    !timingSafeEqual(expected, actual)
  )
    throw new Error("Assinatura inválida.");
  return parsed.payload;
}
