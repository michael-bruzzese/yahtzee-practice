import { beforeEach, describe, expect, test, vi } from "vitest";
import { createGame, rollDice, selectCategory } from "@/lib/yahtzee/game";
import { grandTotal } from "@/lib/yahtzee/rules";

let leaderboard: typeof import("@/lib/leaderboard");

const makeRoller = (values: number[]) => {
  let idx = 0;
  return () => {
    const value = values[idx % values.length];
    idx += 1;
    return value as any;
  };
};

beforeEach(async () => {
  // Force in-memory leaderboard for repeatable tests.
  process.env.POSTGRES_URL = "";
  process.env.DATABASE_URL = "";
  process.env.POSTGRES_PRISMA_URL = "";
  process.env.POSTGRES_URL_NON_POOLING = "";
  vi.resetModules();
  leaderboard = await import("@/lib/leaderboard");
});

describe("integration: game flow to leaderboard", () => {
  test("advances turns and persists sorted scores", async () => {
    const rollerSixes = makeRoller([6, 6, 6, 6, 6]);
    const rollerOnes = makeRoller([1, 1, 1, 1, 1]);

    let state = createGame(["Alice", "Bob"]);

    // Alice turn: Yahtzee
    state = rollDice(state, rollerSixes);
    state = selectCategory(state, "yahtzee");

    // Bob turn: Ones
    state = rollDice(state, rollerOnes);
    state = selectCategory(state, "ones");

    const entries = state.players.map((p) => ({
      name: p.name,
      score: grandTotal(p.scorecard),
    }));

    const saved = await leaderboard.saveScores(entries, 5);
    expect(saved.map((s) => s.name)).toEqual(["Alice", "Bob"]);
    expect(saved[0].score).toBeGreaterThan(saved[1].score);

    const top = await leaderboard.getTopScores(5);
    expect(top[0].name).toBe("Alice");
    expect(top[1].name).toBe("Bob");
  });
});
