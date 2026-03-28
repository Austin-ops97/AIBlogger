import Link from "next/link";

export default function DeploymentDbNotice({ message }: { message: string }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-950 shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Database not configured on Vercel</h2>
        <p className="text-sm text-amber-900/90 mb-4">{message}</p>
        <ol className="list-decimal list-inside text-sm space-y-2 text-amber-900/85 mb-4">
          <li>
            Create a free database with{" "}
            <a
              href="https://docs.turso.tech/quickstart"
              className="text-indigo-600 underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              Turso
            </a>
            .
          </li>
          <li>
            In Vercel: <strong>Project → Settings → Environment Variables</strong>, add{" "}
            <code className="rounded bg-amber-100/80 px-1.5 py-0.5 text-xs">
              TURSO_DATABASE_URL
            </code>{" "}
            and{" "}
            <code className="rounded bg-amber-100/80 px-1.5 py-0.5 text-xs">
              TURSO_AUTH_TOKEN
            </code>{" "}
            (from <code className="text-xs">turso db tokens create</code>).
          </li>
          <li>Redeploy the project so the new variables load.</li>
        </ol>
        <p className="text-sm text-amber-900/80">
          See <code className="text-xs">.env.example</code> in the repo for other optional variables.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            ← Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
