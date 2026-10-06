import { json } from "@/lib/server/request";
import { getSigningSecret } from "@/lib/server/signing";

export const runtime = "nodejs";

/**
 * Health & Configuration diagnostic endpoint.
 * Informs deployment readiness without leaking any secret values or material.
 */
export async function GET() {
  const secret = getSigningSecret();
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  const signingConfigured = Boolean(secret && secret.length >= 32);
  const telegramConfigured = Boolean(botToken && botToken.length >= 10);

  return json({
    ok: true,
    status: signingConfigured && telegramConfigured ? "healthy" : "degraded",
    signingConfigured,
    telegramConfigured,
  });
}
