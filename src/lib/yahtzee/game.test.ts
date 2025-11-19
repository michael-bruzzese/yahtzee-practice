import { describe, expect, it } from "vitest";
import { createGame, rollDice, selectCategory, toggleHold } from "./game";
import { Category, DiceRoll, DieValue, allCategories, scoreCategory } from "./rules";

const makeRoller = (values: DieValue[]) => {
  let index = 0;
  return () => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
};

const asRollerForDice = (dice: DiceRoll) => {
  let call = 0;
  return () => {
    const value = dice[call % dice.length];
    call += 1;
    return value;
  };
};

describe("createGame basics", () => {
  it("initializes with players, empty dice, and full rolls", () => {
    const state = createGame(["Alice", "Bob"]);
    expect(state.players.map((p) => p.name)).toEqual(["Alice", "Bob"]);
    expect(state.dice).toBeNull();
    expect(state.rollsRemaining).toBe(3);
    expect(state.held).toEqual([false, false, false, false, false]);
    expect(state.phase).toBe("rolling");
  });
});

describe("rolling and holding", () => {
  it("rolls dice and respects held dice on subsequent rolls", () => {
    const initialRoller = makeRoller([1, 2, 3, 4, 5, 6]);
    let state = createGame(["Alice"]);
    state = rollDice(state, initialRoller);
    expect(state.dice).not.toBeNull();
    const firstDie = state.dice?.[0];
    expect(state.rollsRemaining).toBe(2);

    state = toggleHold(state, 0);
    const secondRoller = asRollerForDice([6, 6, 6, 6, 6]);
    state = rollDice(state, secondRoller);
    expect(state.dice?.[0]).toBe(firstDie); // held die unchanged
    expect(state.dice?.slice(1)).toEqual([6, 6, 6, 6]);
    expect(state.rollsRemaining).toBe(1);
  });
});

describe("selecting categories and turn progression", () => {
  it("scores a category and advances to the next player", () => {
    const allSixes = makeRoller([6, 6, 6, 6, 6]);
    let state = createGame(["Alice", "Bob"]);
    state = rollDice(state, allSixes);
    state = selectCategory(state, "sixes");
    expect(state.players[0].scorecard.sixes).toBe(30);
    expect(state.currentPlayerIndex).toBe(1);
    expect(state.dice).toBeNull();
    expect(state.rollsRemaining).toBe(3);
    expect(state.phase).toBe("rolling");
  });

  it("finishes the game when all categories are filled for the solo player", () => {
    const roller = makeRoller([5, 5, 5, 5, 5]);
    let state = createGame(["Solo"]);

    allCategories.forEach((category: Category) => {
      state = rollDice(state, roller);
      // ensure scoreCategory can handle the dice for each slot
      const score = scoreCategory(category, state.dice as DiceRoll);
      state = selectCategory(state, category);
      expect(state.players[0].scorecard[category]).toBe(score);
    });

    expect(state.phase).toBe("complete");
    expect(state.rollsRemaining).toBe(0);
    expect(state.currentPlayerIndex).toBe(0);
  });
});
