import { beforeEach, describe, expect, test, vi } from "vitest";

let leaderboard: typeof import("./leaderboard");

beforeEach(async () => {
  // Force in-memory mode for tests.
  process.env.POSTGRES_URL = "";
  process.env.DATABASE_URL = "";
  process.env.POSTGRES_PRISMA_URL = "";
  process.env.POSTGRES_URL_NON_POOLING = "";
  vi.resetModules();
  leaderboard = await import("./leaderboard");
});

describe("leaderboard in-memory adapter", () => {
  test("returns empty list when no scores exist", async () => {
    const scores = await leaderboard.getTopScores(10);
    expect(scores).toEqual([]);
  });

  test("saves and sorts scores descending, trims to limit", async () => {
    const saved = await leaderboard.saveScores(
      [
        { name: "Alice", score: 250 },
        { name: "Bob", score: 180 },
        { name: "Cara", score: 320 },
        { name: "Dave", score: 180 },
      ],
      3
    );

    expect(saved).toHaveLength(3);
    expect(saved.map((s) => s.name)).toEqual(["Cara", "Alice", "Bob"]);
    expect(saved[0].score).toBe(320);
  });

  test("getTopScores respects limit", async () => {
    await leaderboard.saveScores(
      [
        { name: "Alpha", score: 100 },
        { name: "Beta", score: 90 },
        { name: "Gamma", score: 80 },
      ],
      5
    );

    const topTwo = await leaderboard.getTopScores(2);
    expect(topTwo).toHaveLength(2);
    expect(topTwo[0].name).toBe("Alpha");
  });

  test("tie-breaker by createdAt and name fallback when blank", async () => {
    const now = Date.now();
    const entries = [
      { name: "", score: 200 },
      { name: "Later", score: 200 },
    ];
    // Inject predictable createdAt ordering by pre-seeding
    const saved = await leaderboard.saveScores(entries, 5);
    expect(saved[0].name).toBe("Player"); // blank becomes Player
    expect(saved[1].name).toBe("Later");

    // Exceed limit to ensure trimming still sorted
    const more = Array.from({ length: 10 }, (_, i) => ({ name: `N${i}`, score: 50 + i }));
    const limited = await leaderboard.saveScores(more, 5);
    expect(limited).toHaveLength(5);
    expect(limited[0].score).toBeGreaterThan(limited[4].score);
  });
});
