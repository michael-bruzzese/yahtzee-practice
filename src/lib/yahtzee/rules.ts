export type DieValue = 1 | 2 | 3 | 4 | 5 | 6;
export type DiceRoll = [DieValue, DieValue, DieValue, DieValue, DieValue];

export const upperCategories = ["ones", "twos", "threes", "fours", "fives", "sixes"] as const;
export const lowerCategories = [
  "threeOfAKind",
  "fourOfAKind",
  "fullHouse",
  "smallStraight",
  "largeStraight",
  "yahtzee",
  "chance",
] as const;

export type UpperCategory = (typeof upperCategories)[number];
export type LowerCategory = (typeof lowerCategories)[number];
export type Category = UpperCategory | LowerCategory;
export const allCategories = [...upperCategories, ...lowerCategories] as const;

export type Scorecard = Partial<Record<Category, number>>;

export const upperBonusThreshold = 63;
export const upperBonusValue = 35;

export const countDice = (dice: DiceRoll): Record<DieValue, number> => {
  const counts: Record<DieValue, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  dice.forEach((value) => {
    counts[value] += 1;
  });
  return counts;
};

const sumDice = (dice: DiceRoll) => dice.reduce((acc, value) => acc + value, 0);

const hasNOfAKind = (counts: Record<DieValue, number>, n: number) =>
  Object.values(counts).some((count) => count >= n);

const isFullHouse = (counts: Record<DieValue, number>) => {
  const values = Object.values(counts);
  return values.includes(3) && values.includes(2);
};

const isSmallStraight = (dice: DiceRoll) => {
  const set = new Set(dice);
  const sequences = [
    [1, 2, 3, 4],
    [2, 3, 4, 5],
    [3, 4, 5, 6],
  ];
  return sequences.some((seq) => seq.every((n) => set.has(n as DieValue)));
};

const isLargeStraight = (dice: DiceRoll) => {
  const set = new Set(dice);
  return (set.size === 5 && [1, 2, 3, 4, 5].every((n) => set.has(n as DieValue))) ||
    (set.size === 5 && [2, 3, 4, 5, 6].every((n) => set.has(n as DieValue)));
};

const isYahtzee = (counts: Record<DieValue, number>) => Object.values(counts).some((count) => count === 5);

export const scoreCategory = (category: Category, dice: DiceRoll): number => {
  const counts = countDice(dice);
  switch (category) {
    case "ones":
    case "twos":
    case "threes":
    case "fours":
    case "fives":
    case "sixes": {
      const face = upperCategories.indexOf(category) + 1;
      return counts[face as DieValue] * face;
    }
    case "threeOfAKind":
      return hasNOfAKind(counts, 3) ? sumDice(dice) : 0;
    case "fourOfAKind":
      return hasNOfAKind(counts, 4) ? sumDice(dice) : 0;
    case "fullHouse":
      return isFullHouse(counts) ? 25 : 0;
    case "smallStraight":
      return isSmallStraight(dice) ? 30 : 0;
    case "largeStraight":
      return isLargeStraight(dice) ? 40 : 0;
    case "yahtzee":
      return isYahtzee(counts) ? 50 : 0;
    case "chance":
      return sumDice(dice);
  }
};

export const upperSectionTotal = (scorecard: Scorecard): number =>
  upperCategories.reduce((acc, category) => acc + (scorecard[category] ?? 0), 0);

export const upperSectionBonus = (scorecard: Scorecard): number =>
  upperSectionTotal(scorecard) >= upperBonusThreshold ? upperBonusValue : 0;

export const lowerSectionTotal = (scorecard: Scorecard): number =>
  lowerCategories.reduce((acc, category) => acc + (scorecard[category] ?? 0), 0);

export const grandTotal = (scorecard: Scorecard): number =>
  upperSectionTotal(scorecard) + upperSectionBonus(scorecard) + lowerSectionTotal(scorecard);

export const scoreFilledCategories = (scorecard: Scorecard): Category[] =>
  [...upperCategories, ...lowerCategories].filter((category) => typeof scorecard[category] === "number");

export const isScorecardComplete = (scorecard: Scorecard): boolean =>
  scoreFilledCategories(scorecard).length === upperCategories.length + lowerCategories.length;
