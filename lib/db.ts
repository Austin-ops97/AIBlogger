import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let sql: NeonQueryFunction<false, false> | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Neon + Vercel templates often add channel_binding=require. Stripping it keeps
 * URLs compatible across clients (HTTP driver is tolerant either way).
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

/**
 * Neon / Vercel: DATABASE_URL is the primary var (see Neon + Next.js guide).
 * POSTGRES_* are also set when Storage is connected.
 */
export function getPostgresConnectionString(): string {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    ""
  ).trim();
}

/** Returns null when Postgres is configured; otherwise a short setup message. */
export function getDatabaseConfigurationIssue(): string | null {
  if (getPostgresConnectionString()) return null;
  if (process.env.VERCEL === "1") {
    return "Connect Neon Postgres: Vercel → this project → Storage → Neon, link the database, then redeploy.";
  }
  return "Set DATABASE_URL or POSTGRES_URL in .env.local (run: vercel env pull .env.development.local).";
}

function getSql(): NeonQueryFunction<false, false> {
  const raw = getPostgresConnectionString();
  if (!raw) {
    throw new Error(
      getDatabaseConfigurationIssue() || "Database is not configured."
    );
  }
  const conn = normalizeConnectionString(raw);
  if (!sql) {
    sql = neon(conn);
  }
  return sql;
}

async function ensureSchema(): Promise<void> {
  const q = getSql();
  await q.query(`
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
  await q.query(
    `CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug)`
  );
  await q.query(
    `CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)`
  );
  await q.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function getAppSetting(key: string): Promise<string | null> {
  const q = await ensureReady();
  const rows = await q.query(
    "SELECT value FROM app_settings WHERE key = $1",
    [key]
  );
  const row = rows[0] as { value?: string } | undefined;
  return row?.value ?? null;
}

export async function setAppSetting(key: string, value: string): Promise<void> {
  const q = await ensureReady();
  await q.query(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET
       value = EXCLUDED.value,
       updated_at = NOW()`,
    [key, value]
  );
}

export async function deleteAppSetting(key: string): Promise<void> {
  const q = await ensureReady();
  await q.query("DELETE FROM app_settings WHERE key = $1", [key]);
}

async function ensureReady(): Promise<NeonQueryFunction<false, false>> {
  if (!initPromise) {
    initPromise = ensureSchema();
  }
  await initPromise;
  return getSql();
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
  const q = await ensureReady();
  const rows = await q.query("SELECT * FROM posts ORDER BY created_at DESC");
  return rows.map((row) => rowToPost(row as Record<string, unknown>));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const q = await ensureReady();
  const rows = await q.query("SELECT * FROM posts WHERE slug = $1", [slug]);
  const row = rows[0];
  return row ? rowToPost(row as Record<string, unknown>) : null;
}

export async function getPostById(id: number): Promise<Post | null> {
  const q = await ensureReady();
  const rows = await q.query("SELECT * FROM posts WHERE id = $1", [id]);
  const row = rows[0];
  return row ? rowToPost(row as Record<string, unknown>) : null;
}

export async function isSlugTaken(slug: string): Promise<boolean> {
  const q = await ensureReady();
  const rows = await q.query(
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
  const q = await ensureReady();
  const rows = await q.query(
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

  const q = await ensureReady();
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  for (const [col, val] of entries) {
    sets.push(`${col} = $${i}`);
    values.push(val);
    i++;
  }
  values.push(id);
  await q.query(
    `UPDATE posts SET ${sets.join(", ")}, updated_at = NOW() WHERE id = $${i}`,
    values
  );
  return getPostById(id);
}

export async function deletePost(id: number): Promise<void> {
  const q = await ensureReady();
  await q.query("DELETE FROM posts WHERE id = $1", [id]);
}
