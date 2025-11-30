import { describe, expect, test } from "vitest";
import { bestAvailableScore, isSuboptimalChoice } from "@/app/suboptimal";
import { createGame } from "./game";

describe("suboptimal choice helpers", () => {
  test("finds best available category for current dice", () => {
    let game = createGame(["Alice"]);
    game = { ...game, dice: [6, 6, 6, 6, 6], phase: "choose-category" };
    const best = bestAvailableScore(game);
    expect(best.category).toBe("yahtzee");
    expect(best.score).toBe(50);
  });

  test("detects suboptimal pick when a higher score is available", () => {
    let game = createGame(["Alice"]);
    game = { ...game, dice: [3, 3, 3, 3, 3], phase: "choose-category" };
    expect(isSuboptimalChoice(game, "ones")).toBe(true);
    expect(isSuboptimalChoice(game, "threes")).toBe(true); // yahtzee is higher
    // Mark threes as taken; now best is yahtzee.
    game.players[0].scorecard.threes = 0;
    expect(isSuboptimalChoice(game, "yahtzee")).toBe(false);
    // Any other low category should now be suboptimal.
    expect(isSuboptimalChoice(game, "ones")).toBe(true);
  });
});
