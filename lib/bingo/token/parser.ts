import { isCardNumbers } from "../generate-card";
import { decodeBase64Url } from "./base64url";
import { isUnsignedCard } from "./unsigned";
import type { ParsedToken, SignedCard } from "./types";

const timestamp = (v: unknown): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0;

export function isSignedCard(value: unknown): value is SignedCard {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;

  const hasValidUid =
    p.uid === undefined ||
    (typeof p.uid === "number" && Number.isSafeInteger(p.uid) && p.uid > 0) ||
    (typeof p.uid === "string" && /^[\w-]{1,64}$/.test(p.uid));

  const hasValidName =
    p.name === undefined ||
    (typeof p.name === "string" && p.name.length <= 60);

  return (
    p.v === 1 &&
    typeof p.cid === "string" &&
    /^[\w-]{1,64}$/.test(p.cid) &&
    typeof p.gid === "string" &&
    /^[\w-]{1,64}$/.test(p.gid) &&
    timestamp(p.iat) &&
    isCardNumbers(p.nums) &&
    hasValidUid &&
    hasValidName
  );
}

/**
 * Parsing a signed token identifies structure and decodes payload,
 * but does NOT verify HMAC authenticity. Verifying authenticity requires the server.
 */
export function parseToken(token: string): ParsedToken {
  if (typeof token !== "string" || token.length > 4600) {
    throw new Error("Código de cartela muito longo ou inválido.");
  }

  const parts = token.trim().split(".");
  if (parts.length < 2) {
    throw new Error("Código inválido ou malformado.");
  }

  const prefix = parts[0];
  if (prefix !== "BNG1U" && prefix !== "BNG1S") {
    throw new Error("Versão não suportada.");
  }

  if (prefix === "BNG1U" && parts.length !== 2) {
    throw new Error("Código unsigned malformado.");
  }

  if (prefix === "BNG1S" && parts.length !== 3) {
    throw new Error("Código signed malformado.");
  }

  let payload: unknown;
  try {
    payload = JSON.parse(decodeBase64Url(parts[1]));
  } catch {
    throw new Error("Conteúdo do código inválido.");
  }

  if (prefix === "BNG1U") {
    if (isUnsignedCard(payload)) {
      return { kind: "unsigned", payload, encoded: parts[1] };
    }
    throw new Error("Cartela unsigned inválida: confira números, campos e versão.");
  }

  if (prefix === "BNG1S") {
    const signature = parts[2];
    if (!/^[A-Za-z0-9_-]{43}$/.test(signature)) {
      throw new Error("Formato da assinatura inválido.");
    }
    if (isSignedCard(payload)) {
      return { kind: "signed", payload, encoded: parts[1], signature };
    }
    throw new Error("Cartela signed inválida: confira números, campos e versão.");
  }

  throw new Error("Código inválido ou versão não suportada.");
}
