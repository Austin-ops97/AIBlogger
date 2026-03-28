"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SettingsState = {
  hasDatabaseKey: boolean;
  hasEnvironmentKey: boolean;
  configured: boolean;
  maskedDatabaseKey: string | null;
  activeSource: "database" | "environment" | null;
  databaseRequired?: string;
};

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [info, setInfo] = useState<SettingsState | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");
        if (!cancelled) setInfo(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anthropicApiKey: apiKeyInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSuccess(
        data.cleared
          ? "Saved key removed. The app will use the environment variable if set."
          : "API key saved. AI Review will use this key."
      );
      setApiKeyInput("");
      const r = await fetch("/api/settings");
      const next = await r.json();
      if (r.ok) setInfo(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Link
        href="/admin"
        className="text-sm text-slate-500 hover:text-indigo-600 mb-6 inline-block"
      >
        ← Admin dashboard
      </Link>

      <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
      <p className="text-slate-500 text-sm mb-4">
        Anthropic API key for <strong>AI Review</strong>. Stored in your database;
        only admins can change it.
      </p>
      <ul className="text-xs text-slate-500 space-y-1 mb-8 list-disc list-inside">
        <li>
          Use the <strong>secret</strong> key from{" "}
          <a
            href="https://console.anthropic.com/settings/keys"
            className="text-indigo-600 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            console.anthropic.com → API keys
          </a>{" "}
          (not a publishable key).
        </li>
        <li>
          It must be the <strong>full</strong> key in <strong>one line</strong>, usually starting with{" "}
          <code className="bg-slate-100 px-1 rounded">sk-ant-api03-</code>.
        </li>
        <li>Paste exactly what Anthropic shows — no quotes, spaces, or line breaks in the middle.</li>
      </ul>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : (
        <>
          {info?.databaseRequired && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
              {info.databaseRequired}
            </p>
          )}
          {info && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 mb-6 text-sm space-y-2">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">AI ready</span>
                <span
                  className={
                    info.configured
                      ? "font-medium text-emerald-600"
                      : "font-medium text-amber-600"
                  }
                >
                  {info.configured ? "Yes" : "No — add a key below or in env"}
                </span>
              </div>
              {info.activeSource && (
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Active source</span>
                  <span className="font-medium text-slate-800">
                    {info.activeSource === "database"
                      ? "Key saved here (admin)"
                      : "ANTHROPIC_API_KEY (environment)"}
                  </span>
                </div>
              )}
              {info.hasDatabaseKey && info.maskedDatabaseKey && (
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Saved key</span>
                  <code className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                    {info.maskedDatabaseKey}
                  </code>
                </div>
              )}
              {info.hasEnvironmentKey && (
                <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
                  Environment variable is set. A key saved here overrides it until you clear
                  the saved key.
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label
                htmlFor="anthropic-key"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Anthropic API key
              </label>
              <textarea
                id="anthropic-key"
                autoComplete="off"
                spellCheck={false}
                rows={3}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="sk-ant-api03-… (paste full key, one line)"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y min-h-[5rem]"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Leave empty and save to remove the stored key and fall back to{" "}
                <code className="text-[11px]">ANTHROPIC_API_KEY</code> on the server.
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={saving || Boolean(info?.databaseRequired)}
              className="bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Save key"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
