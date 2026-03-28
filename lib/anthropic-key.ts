import { getAppSetting } from "@/lib/db";

export const ANTHROPIC_SETTING_KEY = "anthropic_api_key";

/**
 * Clean pasted keys: trim, strip wrapping quotes, remove line breaks/spaces,
 * and invisible Unicode (common when copying from email or PDF).
 */
export function normalizeAnthropicApiKey(input: string): string {
  if (typeof input !== "string") return "";
  let s = input.trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  s = s.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "");
  s = s.replace(/\s+/g, "");
  return s;
}

/** Anthropic secret keys are one line and start with sk-ant- (e.g. sk-ant-api03-...). */
export function looksLikeAnthropicSecretKey(key: string): boolean {
  const k = normalizeAnthropicApiKey(key);
  if (k.length < 24) return false;
  return k.startsWith("sk-ant-");
}

/** Saved key in DB wins; otherwise ANTHROPIC_API_KEY from the environment. */
export async function resolveAnthropicApiKey(): Promise<string | null> {
  try {
    const raw = await getAppSetting(ANTHROPIC_SETTING_KEY);
    const fromDb = normalizeAnthropicApiKey(raw ?? "");
    if (fromDb) return fromDb;
  } catch {
    /* Postgres unavailable — fall back to env only */
  }
  const fromEnv = normalizeAnthropicApiKey(process.env.ANTHROPIC_API_KEY ?? "");
  return fromEnv || null;
}

/** Short preview for the admin UI (never log or send full key to the client). */
export function maskApiKey(key: string): string {
  const k = normalizeAnthropicApiKey(key);
  if (k.length <= 12) return "••••••••";
  return `${k.slice(0, 7)}…${k.slice(-4)}`;
}
