import { Pool } from "@neondatabase/serverless";

let pool: Pool | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Neon + Vercel templates often add channel_binding=require. The serverless
 * Pool (node-postgres over WebSockets) commonly fails with that param; strip it.
 */
function normalizeConnectionString(raw: string): string {
  const s = raw.trim();
  if (!s) return s;
  try {
    const u = new URL(s);
    u.searchParams.delete("channel_binding");
    if (!u.searchParams.has("sslmode")) {
      u.searchParams.set("sslmode", "require");
    }
    return u.toString();
  } catch {
    return s.replace(/([?&])channel_binding=[^&]*&?/g, "$1").replace(/\?&/, "?").replace(/&&/g, "&").replace(/[?&]$/, "");
  }
}

/** Vercel Postgres / Neon injects one of these when Storage is connected. */
export function getPostgresConnectionString(): string {
  return (
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL ||
    ""
  ).trim();
}

/** Returns null when Postgres is configured; otherwise a short setup message. */
export function getDatabaseConfigurationIssue(): string | null {
  if (getPostgresConnectionString()) return null;
  if (process.env.VERCEL === "1") {
    return "Connect Vercel Postgres: Vercel dashboard → this project → Storage → Create / connect Postgres. That adds POSTGRES_URL automatically; then redeploy.";
  }
  return "Set POSTGRES_URL or DATABASE_URL in .env.local (run `vercel env pull` after connecting Storage on Vercel, or use a local Postgres URL).";
}

function getPool(): Pool {
  const raw = getPostgresConnectionString();
  if (!raw) {
    throw new Error(
      getDatabaseConfigurationIssue() || "Database is not configured."
    );
  }
  const conn = normalizeConnectionString(raw);
  if (!pool) {
    pool = new Pool({ connectionString: conn });
  }
  return pool;
}

async function ensureSchema(): Promise<void> {
  const p = getPool();
  await p.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT NOT NULL,
      excerpt TEXT DEFAULT '',
      source_url TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await p.query(
    `CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug)`
  );
  await p.query(
    `CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)`
  );
}

async function ensureReady(): Promise<Pool> {
  if (!initPromise) {
    initPromise = ensureSchema();
  }
  await initPromise;
  return getPool();
}

function ts(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return String(value ?? "");
}

function rowToPost(row: Record<string, unknown>): Post {
  return {
    id: Number(row.id),
    title: String(row.title),
    slug: String(row.slug),
    content: String(row.content),
    excerpt: row.excerpt != null ? String(row.excerpt) : "",
    source_url: row.source_url != null ? String(row.source_url) : "",
    created_at: ts(row.created_at),
    updated_at: ts(row.updated_at),
  };
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  source_url: string;
  created_at: string;
  updated_at: string;
}

export async function getAllPosts(): Promise<Post[]> {
  const p = await ensureReady();
  const { rows } = await p.query(
    "SELECT * FROM posts ORDER BY created_at DESC"
  );
  return rows.map((row) => rowToPost(row as Record<string, unknown>));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const p = await ensureReady();
  const { rows } = await p.query("SELECT * FROM posts WHERE slug = $1", [
    slug,
  ]);
  const row = rows[0];
  return row ? rowToPost(row as Record<string, unknown>) : null;
}

export async function getPostById(id: number): Promise<Post | null> {
  const p = await ensureReady();
  const { rows } = await p.query("SELECT * FROM posts WHERE id = $1", [id]);
  const row = rows[0];
  return row ? rowToPost(row as Record<string, unknown>) : null;
}

export async function isSlugTaken(slug: string): Promise<boolean> {
  const p = await ensureReady();
  const { rows } = await p.query(
    "SELECT id FROM posts WHERE slug = $1 LIMIT 1",
    [slug]
  );
  return rows.length > 0;
}

export async function createPost(data: {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  source_url?: string;
}): Promise<Post> {
  const p = await ensureReady();
  const { rows } = await p.query(
    `INSERT INTO posts (title, slug, content, excerpt, source_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      data.title,
      data.slug,
      data.content,
      data.excerpt,
      data.source_url || "",
    ]
  );
  const row = rows[0];
  if (!row) throw new Error("Failed to load post after insert");
  return rowToPost(row as Record<string, unknown>);
}

export async function updatePost(
  id: number,
  data: Partial<{
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    source_url: string;
  }>
): Promise<Post | null> {
  const existing = await getPostById(id);
  if (!existing) return null;
  const allowed = [
    "title",
    "slug",
    "content",
    "excerpt",
    "source_url",
  ] as const;
  const entries = allowed
    .filter((k) => data[k] !== undefined)
    .map((k) => [k, data[k]!] as const);
  if (entries.length === 0) return existing;

  const p = await ensureReady();
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  for (const [col, val] of entries) {
    sets.push(`${col} = $${i}`);
    values.push(val);
    i++;
  }
  values.push(id);
  await p.query(
    `UPDATE posts SET ${sets.join(", ")}, updated_at = NOW() WHERE id = $${i}`,
    values
  );
  return getPostById(id);
}

export async function deletePost(id: number): Promise<void> {
  const p = await ensureReady();
  await p.query("DELETE FROM posts WHERE id = $1", [id]);
}
