import { createClient, type Client } from "@libsql/client";
import path from "path";
import fs from "fs";

let client: Client | null = null;
let initPromise: Promise<void> | null = null;

function getDatabaseUrl(): string {
  const remote =
    process.env.TURSO_DATABASE_URL || process.env.LIBSQL_DATABASE_URL;
  const onVercel = process.env.VERCEL === "1";
  if (onVercel && !remote) {
    throw new Error(
      "Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel (Project → Settings → Environment Variables). Create a free DB: https://docs.turso.tech"
    );
  }
  if (remote) return remote;
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const filePath = path.join(dataDir, "blog.db");
  return `file:${filePath}`;
}

function getClient(): Client {
  if (client) return client;
  const url = getDatabaseUrl();
  const authToken =
    process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN;
  client = createClient({
    url,
    ...(authToken ? { authToken } : {}),
  });
  return client;
}

async function ensureSchema(c: Client): Promise<void> {
  await c.execute(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT NOT NULL,
      excerpt TEXT DEFAULT '',
      source_url TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  await c.execute(
    `CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug)`
  );
  await c.execute(
    `CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at)`
  );
  if (urlIsFile(getDatabaseUrl())) {
    await c.execute("PRAGMA journal_mode = WAL");
  }
}

function urlIsFile(url: string): boolean {
  return url.startsWith("file:");
}

async function ensureReady(): Promise<Client> {
  const c = getClient();
  if (!initPromise) {
    initPromise = ensureSchema(c);
  }
  await initPromise;
  return c;
}

function rowToPost(row: Record<string, unknown>): Post {
  return {
    id: Number(row.id),
    title: String(row.title),
    slug: String(row.slug),
    content: String(row.content),
    excerpt: row.excerpt != null ? String(row.excerpt) : "",
    source_url: row.source_url != null ? String(row.source_url) : "",
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
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
  const c = await ensureReady();
  const rs = await c.execute(
    "SELECT * FROM posts ORDER BY created_at DESC"
  );
  return rs.rows.map((row) => rowToPost(row as Record<string, unknown>));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const c = await ensureReady();
  const rs = await c.execute({
    sql: "SELECT * FROM posts WHERE slug = ?",
    args: [slug],
  });
  const row = rs.rows[0];
  return row ? rowToPost(row as Record<string, unknown>) : null;
}

export async function getPostById(id: number): Promise<Post | null> {
  const c = await ensureReady();
  const rs = await c.execute({
    sql: "SELECT * FROM posts WHERE id = ?",
    args: [id],
  });
  const row = rs.rows[0];
  return row ? rowToPost(row as Record<string, unknown>) : null;
}

export async function isSlugTaken(slug: string): Promise<boolean> {
  const c = await ensureReady();
  const rs = await c.execute({
    sql: "SELECT id FROM posts WHERE slug = ?",
    args: [slug],
  });
  return rs.rows.length > 0;
}

export async function createPost(data: {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  source_url?: string;
}): Promise<Post> {
  const c = await ensureReady();
  const rs = await c.execute({
    sql: `INSERT INTO posts (title, slug, content, excerpt, source_url)
          VALUES (?, ?, ?, ?, ?)`,
    args: [
      data.title,
      data.slug,
      data.content,
      data.excerpt,
      data.source_url || "",
    ],
  });
  const id = Number(rs.lastInsertRowid);
  const post = await getPostById(id);
  if (!post) throw new Error("Failed to load post after insert");
  return post;
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
  const c = await ensureReady();
  const fields = entries.map(([k]) => `${k} = ?`).join(", ");
  const values = entries.map(([, v]) => v);
  await c.execute({
    sql: `UPDATE posts SET ${fields}, updated_at = datetime('now') WHERE id = ?`,
    args: [...values, id],
  });
  return getPostById(id);
}

export async function deletePost(id: number): Promise<void> {
  const c = await ensureReady();
  await c.execute({ sql: "DELETE FROM posts WHERE id = ?", args: [id] });
}
