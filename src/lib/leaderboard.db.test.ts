import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPg = (responses: any[], onConstruct?: (opts: any) => void) => {
  const query = vi.fn();
  responses.forEach((res) => {
    query.mockResolvedValueOnce(res);
  });

  class FakePool {
    query = query;
    constructor(opts?: unknown) {
      onConstruct?.(opts);
    }
  }

  vi.doMock("pg", () => ({ Pool: FakePool }));
  return query;
};

describe("leaderboard postgres adapter", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.POSTGRES_URL = "postgres://example";
    process.env.DATABASE_URL = "";
    process.env.POSTGRES_PRISMA_URL = "";
    process.env.POSTGRES_URL_NON_POOLING = "";
  });

  it("reads scores from postgres when a connection string is present", async () => {
    const now = new Date("2024-01-01T00:00:00Z");
    const query = mockPg([
      { rows: [] }, // ensureTable
      { rows: [{ id: 1, name: "DB Champ", score: 400, createdAt: now }] }, // select
    ]);

    const leaderboard = await import("./leaderboard");
    const scores = await leaderboard.getTopScores(5);

    expect(query).toHaveBeenCalledTimes(2);
    expect(scores[0]).toMatchObject({
      name: "DB Champ",
      score: 400,
      createdAt: now.toISOString(),
    });
  });

  it("inserts scores via postgres and returns trimmed results", async () => {
    const earlier = new Date("2024-02-01T00:00:00Z");
    const later = new Date("2024-02-02T00:00:00Z");
    const query = mockPg([
      { rows: [] }, // ensureTable in saveScores
      { rows: [] }, // insert
      { rows: [] }, // ensureTable in getTopScores
      {
        rows: [
          { id: 1, name: "Winner", score: 220, createdAt: earlier },
          { id: 2, name: "Second", score: 180, createdAt: later },
        ],
      }, // select in getTopScores
    ]);

    const leaderboard = await import("./leaderboard");
    const saved = await leaderboard.saveScores(
      [
        { name: "Winner", score: 220 },
        { name: "Second", score: 180 },
      ],
      5
    );

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO leaderboard"),
      expect.arrayContaining(["Winner", 220, "Second", 180])
    );
    expect(saved.map((s) => s.name)).toEqual(["Winner", "Second"]);
  });

  it("uses ssl for neon URLs and normalizes db rows and blank names", async () => {
    const constructed: any[] = [];
    const now = "2024-03-01T00:00:00Z";
    mockPg(
      [
        { rows: [] }, // ensureTable in saveScores
        { rows: [] }, // insert
        { rows: [] }, // ensureTable in getTopScores
        {
          rows: [{ id: 3, name: "Player", score: 99, createdAt: now }],
        }, // select
      ],
      (opts) => constructed.push(opts)
    );

    process.env.POSTGRES_URL = "postgres://user:pass@host.neon.tech/db";
    process.env.DATABASE_URL = "";
    process.env.POSTGRES_PRISMA_URL = "";
    process.env.POSTGRES_URL_NON_POOLING = "";

    const leaderboard = await import("./leaderboard");
    const saved = await leaderboard.saveScores([{ name: "", score: 99 }], 5);

    expect(constructed[0]).toMatchObject({
      connectionString: expect.stringContaining("neon.tech"),
      ssl: { rejectUnauthorized: false },
    });
    expect(saved[0]).toMatchObject({
      name: "Player",
      score: 99,
      createdAt: new Date(now).toISOString(),
    });
  });
});
