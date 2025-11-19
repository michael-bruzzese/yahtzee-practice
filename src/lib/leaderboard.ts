import { Pool } from "pg";

export type ScoreEntry = {
  id: string;
  name: string;
  score: number;
  createdAt: string;
};

const inMemory: ScoreEntry[] = [];

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  "";

let pool: Pool | null = null;

const ensurePool = () => {
  if (!connectionString) return null;
  if (!pool) {
    pool = new Pool({ connectionString, ssl: connectionString.includes("neon.tech") ? { rejectUnauthorized: false } : undefined });
  }
  return pool;
};

const ensureTable = async () => {
  const client = ensurePool();
  if (!client) return;
  await client.query(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      score INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
};

export async function getTopScores(limit = 20): Promise<ScoreEntry[]> {
  const client = ensurePool();
  if (!client) {
    return inMemory.slice(0, limit);
  }

  await ensureTable();
  const res = await client.query(
    "SELECT id, name, score, created_at as \"createdAt\" FROM leaderboard ORDER BY score DESC, created_at ASC LIMIT $1",
    [limit]
  );
  return res.rows.map((row) => ({
    id: row.id?.toString(),
    name: row.name,
    score: Number(row.score),
    createdAt: row.createdAt.toISOString?.() || new Date(row.createdAt).toISOString(),
  }));
}

export async function saveScores(
  entries: { name: string; score: number }[],
  limit = 20
): Promise<ScoreEntry[]> {
  const client = ensurePool();
  if (!client) {
    const newEntries = entries.map((entry, idx) => ({
      id: `${Date.now()}-${idx}`,
      name: entry.name || "Player",
      score: entry.score,
      createdAt: new Date().toISOString(),
    }));
    inMemory.unshift(...newEntries);
    inMemory.sort((a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt));
    return inMemory.slice(0, limit);
  }

  await ensureTable();
  const insertValues: any[] = [];
  const placeholders: string[] = [];
  entries.forEach((entry, idx) => {
    insertValues.push(entry.name || "Player", entry.score);
    const base = idx * 2;
    placeholders.push(`($${base + 1}, $${base + 2})`);
  });

  await client.query(
    `INSERT INTO leaderboard (name, score) VALUES ${placeholders.join(",")};`,
    insertValues
  );

  return getTopScores(limit);
}
