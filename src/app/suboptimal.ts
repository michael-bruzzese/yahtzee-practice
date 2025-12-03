import { Category, DiceRoll, allCategories, scoreCategory } from "@/lib/yahtzee/rules";
import { GameState } from "@/lib/yahtzee/game";

export const bestAvailableScore = (game: GameState): { category: Category | null; score: number } => {
  if (!game.dice) return { category: null, score: 0 };
  const player = game.players[game.currentPlayerIndex];
  const available = allCategories.filter((cat) => typeof player.scorecard[cat] !== "number");
  let best: { category: Category | null; score: number } = { category: null, score: 0 };
  available.forEach((category) => {
    const score = scoreCategory(category, game.dice as DiceRoll);
    if (score > best.score) {
      best = { category, score };
    }
  });
  return best;
};

export const isSuboptimalChoice = (game: GameState, category: Category): boolean => {
  if (!game.dice) return false;
  const player = game.players[game.currentPlayerIndex];
  if (typeof player.scorecard[category] === "number") return false;
  const chosen = scoreCategory(category, game.dice);
  const best = bestAvailableScore(game);
  return best.score > chosen;
};
