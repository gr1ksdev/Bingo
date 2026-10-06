import "server-only";
import { verifyTelegramInitData as verifyUser } from "@/lib/telegram/auth.server";
import type { VerifyTelegramOptions } from "@/lib/telegram/types";

export { verifyUser as verifyTelegramUser };

/**
 * Validates Telegram initData and returns the authenticated user's ID.
 * Preserves backwards-compatibility for existing tests and call sites.
 */
export function verifyTelegramInitData(
  initData: string,
  botToken: string,
  nowOrOptions?: number | VerifyTelegramOptions,
): number {
  const options =
    typeof nowOrOptions === "number" ? { now: nowOrOptions } : nowOrOptions;
  const user = verifyUser(initData, botToken, options);
  return user.id;
}
