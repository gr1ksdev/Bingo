"use client";

import type {
  TelegramDiagnosticInfo,
  TelegramUser,
  TelegramWebApp,
} from "./types";

function getSdk(): TelegramWebApp | undefined {
  if (typeof window === "undefined") return undefined;
  return window.Telegram?.WebApp;
}

/**
 * Retrieves the candidate Telegram initData string.
 * Priority:
 * 1. Official SDK: window.Telegram.WebApp.initData
 * 2. URL hash fallback: #tgWebAppData=... (as provided by Telegram clients when opening WebApps)
 * 3. URL search fallback: ?tgWebAppData=...
 * 4. sessionStorage fallback: initParams.tgWebAppData
 *
 * NOTE: Any extracted initData is purely a candidate token until verified
 * server-side via HMAC-SHA256 with TELEGRAM_BOT_TOKEN.
 */
export function getInitData(): string {
  if (typeof window === "undefined") return "";

  // 1. Official Telegram WebApp SDK
  const sdkInitData = getSdk()?.initData;
  if (typeof sdkInitData === "string" && sdkInitData.trim().length > 0) {
    return sdkInitData.trim();
  }

  // 2. Location hash fallback (#tgWebAppData=...)
  try {
    if (window.location.hash) {
      const hashStr = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const params = new URLSearchParams(hashStr);
      const data = params.get("tgWebAppData");
      if (typeof data === "string" && data.trim().length > 0) {
        return data.trim();
      }
    }
  } catch {}

  // 3. Location search fallback (?tgWebAppData=...)
  try {
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const data = params.get("tgWebAppData");
      if (typeof data === "string" && data.trim().length > 0) {
        return data.trim();
      }
    }
  } catch {}

  // 4. SessionStorage fallback (used by telegram-web-app.js across internal navigations)
  try {
    const rawStored = window.sessionStorage?.getItem("initParams");
    if (rawStored) {
      const parsed = JSON.parse(rawStored);
      if (
        parsed &&
        typeof parsed.tgWebAppData === "string" &&
        parsed.tgWebAppData.trim().length > 0
      ) {
        return parsed.tgWebAppData.trim();
      }
    }
  } catch {}

  return "";
}

/**
 * Checks if the current page was opened within a Telegram WebApp environment
 * (either with Telegram SDK loaded, initData present, or Telegram hash/search markers).
 */
export function isTelegramEnvironment(): boolean {
  if (typeof window === "undefined") return false;
  if (getInitData().length > 0) return true;
  if (Boolean(window.Telegram?.WebApp)) return true;
  try {
    if (window.location.hash && window.location.hash.includes("tgWebApp")) {
      return true;
    }
    if (window.location.search && window.location.search.includes("tgWebApp")) {
      return true;
    }
  } catch {}
  return false;
}

/**
 * Diagnostic helper for troubleshooting Telegram environment without leaking
 * initData, hashes, or credentials.
 */
export function getDiagnosticInfo(): TelegramDiagnosticInfo {
  if (typeof window === "undefined") {
    return {
      telegramGlobalAvailable: false,
      webAppAvailable: false,
      initDataPresent: false,
      initDataLength: 0,
      platform: null,
      version: null,
      hasLocationHashInitData: false,
      hasLocationSearchInitData: false,
      hasSessionStorageInitData: false,
    };
  }

  const tg = window.Telegram;
  const webApp = tg?.WebApp;
  const initData = getInitData();

  let hasHash = false;
  let hasSearch = false;
  let hasSession = false;

  try {
    if (window.location.hash) {
      const p = new URLSearchParams(
        window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : window.location.hash,
      );
      hasHash = Boolean(p.get("tgWebAppData"));
    }
  } catch {}

  try {
    if (window.location.search) {
      const p = new URLSearchParams(window.location.search);
      hasSearch = Boolean(p.get("tgWebAppData"));
    }
  } catch {}

  try {
    const rawStored = window.sessionStorage?.getItem("initParams");
    if (rawStored) {
      const parsed = JSON.parse(rawStored);
      hasSession = Boolean(parsed?.tgWebAppData);
    }
  } catch {}

  return {
    telegramGlobalAvailable: Boolean(tg),
    webAppAvailable: Boolean(webApp),
    initDataPresent: Boolean(initData && initData.length > 0),
    initDataLength: initData ? initData.length : 0,
    platform: webApp?.platform ?? null,
    version: webApp?.version ?? null,
    hasLocationHashInitData: hasHash,
    hasLocationSearchInitData: hasSearch,
    hasSessionStorageInitData: hasSession,
  };
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
  const firstName = rawUser.first_name.trim();
  const lastName = rawUser.last_name?.trim();
  const displayName = lastName ? `${firstName} ${lastName}`.trim() : firstName;

  return {
    id: rawUser.id,
    firstName,
    lastName,
    username: rawUser.username?.trim(),
    languageCode: rawUser.language_code?.trim(),
    isPremium: rawUser.is_premium,
    displayName,
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
  getDiagnosticInfo,
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
