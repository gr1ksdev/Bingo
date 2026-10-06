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
        valid: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Emissão de cartelas verificadas indisponível neste ambiente.",
        },
      },
      503,
    );
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  try {
    const body = await readJson(request);

    let uid: string | number = "dev-local";
    let name = "Visitante";

    // 1. Telegram authentication if initData is supplied
    if (typeof body.initData === "string" && body.initData.trim()) {
      if (!botToken) {
        return json(
          {
            valid: false,
            error: {
              code: "SERVICE_UNAVAILABLE",
              message: "Configuração do bot Telegram ausente no servidor.",
            },
          },
          503,
        );
      }
      const verifiedUser = verifyTelegramUser(body.initData, botToken);
      uid = verifiedUser.id;
      name = verifiedUser.firstName;
    } else if (botToken && process.env.NODE_ENV === "production") {
      // In production with bot configured, require Telegram Mini App
      return json(
        {
          valid: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Abra pelo Telegram para confirmar sua identidade.",
          },
        },
        401,
      );
    } else {
      // Dev local / non-Telegram environment
      if (typeof body.name === "string" && body.name.trim()) {
        name = body.name.trim().slice(0, 60);
      }
    }

    // 2. Client is NEVER the authority for card numbers; generated strictly server-side.
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
