import { verifyTelegramUser } from "@/lib/server/telegram";
import { json, readJson } from "@/lib/server/request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return json(
      {
        ok: false,
        authenticated: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Autenticação Telegram indisponível neste ambiente.",
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
          authenticated: false,
          error: {
            code: "MISSING_INIT_DATA",
            message: "Parâmetro initData ausente.",
          },
        },
        400,
      );
    }

    const user = verifyTelegramUser(body.initData, botToken);
    return json({
      ok: true,
      authenticated: true,
      user,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Identidade Telegram não confirmada.";
    return json(
      {
        ok: false,
        authenticated: false,
        error: {
          code: "INVALID_INIT_DATA",
          message,
        },
      },
      400,
    );
  }
}
