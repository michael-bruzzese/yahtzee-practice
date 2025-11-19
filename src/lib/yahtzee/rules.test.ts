import { describe, expect, it } from "vitest";
import {
  DiceRoll,
  allCategories,
  grandTotal,
  lowerSectionTotal,
  scoreCategory,
  scoreFilledCategories,
  upperCategories,
  upperSectionBonus,
  upperSectionTotal,
} from "./rules";

const roll = (dice: DiceRoll) => dice;

describe("scoreCategory", () => {
  it("scores upper section by face", () => {
    expect(scoreCategory("ones", roll([1, 1, 2, 5, 6]))).toBe(2);
    expect(scoreCategory("fours", roll([4, 4, 4, 2, 6]))).toBe(12);
    expect(scoreCategory("sixes", roll([6, 2, 6, 6, 1]))).toBe(18);
  });

  it("scores of-a-kind and chance", () => {
    expect(scoreCategory("threeOfAKind", roll([3, 3, 3, 2, 5]))).toBe(16);
    expect(scoreCategory("threeOfAKind", roll([3, 3, 2, 2, 5]))).toBe(0);
    expect(scoreCategory("fourOfAKind", roll([2, 2, 2, 2, 6]))).toBe(14);
    expect(scoreCategory("fourOfAKind", roll([2, 2, 2, 6, 6]))).toBe(0);
    expect(scoreCategory("chance", roll([6, 5, 4, 3, 2]))).toBe(20);
  });

  it("scores full house, straights, and yahtzee", () => {
    expect(scoreCategory("fullHouse", roll([2, 2, 3, 3, 3]))).toBe(25);
    expect(scoreCategory("fullHouse", roll([2, 2, 2, 3, 4]))).toBe(0);
    expect(scoreCategory("smallStraight", roll([1, 2, 3, 4, 6]))).toBe(30);
    expect(scoreCategory("smallStraight", roll([1, 2, 2, 5, 6]))).toBe(0);
    expect(scoreCategory("largeStraight", roll([2, 3, 4, 5, 6]))).toBe(40);
    expect(scoreCategory("largeStraight", roll([1, 2, 2, 3, 4]))).toBe(0);
    expect(scoreCategory("yahtzee", roll([5, 5, 5, 5, 5]))).toBe(50);
    expect(scoreCategory("yahtzee", roll([5, 5, 5, 5, 2]))).toBe(0);
  });
});

describe("totals and bonuses", () => {
  it("computes upper totals and bonus", () => {
    const scorecard: Record<string, number> = {
      ones: 3,
      twos: 6,
      threes: 9,
      fours: 12,
      fives: 15,
      sixes: 18, // totals 63
    };
    expect(upperSectionTotal(scorecard)).toBe(63);
    expect(upperSectionBonus(scorecard)).toBe(35);
  });

  it("computes lower totals and grand total", () => {
    const scorecard = {
      ones: 3,
      twos: 6,
      threes: 9,
      fours: 8,
      fives: 5,
      sixes: 12,
      threeOfAKind: 18,
      fourOfAKind: 24,
      fullHouse: 25,
      smallStraight: 30,
      largeStraight: 40,
      yahtzee: 50,
      chance: 20,
    };
    expect(upperSectionTotal(scorecard)).toBe(43);
    expect(upperSectionBonus(scorecard)).toBe(0);
    expect(lowerSectionTotal(scorecard)).toBe(207);
    expect(grandTotal(scorecard)).toBe(250);
  });
});

describe("scorecard completeness", () => {
  it("lists filled categories", () => {
    const scorecard = { ones: 3, yahtzee: 50 };
    expect(scoreFilledCategories(scorecard)).toEqual(["ones", "yahtzee"]);
  });

  it("covers all categories when filled", () => {
    const fullCard = Object.fromEntries(allCategories.map((category) => [category, 1]));
    expect(upperSectionTotal(fullCard)).toBe(upperCategories.length);
    expect(scoreFilledCategories(fullCard)).toHaveLength(allCategories.length);
  });
});
