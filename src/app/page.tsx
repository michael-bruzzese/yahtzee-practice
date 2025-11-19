/* eslint-disable @typescript-eslint/no-use-before-define */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Category,
  DiceRoll,
  allCategories,
  grandTotal,
  scoreCategory,
  upperCategories,
} from "@/lib/yahtzee/rules";
import { GameState, createGame, rollDice, selectCategory, toggleHold } from "@/lib/yahtzee/game";
import { ScoreEntry } from "@/lib/leaderboard";

type UIMessage = { type: "error" | "info"; text: string };

const defaultPlayers = ["Player 1", "Player 2"];

const categoryLabels: Record<Category, string> = {
  ones: "Ones",
  twos: "Twos",
  threes: "Threes",
  fours: "Fours",
  fives: "Fives",
  sixes: "Sixes",
  threeOfAKind: "3 of a Kind",
  fourOfAKind: "4 of a Kind",
  fullHouse: "Full House",
  smallStraight: "Small Straight",
  largeStraight: "Large Straight",
  yahtzee: "Yahtzee",
  chance: "Chance",
};

export default function Home() {
  const [game, setGame] = useState<GameState>(() => createGame(defaultPlayers));
  const [rollKey, setRollKey] = useState(0);
  const [message, setMessage] = useState<UIMessage | null>(null);
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
  const [leaderLoading, setLeaderLoading] = useState(true);
  const [leaderError, setLeaderError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const playRollSound = useChime(soundEnabled, { type: "roll" });
  const playSelectSound = useChime(soundEnabled, { type: "select" });

  const currentPlayer = game.players[game.currentPlayerIndex];
  const totals = useMemo(
    () => game.players.map((p) => ({ name: p.name, total: grandTotal(p.scorecard) })),
    [game.players]
  );

  useEffect(() => {
    loadScores();
  }, []);

  const loadScores = async () => {
    setLeaderLoading(true);
    setLeaderError(null);
    try {
      const res = await fetch("/api/scores", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load leaderboard");
      const data = await res.json();
      setLeaderboard(data.scores ?? []);
    } catch (err) {
      setLeaderError((err as Error).message);
    } finally {
      setLeaderLoading(false);
    }
  };

  const handleRoll = () => {
    setMessage(null);
    try {
      setGame((prev) => rollDice(prev));
      setRollKey((k) => k + 1);
      playRollSound();
      setSubmitted(false);
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message });
    }
  };

  const handleToggleHold = (index: number) => {
    setMessage(null);
    try {
      setGame((prev) => toggleHold(prev, index));
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message });
    }
  };

  const handleSelectCategory = (category: Category) => {
    setMessage(null);
    try {
      setGame((prev) => selectCategory(prev, category));
      playSelectSound();
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message });
    }
  };

  const handleNewGame = () => {
    setMessage({ type: "info", text: "New game started" });
    setRollKey((k) => k + 1);
    setGame(createGame(defaultPlayers));
    setSubmitted(false);
  };

  const potentialScore = (category: Category) =>
    game.dice ? scoreCategory(category, game.dice) : null;

  const gameComplete = game.phase === "complete";
  const winner =
    gameComplete && [...totals].sort((a, b) => b.total - a.total)[0]?.name;

  const handleSubmitScores = async () => {
    if (!gameComplete) {
      setMessage({ type: "error", text: "Finish the game before submitting scores." });
      return;
    }
    if (submitted) {
      setMessage({ type: "info", text: "Scores already submitted for this round." });
      return;
    }

    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          players: totals.map((t) => ({ name: t.name, score: t.total })),
        }),
      });
      if (!res.ok) throw new Error("Could not save scores");
      const data = await res.json();
      setLeaderboard(data.scores ?? []);
      setSubmitted(true);
      setMessage({ type: "info", text: "Scores submitted to leaderboard." });
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1028] via-[#101f3f] to-[#311c45] text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:py-14">
        <Header onNewGame={handleNewGame} soundEnabled={soundEnabled} onToggleSound={() => setSoundEnabled((v) => !v)} />

        <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-lg shadow-indigo-900/20">
            <div className="flex flex-col gap-6 p-6">
              <TopBar
                currentPlayer={currentPlayer.name}
                rollsRemaining={game.rollsRemaining}
                phase={game.phase}
                gameComplete={gameComplete}
                winner={winner}
              />

              <DiceTray
                dice={game.dice}
                held={game.held}
                onToggleHold={handleToggleHold}
                rollKey={rollKey}
              />

              <div className="rounded-xl border border-indigo-300/10 bg-indigo-50/5 px-4 py-3 text-xs text-indigo-100/80">
                Roll up to 3 times per turn. Tap dice to hold, then select a category to score. Game ends when all categories are filled.
              </div>

              <Controls
                onRoll={handleRoll}
                onNewGame={handleNewGame}
                rollsRemaining={game.rollsRemaining}
                diceRolled={Boolean(game.dice)}
                gameComplete={gameComplete}
              />

              {gameComplete && (
                <div className="flex flex-col gap-2 rounded-xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50 shadow-[0_10px_40px_-20px_rgba(16,185,129,0.4)]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Game complete!</span>
                    {winner ? <span className="text-xs uppercase tracking-[0.15em] text-emerald-100/80">Winner: {winner}</span> : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleSubmitScores}
                      type="button"
                      className="rounded-lg bg-emerald-400/80 px-3 py-2 text-xs font-semibold text-emerald-950 shadow hover:bg-emerald-300"
                      disabled={submitted}
                    >
                      {submitted ? "Submitted" : "Submit scores to leaderboard"}
                    </button>
                    <button
                      onClick={handleNewGame}
                      type="button"
                      className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white hover:border-white/40"
                    >
                      Start new game
                    </button>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className={`rounded-xl px-4 py-3 text-sm font-medium ${
                      message.type === "error"
                        ? "bg-rose-900/50 text-rose-100 border border-rose-400/30"
                        : "bg-emerald-900/40 text-emerald-100 border border-emerald-400/30"
                    }`}
                  >
                    {message.text}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <ScoreCard
              currentPlayer={currentPlayer.name}
              scorecard={currentPlayer.scorecard}
              dice={game.dice}
              onSelectCategory={handleSelectCategory}
              disabled={gameComplete || !game.dice}
              potentialScore={potentialScore}
            />
            <PlayerTotals totals={totals} currentIndex={game.currentPlayerIndex} />
            <Leaderboard
              scores={leaderboard}
              loading={leaderLoading}
              error={leaderError}
              onRefresh={loadScores}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function Header({
  onNewGame,
  soundEnabled,
  onToggleSound,
}: {
  onNewGame: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-indigo-200/80">Playful Yahtzee</p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Pass & Play</h1>
        <p className="text-sm text-slate-200/80">
          Roll, hold, score. Smooth animations and a playful vibe.
        </p>
      </div>
      <button
        onClick={onNewGame}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-500/30 ring-1 ring-white/20 transition hover:bg-white/20 hover:shadow-indigo-400/40"
        type="button"
      >
        New game
      </button>
      <SoundToggle enabled={soundEnabled} onToggle={onToggleSound} />
    </div>
  );
}

function SoundToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      type="button"
      className="inline-flex items-center gap-2 self-start rounded-full border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
    >
      <span
        className={`h-2 w-2 rounded-full ${enabled ? "bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.2)]" : "bg-rose-300"}`}
      />
      Sound {enabled ? "on" : "off"}
    </button>
  );
}

function TopBar({
  currentPlayer,
  rollsRemaining,
  phase,
  gameComplete,
  winner,
}: {
  currentPlayer: string;
  rollsRemaining: number;
  phase: GameState["phase"];
  gameComplete: boolean;
  winner: string | undefined;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.15)]" />
        <span className="font-semibold text-white">
          {gameComplete ? `Game Over${winner ? ` · Winner: ${winner}` : ""}` : `Turn: ${currentPlayer}`}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-indigo-100/80">
        <Badge>{gameComplete ? "Complete" : `Phase: ${phase === "rolling" ? "Roll" : "Score"}`}</Badge>
        <Badge>{`${rollsRemaining} roll${rollsRemaining === 1 ? "" : "s"} left`}</Badge>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-indigo-900/60 px-3 py-1 ring-1 ring-indigo-300/20">
      {children}
    </span>
  );
}

function DiceTray({
  dice,
  held,
  onToggleHold,
  rollKey,
}: {
  dice: DiceRoll | null;
  held: boolean[];
  onToggleHold: (index: number) => void;
  rollKey: number;
}) {
  const values: (number | null)[] = dice ?? [null, null, null, null, null];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Dice</h2>
        <p className="text-xs text-slate-200/80">Tap a die to hold it</p>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {values.map((value, idx) => (
          <DieFace
            key={`${rollKey}-${idx}-${value ?? "blank"}`}
            value={value}
            held={held[idx]}
            onClick={() => onToggleHold(idx)}
          />
        ))}
      </div>
    </div>
  );
}

function DieFace({
  value,
  held,
  onClick,
}: {
  value: number | null;
  held: boolean;
  onClick: () => void;
}) {
  const dotsByValue: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  const dots = value ? dotsByValue[value] : [];

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      animate={{
        rotateX: value ? [0, 360, 0] : 0,
        rotateY: value ? [0, 360, 0] : 0,
      }}
      transition={{ duration: value ? 0.6 : 0.3, ease: "easeInOut" }}
      onClick={onClick}
      className={`relative h-24 w-full rounded-2xl border border-white/15 bg-gradient-to-br from-white/15 to-white/5 p-3 text-white shadow-lg shadow-indigo-900/30 transition
        ${held ? "ring-2 ring-amber-300/80 ring-offset-2 ring-offset-indigo-950" : "ring-1 ring-white/10"}
        ${value === null ? "opacity-70" : "opacity-100"}
      `}
    >
      <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-1">
        {Array.from({ length: 9 }).map((_, idx) => (
          <span
            key={idx}
            className={`mx-auto my-auto h-3 w-3 rounded-full bg-white ${
              dots.includes(idx) ? "opacity-100" : "opacity-20"
            }`}
          />
        ))}
      </div>
      {held && (
        <span className="absolute -right-1 -top-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-900 shadow">
          Held
        </span>
      )}
    </motion.button>
  );
}

function Controls({
  onRoll,
  onNewGame,
  rollsRemaining,
  diceRolled,
  gameComplete,
}: {
  onRoll: () => void;
  onNewGame: () => void;
  rollsRemaining: number;
  diceRolled: boolean;
  gameComplete: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs text-slate-200/80">
        {gameComplete
          ? "Game over — start a new round anytime."
          : diceRolled
            ? "Choose a category or re-roll held dice."
            : "Roll to start your turn."}
      </div>
      <div className="flex gap-3">
        <button
          onClick={onNewGame}
          type="button"
          className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
        >
          Reset
        </button>
        <button
          onClick={onRoll}
          type="button"
          disabled={gameComplete || rollsRemaining <= 0}
          className="rounded-xl bg-gradient-to-r from-indigo-400 to-fuchsia-400 px-5 py-2 text-sm font-semibold text-indigo-950 shadow-lg shadow-indigo-900/30 ring-2 ring-white/20 transition enabled:hover:scale-[1.01] enabled:hover:shadow-indigo-600/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {gameComplete ? "Game Complete" : rollsRemaining === 3 ? "Roll Dice" : "Re-roll"}
        </button>
      </div>
    </div>
  );
}

function ScoreCard({
  currentPlayer,
  scorecard,
  dice,
  onSelectCategory,
  disabled,
  potentialScore,
}: {
  currentPlayer: string;
  scorecard: Record<string, number | undefined>;
  dice: DiceRoll | null;
  disabled: boolean;
  onSelectCategory: (category: Category) => void;
  potentialScore: (category: Category) => number | null;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm shadow-lg shadow-indigo-900/20">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-indigo-100/80">Scoring</p>
          <h3 className="text-lg font-semibold text-white">{currentPlayer}</h3>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
          {dice ? "Select a category" : "Roll to see scores"}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 text-sm">
        {allCategories.map((category) => {
          const takenScore = scorecard[category];
          const isUpper = upperCategories.includes(category as typeof upperCategories[number]);
          const canSelect = !disabled && typeof takenScore !== "number";
          const preview = dice && !takenScore ? potentialScore(category) : null;
          return (
            <button
              key={category}
              type="button"
              disabled={!canSelect}
              onClick={() => onSelectCategory(category)}
              className={`flex items-center justify-between rounded-xl border px-3 py-3 text-left transition
                ${isUpper ? "border-indigo-300/10 bg-indigo-50/5" : "border-fuchsia-300/10 bg-fuchsia-50/5"}
                ${takenScore ? "opacity-60" : "hover:-translate-y-[1px] hover:border-white/30 hover:bg-white/10"}
                ${!canSelect ? "cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <span className="font-medium text-white">{categoryLabels[category]}</span>
              <span className="text-sm font-semibold text-indigo-100">
                {typeof takenScore === "number"
                  ? takenScore
                  : preview !== null
                    ? preview
                    : "—"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Leaderboard({
  scores,
  loading,
  error,
  onRefresh,
}: {
  scores: ScoreEntry[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm shadow-lg shadow-indigo-900/20">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-indigo-100/80">Leaderboard</p>
          <h3 className="text-lg font-semibold text-white">Top scores</h3>
        </div>
        <button
          onClick={onRefresh}
          type="button"
          className="text-xs font-semibold text-indigo-100 underline decoration-dotted underline-offset-4 hover:text-white"
        >
          Refresh
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-slate-200/80">Loading…</p>
      ) : error ? (
        <p className="text-sm text-rose-200">{error}</p>
      ) : scores.length === 0 ? (
        <p className="text-sm text-slate-200/80">No scores yet. Finish a game and submit!</p>
      ) : (
        <div className="flex flex-col gap-2">
          {scores.map((entry, idx) => (
            <div
              key={entry.id ?? `${entry.name}-${idx}`}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-indigo-100/80">#{idx + 1}</span>
                <span className="font-semibold">{entry.name}</span>
              </div>
              <span className="text-base font-semibold text-white">{entry.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlayerTotals({
  totals,
  currentIndex,
}: {
  totals: { name: string; total: number }[];
  currentIndex: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm shadow-lg shadow-indigo-900/20">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Players</h3>
        <p className="text-xs text-slate-200/80">tracking totals</p>
      </div>
      <div className="flex flex-col gap-2">
        {totals.map((player, idx) => (
          <div
            key={player.name}
            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition ${
              idx === currentIndex
                ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-50 shadow-[0_10px_40px_-20px_rgba(16,185,129,0.5)]"
                : "border-white/10 bg-white/5 text-slate-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-white/60" />
              <span className="font-medium">{player.name}</span>
            </div>
            <span className="text-base font-semibold">{player.total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function useChime(enabled: boolean, { type }: { type: "roll" | "select" }) {
  const ctxRef = useRef<AudioContext | null>(null);

  return () => {
    if (!enabled || typeof window === "undefined") return;
    try {
      if (!ctxRef.current) {
        ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = ctxRef.current;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(type === "roll" ? 420 : 660, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      /* ignore sound errors */
    }
  };
}
