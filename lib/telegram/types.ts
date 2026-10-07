export type TelegramUser = {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
  isPremium?: boolean;
  displayName?: string;
};

export type VerifyTelegramOptions = {
  maxAgeSeconds?: number;
  now?: number;
};

export type TelegramAuthState =
  | "BROWSER"
  | "TELEGRAM_INITIALIZING"
  | "TELEGRAM_UNAUTHENTICATED"
  | "TELEGRAM_AUTHENTICATING"
  | "TELEGRAM_AUTHENTICATED"
  | "TELEGRAM_AUTH_ERROR";

export type TelegramDiagnosticInfo = {
  telegramGlobalAvailable: boolean;
  webAppAvailable: boolean;
  initDataPresent: boolean;
  initDataLength: number;
  platform: string | null;
  version: string | null;
  hasLocationHashInitData: boolean;
  hasLocationSearchInitData: boolean;
  hasSessionStorageInitData: boolean;
};

export type TelegramWebApp = {
  initData?: string;
  initDataUnsafe?: {
    query_id?: string;
    user?: {
      id?: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      is_premium?: boolean;
    };
    auth_date?: number;
    hash?: string;
  };
  version?: string;
  platform?: string;
  ready?: () => void;
  expand?: () => void;
  close?: () => void;
  HapticFeedback?: {
    impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
    selectionChanged: () => void;
  };
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
    TelegramWebviewProxy?: {
      postEvent?: (eventType: string, eventData: string) => void;
    };
  }
}
