import Link from "next/link";

export default function DeploymentDbNotice({ message }: { message: string }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-950 shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Postgres not connected</h2>
        <p className="text-sm text-amber-900/90 mb-4">{message}</p>
        <ol className="list-decimal list-inside text-sm space-y-2 text-amber-900/85 mb-4">
          <li>
            In the{" "}
            <a
              href="https://vercel.com/docs/storage/vercel-postgres"
              className="text-indigo-600 underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              Vercel dashboard
            </a>
            : open this project → <strong>Storage</strong> → create or connect{" "}
            <strong>Postgres</strong> (hosted on Vercel’s Neon integration).
          </li>
          <li>
            Link the database to this project so{" "}
            <code className="rounded bg-amber-100/80 px-1.5 py-0.5 text-xs">
              POSTGRES_URL
            </code>{" "}
            appears under <strong>Settings → Environment Variables</strong>.
          </li>
          <li>Redeploy so the new variables are available to the app.</li>
        </ol>
        <p className="text-sm text-amber-900/80">
          Local dev: run <code className="text-xs">vercel env pull</code> after
          connecting Storage, or set <code className="text-xs">POSTGRES_URL</code>{" "}
          to any Postgres connection string in <code className="text-xs">.env.local</code>.
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
