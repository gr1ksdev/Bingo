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
      { error: "Cartelas verificadas indisponíveis neste ambiente." },
      503,
    );
  }

  try {
    const body = await readJson(request);
    if (typeof body.initData !== "string") {
      return json(
        { error: "Abra pelo Telegram para confirmar sua identidade." },
        401,
      );
    }

    const verifiedUser = verifyTelegramUser(body.initData, botToken);
    const card: SignedCard = {
      v: 1,
      uid: verifiedUser.id,
      gid: "local",
      cid: crypto.randomUUID(),
      nums: generateCard(),
      iat: Math.floor(Date.now() / 1000),
      name: verifiedUser.firstName,
    };

    return json({
      token: signCard(card, secret),
      scope: "local",
      notice:
        "Identidade verificada; não representa inscrição em uma partida remota.",
    });
  } catch {
    return json(
      {
        error:
          "Não foi possível confirmar a sessão Telegram ou os dados enviados.",
      },
      400,
    );
  }
}
