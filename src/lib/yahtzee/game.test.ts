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

  it("throws when no players provided", () => {
    expect(() => createGame([])).toThrow("At least one player required");
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

  it("default roller produces 5 dice within 1-6", () => {
    let state = createGame(["Alice"]);
    state = rollDice(state);
    expect(state.dice).not.toBeNull();
    expect(state.dice?.length).toBe(5);
    state.dice?.forEach((die) => {
      expect(die).toBeGreaterThanOrEqual(1);
      expect(die).toBeLessThanOrEqual(6);
    });
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

  it("automatically transitions to next player after first player finishes a turn", () => {
    const roller = makeRoller([5, 5, 5, 5, 5]);
    let state = createGame(["Alice", "Bob"]);
    state = rollDice(state, roller);
    state = selectCategory(state, "fives");

    expect(state.currentPlayerIndex).toBe(1);
    expect(state.phase).toBe("rolling");
    expect(state.dice).toBeNull();
    expect(state.rollsRemaining).toBe(3);
  });

  it("wraps turn order and clears holds/dice for next player", () => {
    const roller = makeRoller([4, 4, 4, 4, 4]);
    let state = createGame(["Alice", "Bob"]);
    state = rollDice(state, roller);
    state = toggleHold(state, 0);
    state = selectCategory(state, "fours");

    expect(state.currentPlayerIndex).toBe(1);
    expect(state.held.every((h) => h === false)).toBe(true);
    expect(state.dice).toBeNull();
    expect(state.rollsRemaining).toBe(3);

    state = rollDice(state, roller);
    state = selectCategory(state, "ones");
    expect(state.currentPlayerIndex).toBe(0);
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

  it("prevents taking the same category twice", () => {
    const roller = makeRoller([3, 3, 3, 3, 3]);
    let state = createGame(["Solo"]);
    state = rollDice(state, roller);
    state = selectCategory(state, "threes");
    // Rehydrate dice to satisfy precondition and ensure duplicate guard is hit.
    state = { ...state, dice: [3, 3, 3, 3, 3] as DiceRoll, phase: "choose-category" };
    expect(() => selectCategory(state, "threes")).toThrow("Category already taken");
  });

  it("rejects selecting a category before rolling", () => {
    const state = createGame(["Solo"]);
    expect(() => selectCategory(state, "ones")).toThrow("No dice rolled yet");
  });
});

describe("error guards and completion", () => {
  it("blocks rolling when no rolls remain", () => {
    const roller = makeRoller([1, 1, 1, 1, 1]);
    let state = createGame(["Solo"]);
    state = rollDice(state, roller);
    state = rollDice(state, roller);
    state = rollDice(state, roller); // rollsRemaining now 0
    expect(state.rollsRemaining).toBe(0);
    expect(() => rollDice(state, roller)).toThrow("No rolls remaining");
  });

  it("blocks actions once game is complete", () => {
    const roller = makeRoller([6, 6, 6, 6, 6]);
    let state = createGame(["Solo"]);
    // Fill all categories quickly using same roll; errors don't matter for scoring correctness here.
    allCategories.forEach((category) => {
      state = rollDice(state, roller);
      state = selectCategory(state, category);
    });
    expect(state.phase).toBe("complete");
    expect(() => rollDice(state, roller)).toThrow("Game is complete");
    expect(() => selectCategory(state, "ones")).toThrow("Game is complete");
  });

  it("validates hold toggling", () => {
    const roller = makeRoller([2, 2, 2, 2, 2]);
    let state = createGame(["Solo"]);
    expect(() => toggleHold(state, 0)).toThrow("Cannot hold before rolling");
    state = rollDice(state, roller);
    expect(() => toggleHold(state, -1)).toThrow("dieIndex must be between 0 and 4");
    expect(() => toggleHold(state, 5)).toThrow("dieIndex must be between 0 and 4");
  });
});
