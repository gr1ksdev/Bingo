"use client";

import type { TelegramUser, TelegramWebApp } from "./types";

function getSdk(): TelegramWebApp | undefined {
  if (typeof window === "undefined") return undefined;
  return window.Telegram?.WebApp;
}

export function isTelegramEnvironment(): boolean {
  const sdk = getSdk();
  return Boolean(
    sdk && typeof sdk.initData === "string" && sdk.initData.length > 0,
  );
}

export function getInitData(): string {
  return getSdk()?.initData ?? "";
}

/**
 * CAUTION: getUnsafeDisplayUser reads initDataUnsafe directly from client window.
 * This MUST ONLY be used for transient cosmetic UX (e.g. placeholder before server verification).
 * NEVER trust this value for authentication, authorization, or card issuing.
 * Real identity MUST ALWAYS be verified server-side via POST /api/auth/telegram or POST /api/cards/signed.
 */
export function getUnsafeDisplayUser(): TelegramUser | null {
  const rawUser = getSdk()?.initDataUnsafe?.user;
  if (!rawUser || typeof rawUser.id !== "number" || !rawUser.first_name) {
    return null;
  }
  return {
    id: rawUser.id,
    firstName: rawUser.first_name,
    lastName: rawUser.last_name,
    username: rawUser.username,
    languageCode: rawUser.language_code,
    isPremium: rawUser.is_premium,
  };
}

function impactHaptic(style: "light" | "medium" | "heavy" = "light"): void {
  try {
    getSdk()?.HapticFeedback?.impactOccurred(style);
  } catch {
    // progressive enhancement: no-op if unsupported
  }
}

function notificationHaptic(type: "error" | "success" | "warning"): void {
  try {
    getSdk()?.HapticFeedback?.notificationOccurred(type);
  } catch {
    // progressive enhancement: no-op if unsupported
  }
}

function selectionHaptic(): void {
  try {
    getSdk()?.HapticFeedback?.selectionChanged();
  } catch {
    // progressive enhancement: no-op if unsupported
  }
}

const hapticApi = Object.assign(impactHaptic, {
  impact: impactHaptic,
  notification: notificationHaptic,
  selection: selectionHaptic,
});

export const telegramClient = {
  isAvailable: () =>
    typeof window !== "undefined" && Boolean(window.Telegram?.WebApp),
  isTelegramEnvironment,
  getInitData,
  getUnsafeDisplayUser,
  init: () => {
    const sdk = getSdk();
    if (!sdk) return;
    try {
      sdk.ready?.();
      sdk.expand?.();
    } catch {
      // progressive enhancement: no-op
    }
  },
  haptic: hapticApi,
};
