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
} from "@/lib/anthropic-key";

export async function GET() {
  try {
    if (getDatabaseConfigurationIssue()) {
      const envKey = process.env.ANTHROPIC_API_KEY?.trim() || null;
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

    const dbKey = (await getAppSetting(ANTHROPIC_SETTING_KEY))?.trim() || null;
    const envKey = process.env.ANTHROPIC_API_KEY?.trim() || null;
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

    if (!raw.trim()) {
      await deleteAppSetting(ANTHROPIC_SETTING_KEY);
      return NextResponse.json({ ok: true, cleared: true });
    }

    await setAppSetting(ANTHROPIC_SETTING_KEY, raw.trim());
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("settings PUT:", e);
    return NextResponse.json(
      { error: "Failed to save API key" },
      { status: 500 }
    );
  }
}
