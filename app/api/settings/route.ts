import { NextRequest, NextResponse } from "next/server";
import {
  getAppSetting,
  setAppSetting,
  deleteAppSetting,
  getDatabaseConfigurationIssue,
} from "@/lib/db";
import {
  ANTHROPIC_SETTING_KEY,
  resolveAnthropicApiKey,
  maskApiKey,
  normalizeAnthropicApiKey,
  looksLikeAnthropicSecretKey,
} from "@/lib/anthropic-key";

export async function GET() {
  try {
    if (getDatabaseConfigurationIssue()) {
      const envKey =
        normalizeAnthropicApiKey(process.env.ANTHROPIC_API_KEY ?? "") || null;
      return NextResponse.json({
        hasDatabaseKey: false,
        hasEnvironmentKey: Boolean(envKey),
        configured: Boolean(envKey),
        maskedDatabaseKey: null,
        activeSource: envKey ? "environment" : null,
        databaseRequired:
          "Connect Postgres first to save an API key in the admin panel.",
      });
    }

    const dbKeyRaw = await getAppSetting(ANTHROPIC_SETTING_KEY);
    const dbKey = normalizeAnthropicApiKey(dbKeyRaw ?? "") || null;
    const envKey =
      normalizeAnthropicApiKey(process.env.ANTHROPIC_API_KEY ?? "") || null;
    const effective = await resolveAnthropicApiKey();

    return NextResponse.json({
      hasDatabaseKey: Boolean(dbKey),
      hasEnvironmentKey: Boolean(envKey),
      configured: Boolean(effective),
      maskedDatabaseKey: dbKey ? maskApiKey(dbKey) : null,
      activeSource: dbKey ? "database" : envKey ? "environment" : null,
    });
  } catch (e) {
    console.error("settings GET:", e);
    return NextResponse.json(
      { error: "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (getDatabaseConfigurationIssue()) {
      return NextResponse.json(
        {
          error:
            "Database is not configured. Connect Postgres before saving settings here.",
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const raw = typeof body.anthropicApiKey === "string" ? body.anthropicApiKey : "";
    const normalized = normalizeAnthropicApiKey(raw);

    if (!normalized) {
      await deleteAppSetting(ANTHROPIC_SETTING_KEY);
      return NextResponse.json({ ok: true, cleared: true });
    }

    if (!looksLikeAnthropicSecretKey(normalized)) {
      return NextResponse.json(
        {
          error:
            "That does not look like a full Anthropic secret key. In console.anthropic.com → API keys, create or copy the secret key. It must be one continuous line starting with sk-ant- (often sk-ant-api03-). Remove quotes, spaces, and line breaks.",
        },
        { status: 400 }
      );
    }

    await setAppSetting(ANTHROPIC_SETTING_KEY, normalized);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("settings PUT:", e);
    return NextResponse.json(
      { error: "Failed to save API key" },
      { status: 500 }
    );
  }
}
