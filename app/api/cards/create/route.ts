import { generateCard } from "@/lib/bingo/generate-card";
import { getSigningSecret, signCard } from "@/lib/server/signing";
import { verifyTelegramUser } from "@/lib/server/telegram";
import { json, readJson } from "@/lib/server/request";
import type { SignedCard } from "@/lib/bingo/token/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = getSigningSecret();
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!secret || !botToken) {
    return json(
      {
        ok: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Cartelas verificadas indisponíveis neste ambiente.",
        },
      },
      503,
    );
  }

  try {
    const body = await readJson(request);
    if (typeof body.initData !== "string" || !body.initData.trim()) {
      return json(
        {
          ok: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Abra pelo Telegram para confirmar sua identidade.",
          },
        },
        401,
      );
    }

    const verifiedUser = verifyTelegramUser(body.initData, botToken);
    const name = verifiedUser.lastName
      ? `${verifiedUser.firstName} ${verifiedUser.lastName}`.trim().slice(0, 60)
      : verifiedUser.firstName.trim().slice(0, 60);
    const card: SignedCard = {
      v: 1,
      uid: verifiedUser.id,
      gid: "local",
      cid: crypto.randomUUID(),
      nums: generateCard(),
      iat: Math.floor(Date.now() / 1000),
      name,
    };

    return json({
      ok: true,
      token: signCard(card, secret),
      card,
      scope: "local",
      notice:
        "Identidade verificada; não representa inscrição em uma partida remota.",
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Não foi possível confirmar a sessão Telegram ou os dados enviados.";
    return json(
      {
        ok: false,
        error: {
          code: "INVALID_REQUEST",
          message,
        },
      },
      400,
    );
  }
}
