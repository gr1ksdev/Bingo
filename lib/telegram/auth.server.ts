import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { TelegramUser, VerifyTelegramOptions } from "./types";

/**
 * Validates Telegram Mini App initData following the official Telegram specification:
 * 1. Parameters are parsed from query string. Duplicate keys are strictly rejected.
 * 2. Hash parameter is removed and the remaining keys are alphabetically sorted and joined by '\n'.
 * 3. Secret key is HMAC-SHA256 of "WebAppData" with TELEGRAM_BOT_TOKEN.
 * 4. Data check string is hashed with secret key and compared to the provided hash via timingSafeEqual.
 * 5. auth_date freshness is verified against replay attacks within a strict window (default 300s).
 * 6. User object is parsed and strictly validated ONLY AFTER cryptographic confirmation.
 *
 * REPLAY PROTECTION NOTE:
 * The auth_date check mitigates replay of captured initData tokens outside the freshness window (300 seconds).
 * Because this phase does not have a database to track used nonces, an initData can technically be replayed
 * within this 5-minute window. True one-time nonce consumption or persistent session tokens will be introduced
 * in the future persistence/multiplayer phase.
 */
export function verifyTelegramInitData(
  initData: string,
  botToken: string,
  options: VerifyTelegramOptions = {},
): TelegramUser {
  if (!initData || typeof initData !== "string" || initData.length > 8192) {
    throw new Error("Identidade Telegram inválida.");
  }
  if (!botToken || typeof botToken !== "string" || botToken.length < 10) {
    throw new Error("Configuração do bot Telegram ausente ou inválida.");
  }

  const { maxAgeSeconds = 300, now = Math.floor(Date.now() / 1000) } = options;

  const params = new URLSearchParams(initData);
  const keys = [...params.keys()];
  if (new Set(keys).size !== keys.length) {
    throw new Error("Campos duplicados no initData.");
  }

  const hash = params.get("hash");
  if (!hash || !/^[a-f0-9]{64}$/i.test(hash)) {
    throw new Error("Hash Telegram inválido.");
  }

  params.delete("hash");

  const checkString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculatedHashHex = createHmac("sha256", secretKey)
    .update(checkString)
    .digest("hex");

  const calculatedBuffer = Buffer.from(calculatedHashHex, "hex");
  const providedBuffer = Buffer.from(hash, "hex");

  if (
    calculatedBuffer.length !== providedBuffer.length ||
    !timingSafeEqual(calculatedBuffer, providedBuffer)
  ) {
    throw new Error("Identidade Telegram não confirmada: assinatura inválida.");
  }

  const authDate = Number(params.get("auth_date"));
  if (!Number.isSafeInteger(authDate)) {
    throw new Error("auth_date ausente ou inválido.");
  }

  // Reject future timestamps with a 30s margin for clock skew
  if (authDate > now + 30) {
    throw new Error("auth_date no futuro.");
  }

  // Reject expired initData
  if (now - authDate > maxAgeSeconds) {
    throw new Error("Sessão Telegram expirada.");
  }

  // User object extraction
  const rawUserStr = params.get("user");
  if (!rawUserStr) {
    throw new Error("Usuário Telegram não encontrado no payload.");
  }

  let rawUser: unknown;
  try {
    rawUser = JSON.parse(rawUserStr);
  } catch {
    throw new Error("Formato de usuário Telegram inválido.");
  }

  if (!rawUser || typeof rawUser !== "object") {
    throw new Error("Dados de usuário Telegram inválidos.");
  }

  const u = rawUser as Record<string, unknown>;
  if (
    typeof u.id !== "number" ||
    !Number.isSafeInteger(u.id) ||
    u.id <= 0
  ) {
    throw new Error("ID de usuário Telegram inválido.");
  }

  const firstName =
    typeof u.first_name === "string" && u.first_name.trim().length > 0
      ? u.first_name.trim()
      : `Jogador ${u.id}`;

  return {
    id: u.id,
    firstName,
    lastName: typeof u.last_name === "string" ? u.last_name.trim() : undefined,
    username: typeof u.username === "string" ? u.username.trim() : undefined,
    languageCode: typeof u.language_code === "string" ? u.language_code.trim() : undefined,
    isPremium: Boolean(u.is_premium),
  };
}
