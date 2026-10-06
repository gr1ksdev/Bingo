import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
/** Telegram HMAC verification; uid only returned after integrity and freshness checks. */
export function verifyTelegramInitData(
  initData: string,
  botToken: string,
  now = Math.floor(Date.now() / 1000),
): number {
  if (!initData || initData.length > 8192)
    throw new Error("Identidade Telegram inválida.");
  const params = new URLSearchParams(initData);
  if (new Set(params.keys()).size !== [...params.keys()].length)
    throw new Error("Campos duplicados.");
  const hash = params.get("hash") ?? "";
  if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error("Hash Telegram inválido.");
  params.delete("hash");
  const check = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const key = createHmac("sha256", "WebAppData").update(botToken).digest();
  const expected = createHmac("sha256", key).update(check).digest();
  if (!timingSafeEqual(expected, Buffer.from(hash, "hex")))
    throw new Error("Identidade Telegram não confirmada.");
  const date = Number(params.get("auth_date"));
  if (!Number.isSafeInteger(date) || date > now + 30 || now - date > 300)
    throw new Error("Sessão Telegram expirada.");
  let user: unknown;
  try {
    user = JSON.parse(params.get("user") ?? "null");
  } catch {
    throw new Error("Usuário inválido.");
  }
  if (
    !user ||
    typeof user !== "object" ||
    !("id" in user) ||
    typeof user.id !== "number" ||
    !Number.isSafeInteger(user.id) ||
    user.id <= 0
  )
    throw new Error("Usuário inválido.");
  return user.id;
}
