export const CHATBOT_PUBLIC_ID_PATTERN = /^bot_[A-Za-z0-9_-]{12}$/;

export const WIDGET_CONFIG = {
  maxWelcomeMessageLength: 240,
  defaultAccentColor: "#111827",
} as const;

export function normalizeAccentColor(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value)
    ? value
    : WIDGET_CONFIG.defaultAccentColor;
}
