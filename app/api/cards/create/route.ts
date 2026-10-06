import { generateCard } from "@/lib/bingo/generate-card";
import { getSigningSecret, signCard } from "@/lib/server/signing";
import { verifyTelegramInitData } from "@/lib/server/telegram";
import { json, readJson } from "@/lib/server/request";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const secret = getSigningSecret();
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!secret || !botToken)
    return json(
      { error: "Cartelas verificadas indisponíveis neste ambiente." },
      503,
    );
  try {
    const body = await readJson(request);
    if (typeof body.initData !== "string")
      return json(
        { error: "Abra pelo Telegram para confirmar sua identidade." },
        401,
      );
    const uid = verifyTelegramInitData(body.initData, botToken);
    // No trusted shared game exists yet; never accept a client-supplied game ID or numbers.
    const card = {
      v: 1 as const,
      uid,
      gid: "local",
      cid: crypto.randomUUID(),
      nums: generateCard(),
      iat: Math.floor(Date.now() / 1000),
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
