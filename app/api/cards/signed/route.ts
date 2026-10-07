import { generateCard } from "@/lib/bingo/generate-card";
import { getSigningSecret, signCard } from "@/lib/server/signing";
import { verifyTelegramUser } from "@/lib/server/telegram";
import { json, readJson } from "@/lib/server/request";
import type { SignedCard } from "@/lib/bingo/token/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = getSigningSecret();
  if (!secret) {
    return json(
      {
        ok: false,
        valid: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Emissão de cartelas verificadas indisponível neste ambiente.",
        },
      },
      503,
    );
  }

  const isProduction = process.env.NODE_ENV === "production";
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  // In production, TELEGRAM_BOT_TOKEN must be configured
  if (isProduction && (!botToken || botToken.length < 10)) {
    return json(
      {
        ok: false,
        valid: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Configuração do bot Telegram ausente no servidor.",
        },
      },
      503,
    );
  }

  try {
    const body = await readJson(request);

    let uid: string | number;
    let name = "Visitante";

    const hasInitData =
      typeof body.initData === "string" && body.initData.trim().length > 0;

    if (hasInitData) {
      if (!botToken) {
        return json(
          {
            ok: false,
            valid: false,
            error: {
              code: "SERVICE_UNAVAILABLE",
              message: "Configuração do bot Telegram ausente no servidor.",
            },
          },
          503,
        );
      }

      try {
        const verifiedUser = verifyTelegramUser(body.initData as string, botToken);
        uid = verifiedUser.id;
        name = verifiedUser.lastName
          ? `${verifiedUser.firstName} ${verifiedUser.lastName}`.trim().slice(0, 60)
          : verifiedUser.firstName.trim().slice(0, 60);
      } catch (authErr) {
        const message =
          authErr instanceof Error
            ? authErr.message
            : "Identidade Telegram não confirmada.";
        return json(
          {
            ok: false,
            valid: false,
            error: {
              code: "UNAUTHORIZED",
              message,
            },
          },
          401,
        );
      }
    } else {
      // Missing initData:
      // In production, strictly reject with 401 Unauthorized - NEVER allow dev-local fallback in production!
      if (isProduction) {
        return json(
          {
            ok: false,
            valid: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Abra pelo Telegram para emitir cartela verificada.",
            },
          },
          401,
        );
      }

      // Explicit DEV mode only (when NODE_ENV !== "production"):
      uid = "dev-local";
      if (typeof body.name === "string" && body.name.trim()) {
        name = body.name.trim().slice(0, 60);
      } else {
        name = "Visitante DEV";
      }
    }

    // Client-supplied uid is strictly ignored; uid is solely derived from verified Telegram session or dev-local.
    // Server is the sole authority for card numbers.
    const card: SignedCard = {
      v: 1,
      cid: crypto.randomUUID(),
      gid: "local",
      nums: generateCard(),
      iat: Math.floor(Date.now() / 1000),
      uid,
      name,
    };

    const token = signCard(card, secret);

    return json({
      ok: true,
      valid: true,
      token,
      card,
      scope: "local",
      notice:
        "Cartela assinada pelo servidor; não representa inscrição em uma partida remota.",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Dados da requisição inválidos.";
    return json(
      {
        ok: false,
        valid: false,
        error: {
          code: "INVALID_REQUEST",
          message,
        },
      },
      400,
    );
  }
}
