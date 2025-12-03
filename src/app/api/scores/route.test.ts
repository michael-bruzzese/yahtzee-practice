import { beforeEach, describe, expect, test, vi } from "vitest";
import type { NextRequest } from "next/server";

let route: typeof import("./route");

beforeEach(async () => {
  process.env.POSTGRES_URL = "";
  process.env.DATABASE_URL = "";
  process.env.POSTGRES_PRISMA_URL = "";
  process.env.POSTGRES_URL_NON_POOLING = "";
  vi.resetModules();
  route = await import("./route");
});

const makeRequest = (payload: unknown): NextRequest =>
  ({
    json: async () => payload,
  }) as unknown as NextRequest;

describe("scores API route", () => {
  test("GET returns leaderboard array", async () => {
    const res = await route.GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.scores)).toBe(true);
  });

  test("POST rejects invalid payload", async () => {
    const res = await route.POST(makeRequest({ nope: true }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  test("POST accepts valid entries and returns scores", async () => {
    const res = await route.POST(
      makeRequest({
        players: [
          { name: "Tester", score: 200 },
          { name: "Bad Score", score: -5 },
        ],
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.scores.length).toBeGreaterThan(0);
    expect(data.scores[0].name).toBe("Tester");
  });

  test("POST falls back to 0 score when non-numeric", async () => {
    const res = await route.POST(
      makeRequest({
        players: [{ name: "Blank Score", score: "not-a-number" as any }],
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.scores[0].score).toBe(0);
  });

  test("POST truncates players to 10, sanitizes names, drops negatives, and errors if all invalid", async () => {
    const players = Array.from({ length: 12 }, (_, i) => ({ name: ` Player ${i} `, score: i * 10 }));
    players[0].score = -10; // should drop

    const res = await route.POST(makeRequest({ players }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.scores.length).toBeLessThanOrEqual(10);
    expect(data.scores[0].name.startsWith("Player")).toBe(true);

    const allInvalid = await route.POST(makeRequest({ players: [{ name: "", score: -5 }] }));
    expect(allInvalid.status).toBe(400);
  });
});
