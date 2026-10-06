"use client";
type TelegramWebApp = {
  initData?: string;
  ready?: () => void;
  expand?: () => void;
  HapticFeedback?: { impactOccurred: (style: "light") => void };
};
function sdk(): TelegramWebApp | undefined {
  if (typeof window === "undefined") return;
  return (window as Window & { Telegram?: { WebApp?: TelegramWebApp } })
    .Telegram?.WebApp;
}
export const telegram = {
  init: () => {
    sdk()?.ready?.();
    sdk()?.expand?.();
  },
  getInitData: () => sdk()?.initData ?? "",
  // Opt-in, only call in response to a gesture; no automatic audio or vibration.
  haptic: () => sdk()?.HapticFeedback?.impactOccurred("light"),
};
