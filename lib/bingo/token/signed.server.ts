import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { encodeBase64Url } from "./base64url";
import { isSignedCard, parseToken } from "./parser";
import type { SignedCard, TokenVerifyResult } from "./types";

export function getSigningSecret(): string | null {
  const secret = process.env.BINGO_SIGNING_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

/**
 * Creates a signed BNG1S token using server-side HMAC-SHA256.
 * Message to be signed includes the BNG1S prefix to bind version and token type.
 */
export function signCard(card: SignedCard, secret: string): string {
  if (!secret || secret.length < 32 || !isSignedCard(card)) {
    throw new Error("Configuração ou cartela inválida.");
  }

  const encodedPayload = encodeBase64Url(JSON.stringify(card));
  const message = `BNG1S.${encodedPayload}`;
  const signature = createHmac("sha256", secret)
    .update(message)
    .digest("base64url");

  return `${message}.${signature}`;
}

/**
 * Verifies HMAC-SHA256 signature and returns the trusted SignedCard payload.
 * Throws an Error if token is not signed or signature does not match.
 */
export function verifyCard(token: string, secret: string): SignedCard {
  const parsed = parseToken(token);
  if (parsed.kind !== "signed") {
    throw new Error("Cartela não assinada.");
  }

  const expected = createHmac("sha256", secret)
    .update(`BNG1S.${parsed.encoded}`)
    .digest();

  const actual = Buffer.from(parsed.signature, "base64url");
  if (
    actual.toString("base64url") !== parsed.signature ||
    actual.length !== expected.length ||
    !timingSafeEqual(expected, actual)
  ) {
    throw new Error("Assinatura inválida.");
  }

  return parsed.payload;
}

/**
 * Structured token verification distinguishing unsigned, signed, invalid signature,
 * malformed format and unsupported versions without throwing unhandled exceptions.
 */
export function verifyToken(
  token: string,
  secret: string | null,
): TokenVerifyResult {
  if (typeof token !== "string" || !token.trim()) {
    return {
      valid: false,
      error: { code: "MISSING_TOKEN", message: "Código ausente." },
    };
  }

  let parsed;
  try {
    parsed = parseToken(token);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Código inválido.";
    if (msg.includes("muito longo") || msg.includes("malformado") || msg.includes("inválido")) {
      return {
        valid: false,
        error: { code: "MALFORMED_TOKEN", message: msg },
      };
    }
    if (msg.includes("não suportada")) {
      return {
        valid: false,
        error: { code: "UNSUPPORTED_VERSION", message: msg },
      };
    }
    return {
      valid: false,
      error: { code: "INVALID_PAYLOAD", message: msg },
    };
  }

  if (parsed.kind === "unsigned") {
    return {
      valid: true,
      kind: "unsigned",
      signatureValid: false,
      payload: parsed.payload,
    };
  }

  // Signed token verification requires secret
  if (!secret) {
    return {
      valid: false,
      kind: "signed",
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Verificação de assinatura indisponível neste ambiente.",
      },
      payload: parsed.payload,
    };
  }

  try {
    const verifiedPayload = verifyCard(token, secret);
    return {
      valid: true,
      kind: "signed",
      signatureValid: true,
      payload: verifiedPayload,
    };
  } catch {
    return {
      valid: false,
      kind: "signed",
      signatureValid: false,
      error: {
        code: "INVALID_SIGNATURE",
        message: "Assinatura inválida. A cartela pode ter sido adulterada.",
      },
      payload: parsed.payload,
    };
  }
}
