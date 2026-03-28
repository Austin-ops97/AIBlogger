import { getAppSetting } from "@/lib/db";

export const ANTHROPIC_SETTING_KEY = "anthropic_api_key";

/** Saved key in DB wins; otherwise ANTHROPIC_API_KEY from the environment. */
export async function resolveAnthropicApiKey(): Promise<string | null> {
  try {
    const fromDb = (await getAppSetting(ANTHROPIC_SETTING_KEY))?.trim();
    if (fromDb) return fromDb;
  } catch {
    /* Postgres unavailable — fall back to env only */
  }
  return process.env.ANTHROPIC_API_KEY?.trim() || null;
}

/** Short preview for the admin UI (never log or send full key to the client). */
export function maskApiKey(key: string): string {
  const k = key.trim();
  if (k.length <= 12) return "••••••••";
  return `${k.slice(0, 7)}…${k.slice(-4)}`;
}
