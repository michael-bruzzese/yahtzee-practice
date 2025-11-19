import {
  Category,
  DiceRoll,
  DieValue,
  Scorecard,
  grandTotal,
  isScorecardComplete,
  scoreCategory,
} from "./rules";

export type GamePhase = "rolling" | "choose-category" | "complete";

export interface PlayerState {
  name: string;
  scorecard: Scorecard;
}

export interface GameState {
  players: PlayerState[];
  currentPlayerIndex: number;
  dice: DiceRoll | null;
  held: boolean[];
  rollsRemaining: number;
  phase: GamePhase;
}

const defaultRoll = () => (Math.floor(Math.random() * 6) + 1) as DieValue;

export const createGame = (playerNames: string[]): GameState => {
  if (playerNames.length === 0) throw new Error("At least one player required");
  return {
    players: playerNames.map((name) => ({ name, scorecard: {} })),
    currentPlayerIndex: 0,
    dice: null,
    held: [false, false, false, false, false],
    rollsRemaining: 3,
    phase: "rolling",
  };
};

export const rollDice = (state: GameState, roller: () => DieValue = defaultRoll): GameState => {
  if (state.phase === "complete") throw new Error("Game is complete");
  if (state.rollsRemaining <= 0) throw new Error("No rolls remaining");

  const newDice: DiceRoll = Array.from({ length: 5 }, (_, i) => {
    if (state.dice && state.held[i]) {
      return state.dice[i];
    }
    return roller();
  }) as DiceRoll;

  return {
    ...state,
    dice: newDice,
    rollsRemaining: state.rollsRemaining - 1,
    phase: "choose-category",
  };
};

export const toggleHold = (state: GameState, dieIndex: number): GameState => {
  if (dieIndex < 0 || dieIndex > 4) throw new Error("dieIndex must be between 0 and 4");
  if (!state.dice) throw new Error("Cannot hold before rolling");
  if (state.phase === "complete") throw new Error("Game is complete");

  const held = [...state.held];
  held[dieIndex] = !held[dieIndex];
  return { ...state, held };
};

const advancePlayerIndex = (state: GameState) =>
  (state.currentPlayerIndex + 1) % state.players.length;

const allScorecardsComplete = (players: PlayerState[]) =>
  players.every((player) => isScorecardComplete(player.scorecard));

export const selectCategory = (state: GameState, category: Category): GameState => {
  if (state.phase === "complete") throw new Error("Game is complete");
  if (!state.dice) throw new Error("No dice rolled yet");

  const player = state.players[state.currentPlayerIndex];
  if (typeof player.scorecard[category] === "number") {
    throw new Error("Category already taken");
  }

  const score = scoreCategory(category, state.dice);
  const updatedPlayers = state.players.map((p, idx) =>
    idx === state.currentPlayerIndex
      ? { ...p, scorecard: { ...p.scorecard, [category]: score } }
      : p
  );

  const gameIsComplete = allScorecardsComplete(updatedPlayers);
  if (gameIsComplete) {
    return {
      ...state,
      players: updatedPlayers,
      phase: "complete",
      dice: null,
      held: [false, false, false, false, false],
      rollsRemaining: 0,
    };
  }

  const nextPlayerIndex = advancePlayerIndex(state);
  return {
    ...state,
    players: updatedPlayers,
    currentPlayerIndex: nextPlayerIndex,
    dice: null,
    held: [false, false, false, false, false],
    rollsRemaining: 3,
    phase: "rolling",
  };
};

export const totalsForPlayer = (player: PlayerState) => ({
  total: grandTotal(player.scorecard),
});
