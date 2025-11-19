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

type AvatarPose = "idle" | "windup" | "throw";

type AvatarOption = {
  id: string;
  label: string;
  role: string;
  frames: Record<AvatarPose, string>;
};

const avatarOptions: AvatarOption[] = [
  {
    id: "ace",
    label: "Ace Highroller",
    role: "Lucky Gambler",
    frames: {
      idle: "/assets/avatars/ace-idle.svg",
      windup: "/assets/avatars/ace-windup.svg",
      throw: "/assets/avatars/ace-throw.svg",
    },
  },
  {
    id: "shadow",
    label: "Shadow Sleuth",
    role: "Midnight Detective",
    frames: {
      idle: "/assets/avatars/shadow-idle.svg",
      windup: "/assets/avatars/shadow-windup.svg",
      throw: "/assets/avatars/shadow-throw.svg",
    },
  },
  {
    id: "sunny",
    label: "Sunny Spinner",
    role: "Carnival Champ",
    frames: {
      idle: "/assets/avatars/sunny-idle.svg",
      windup: "/assets/avatars/sunny-windup.svg",
      throw: "/assets/avatars/sunny-throw.svg",
    },
  },
  {
    id: "nova",
    label: "Nova Dicey",
    role: "Cosmic Maverick",
    frames: {
      idle: "/assets/avatars/nova-idle.svg",
      windup: "/assets/avatars/nova-windup.svg",
      throw: "/assets/avatars/nova-throw.svg",
    },
  },
];

const getAvatar = (id: string) =>
  avatarOptions.find((option) => option.id === id) ?? avatarOptions[0];

type PlayerProfile = {
  name: string;
  avatarId: AvatarOption["id"];
};

const defaultProfiles: PlayerProfile[] = [
  { name: "Player 1", avatarId: "ace" },
  { name: "Player 2", avatarId: "sunny" },
];

const defaultPlayers = defaultProfiles.map((profile) => profile.name);

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
  const [playerProfiles, setPlayerProfiles] = useState<PlayerProfile[]>(defaultProfiles);
  const [pendingProfiles, setPendingProfiles] = useState<PlayerProfile[]>(defaultProfiles);
  const [game, setGame] = useState<GameState>(() => createGame(defaultPlayers));
  const [rollKey, setRollKey] = useState(0);
  const [message, setMessage] = useState<UIMessage | null>(null);
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
  const [leaderLoading, setLeaderLoading] = useState(true);
  const [leaderError, setLeaderError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showPlayerSetup, setShowPlayerSetup] = useState(true);
  const [awaitingNextPlayer, setAwaitingNextPlayer] = useState<string | null>(null);
  const [isRollingAnimation, setIsRollingAnimation] = useState(false);
  const [avatarPose, setAvatarPose] = useState<AvatarPose>("idle");
  const animationTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const playRollSound = useChime(soundEnabled, { type: "roll" });
  const playSelectSound = useChime(soundEnabled, { type: "select" });

  const currentPlayer = game.players[game.currentPlayerIndex];
  const currentProfile = playerProfiles[game.currentPlayerIndex] ?? playerProfiles[0];
  const playerNameList = playerProfiles.map((profile) => profile.name);
  const totals = useMemo(
    () => game.players.map((p) => ({ name: p.name, total: grandTotal(p.scorecard) })),
    [game.players]
  );

  useEffect(() => {
    loadScores();
  }, []);

  useEffect(() => {
    setPendingProfiles(playerProfiles.map((profile) => ({ ...profile })));
  }, [playerProfiles]);

  const clearAnimationTimers = () => {
    animationTimers.current.forEach((timer) => clearTimeout(timer));
    animationTimers.current = [];
  };

  useEffect(() => {
    return () => {
      clearAnimationTimers();
    };
  }, []);

  useEffect(() => {
    setAvatarPose("idle");
  }, [game.currentPlayerIndex]);

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

  const normalizeProfiles = (profiles: PlayerProfile[]) =>
    profiles.map((profile, idx) => ({
      name: profile.name.trim() || `Player ${idx + 1}`,
      avatarId: getAvatar(profile.avatarId).id,
    }));

  const openPlayerSetup = () => {
    setPendingProfiles(playerProfiles.map((profile) => ({ ...profile })));
    setShowPlayerSetup(true);
  };

  const cancelPlayerSetup = () => {
    setPendingProfiles(playerProfiles.map((profile) => ({ ...profile })));
    setShowPlayerSetup(false);
  };

  const handlePlayerNameChange = (index: number, value: string) => {
    setPendingProfiles((prev) =>
      prev.map((profile, idx) => (idx === index ? { ...profile, name: value } : profile))
    );
  };

  const handleAvatarSelect = (index: number, avatarId: string) => {
    setPendingProfiles((prev) =>
      prev.map((profile, idx) => (idx === index ? { ...profile, avatarId } : profile))
    );
  };

  const applyPlayerProfiles = () => {
    const sanitized = normalizeProfiles(pendingProfiles);
    setPlayerProfiles(sanitized);
    setGame(createGame(sanitized.map((profile) => profile.name)));
    setRollKey((k) => k + 1);
    setSubmitted(false);
    setAwaitingNextPlayer(null);
    setShowPlayerSetup(false);
    setAvatarPose("idle");
    setMessage({ type: "info", text: "Players updated. New game ready!" });
  };

  const handleAcknowledgeNextPlayer = () => {
    if (awaitingNextPlayer) {
      setMessage({ type: "info", text: `${awaitingNextPlayer}, it's your turn.` });
    }
    setAwaitingNextPlayer(null);
  };

  const triggerRollAnimation = () => {
    if (typeof window === "undefined") return;
    clearAnimationTimers();
    setIsRollingAnimation(true);
    setAvatarPose("windup");
    const windup = setTimeout(() => {
      setAvatarPose("throw");
    }, 250);
    const settle = setTimeout(() => {
      setAvatarPose("idle");
      setIsRollingAnimation(false);
    }, 900);
    animationTimers.current.push(windup, settle);
  };

  const handleRoll = () => {
    if (awaitingNextPlayer) {
      setMessage({ type: "info", text: `Pass play to ${awaitingNextPlayer} before rolling.` });
      return;
    }
    if (isRollingAnimation) {
      setMessage({ type: "info", text: "Hang on—dice are already in motion." });
      return;
    }
    setMessage(null);
    try {
      triggerRollAnimation();
      setGame((prev) => rollDice(prev));
      setRollKey((k) => k + 1);
      playRollSound();
      setSubmitted(false);
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message });
    }
  };

  const handleToggleHold = (index: number) => {
    if (awaitingNextPlayer) {
      setMessage({ type: "info", text: `Pass play to ${awaitingNextPlayer} before making changes.` });
      return;
    }
    if (isRollingAnimation) {
      setMessage({ type: "info", text: "Wait for the roll animation to end before holding dice." });
      return;
    }
    setMessage(null);
    try {
      setGame((prev) => toggleHold(prev, index));
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message });
    }
  };

  const handleSelectCategory = (category: Category) => {
    if (awaitingNextPlayer) {
      setMessage({
        type: "info",
        text: `Pass play to ${awaitingNextPlayer} before selecting categories.`,
      });
      return;
    }
    if (isRollingAnimation) {
      setMessage({ type: "info", text: "Let the dice settle before scoring." });
      return;
    }
    setMessage(null);
    try {
      setGame((prev) => {
        const next = selectCategory(prev, category);
        if (next.phase === "complete" || next.players.length <= 1) {
          setAwaitingNextPlayer(null);
        } else if (next.phase === "rolling") {
          const nextPlayer = next.players[next.currentPlayerIndex]?.name;
          if (nextPlayer) {
            setAwaitingNextPlayer(nextPlayer);
          }
        }
        return next;
      });
      playSelectSound();
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message });
    }
  };

  const handleNewGame = () => {
    setMessage({ type: "info", text: "Choose your avatars to start the next round." });
    openPlayerSetup();
  };

  const handleResetGame = () => {
    setMessage({ type: "info", text: "New game started" });
    setRollKey((k) => k + 1);
    setGame(createGame(playerProfiles.map((profile) => profile.name)));
    setSubmitted(false);
    setAwaitingNextPlayer(null);
    setAvatarPose("idle");
  };

  const potentialScore = (category: Category) =>
    game.dice ? scoreCategory(category, game.dice) : null;

  const gameComplete = game.phase === "complete";
  const winner = gameComplete ? [...totals].sort((a, b) => b.total - a.total)[0]?.name : undefined;

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
      <AnimatePresence initial={false}>
        {awaitingNextPlayer && (
          <NextPlayerOverlay
            key="next-player-overlay"
            nextPlayer={awaitingNextPlayer}
            onContinue={handleAcknowledgeNextPlayer}
          />
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {showPlayerSetup && (
          <PlayerSetupModal
            profiles={pendingProfiles}
            onChangeName={handlePlayerNameChange}
            onSelectAvatar={handleAvatarSelect}
            onCancel={cancelPlayerSetup}
            onSave={applyPlayerProfiles}
          />
        )}
      </AnimatePresence>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:py-14">
        <Header
          onNewGame={handleNewGame}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((v) => !v)}
          onEditPlayers={openPlayerSetup}
          playerNames={playerNameList}
        />

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

              <TableScene
                profile={currentProfile}
                dice={game.dice}
                held={game.held}
                onToggleHold={handleToggleHold}
                rollKey={rollKey}
                interactionLocked={Boolean(awaitingNextPlayer) || isRollingAnimation}
                leaderboard={leaderboard}
                leaderLoading={leaderLoading}
                leaderError={leaderError}
                onRefresh={loadScores}
                isRolling={isRollingAnimation}
                pose={avatarPose}
              />

              <div className="rounded-xl border border-indigo-300/10 bg-indigo-50/5 px-4 py-3 text-xs text-indigo-100/80">
                Roll up to 3 times per turn. Tap dice to hold, then select a category to score. Game ends when all categories are filled.
              </div>

              <Controls
                onRoll={handleRoll}
                onReset={handleResetGame}
                rollsRemaining={game.rollsRemaining}
                diceRolled={Boolean(game.dice)}
                gameComplete={gameComplete}
                awaitingPlayer={awaitingNextPlayer}
                isRolling={isRollingAnimation}
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
  onEditPlayers,
  playerNames,
}: {
  onNewGame: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onEditPlayers: () => void;
  playerNames: string[];
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-indigo-200/80">Playful Yahtzee</p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Pass & Play</h1>
        <p className="text-sm text-slate-200/80">
          Roll, hold, score. Smooth animations and a playful vibe.
        </p>
        <p className="text-xs text-slate-200/60">
          Players: {playerNames.join(" vs ")}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onEditPlayers}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 backdrop-blur-sm transition hover:border-white/40 hover:text-white"
          type="button"
        >
          Edit players
        </button>
        <button
          onClick={onNewGame}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-500/30 ring-1 ring-white/20 transition hover:bg-white/20 hover:shadow-indigo-400/40"
          type="button"
        >
          New game
        </button>
        <SoundToggle enabled={soundEnabled} onToggle={onToggleSound} />
      </div>
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

function TableScene({
  profile,
  dice,
  held,
  onToggleHold,
  rollKey,
  interactionLocked,
  leaderboard,
  leaderLoading,
  leaderError,
  onRefresh,
  isRolling,
  pose,
}: {
  profile: PlayerProfile;
  dice: DiceRoll | null;
  held: boolean[];
  onToggleHold: (index: number) => void;
  rollKey: number;
  interactionLocked: boolean;
  leaderboard: ScoreEntry[];
  leaderLoading: boolean;
  leaderError: string | null;
  onRefresh: () => void;
  isRolling: boolean;
  pose: AvatarPose;
}) {
  const diceValues: (number | null)[] = dice ?? [null, null, null, null, null];
  const dicePositions = [
    { top: "42%", left: "40%" },
    { top: "35%", left: "52%" },
    { top: "48%", left: "60%" },
    { top: "58%", left: "48%" },
    { top: "50%", left: "32%" },
  ];
  const diceDisabled = interactionLocked || !dice;

  return (
    <div className="relative rounded-[32px] border border-white/10 bg-[#050c1f] p-4 shadow-lg shadow-black/40">
      <div className="relative h-[320px] overflow-hidden rounded-[28px] bg-gradient-to-br from-[#04152e] to-[#081f3f]">
        <div
          className="absolute inset-4 rounded-[24px] border border-emerald-400/30 bg-cover bg-center"
          style={{ backgroundImage: "url(/assets/scenes/table.svg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#040c1c]/30 to-[#02060f]/80" />

        <div className="absolute left-8 bottom-6 flex flex-col items-center gap-2">
          <AvatarDisplay profile={profile} pose={pose} isRolling={isRolling} />
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            {profile.name}
          </p>
        </div>

        <div className="absolute inset-0">
          {diceValues.map((value, idx) => (
            <DiceToken
              key={`${rollKey}-${idx}-${value ?? "blank"}`}
              value={value}
              held={held[idx]}
              position={dicePositions[idx]}
              onClick={() => onToggleHold(idx)}
              disabled={diceDisabled}
              showBlur={isRolling}
            />
          ))}
        </div>

        <LeaderboardBackdrop
          scores={leaderboard}
          loading={leaderLoading}
          error={leaderError}
          onRefresh={onRefresh}
        />
      </div>
      <p className="mt-3 text-center text-xs text-slate-200/80">
        Hold dice with a tap. Rolling animates the throw onto the felt.
      </p>
    </div>
  );
}

function AvatarDisplay({
  profile,
  pose,
  isRolling,
}: {
  profile: PlayerProfile;
  pose: AvatarPose;
  isRolling: boolean;
}) {
  const avatar = getAvatar(profile.avatarId);
  const frame = avatar.frames[pose] ?? avatar.frames.idle;
  return (
    <div className="pointer-events-none select-none text-white">
      <motion.img
        key={frame}
        src={frame}
        alt={`${avatar.label} avatar`}
        className="h-48 w-auto drop-shadow-[0_15px_30px_rgba(0,0,0,0.45)]"
        animate={{ rotate: isRolling ? [0, -2, 0] : 0 }}
        transition={{ duration: 0.8, repeat: isRolling ? Infinity : 0, repeatType: "reverse" }}
      />
      <div className="mt-1 text-center">
        <p className="text-sm font-semibold">{avatar.label}</p>
        <p className="text-xs text-white/70">{avatar.role}</p>
      </div>
    </div>
  );
}

function DiceToken({
  value,
  held,
  position,
  onClick,
  disabled,
  showBlur,
}: {
  value: number | null;
  held: boolean;
  position: { top: string; left: string };
  onClick: () => void;
  disabled: boolean;
  showBlur: boolean;
}) {
  const src =
    showBlur || value === null ? "/assets/dice/die-blur.svg" : `/assets/dice/die-${value}.svg`;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{ top: position.top, left: position.left }}
      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl p-0 shadow-[0_20px_35px_rgba(0,0,0,0.4)] transition ${
        disabled ? "cursor-not-allowed opacity-60" : "hover:-translate-y-1"
      } ${held ? "ring-4 ring-amber-300/80" : "ring-2 ring-white/20"}`}
    >
      <img src={src} alt={value ? `Die showing ${value}` : "Rolling dice"} className="h-16 w-16" />
      {held && (
        <span className="absolute -top-3 right-1 rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-950 shadow">
          Held
        </span>
      )}
    </button>
  );
}

function Controls({
  onRoll,
  onReset,
  rollsRemaining,
  diceRolled,
  gameComplete,
  awaitingPlayer,
  isRolling,
}: {
  onRoll: () => void;
  onReset: () => void;
  rollsRemaining: number;
  diceRolled: boolean;
  gameComplete: boolean;
  awaitingPlayer: string | null;
  isRolling: boolean;
}) {
  const waitingForPlayer = Boolean(awaitingPlayer);
  const rollDisabled = gameComplete || rollsRemaining <= 0 || waitingForPlayer || isRolling;
  const rollLabel = gameComplete
    ? "Game Complete"
    : waitingForPlayer
      ? `Pass to ${awaitingPlayer}`
      : isRolling
        ? "Rolling…"
        : rollsRemaining === 3
          ? "Roll Dice"
          : "Re-roll";

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
          onClick={onReset}
          type="button"
          className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
        >
          Reset
        </button>
        <button
          onClick={onRoll}
          type="button"
          disabled={rollDisabled}
          className="rounded-xl bg-gradient-to-r from-indigo-400 to-fuchsia-400 px-5 py-2 text-sm font-semibold text-indigo-950 shadow-lg shadow-indigo-900/30 ring-2 ring-white/20 transition enabled:hover:scale-[1.01] enabled:hover:shadow-indigo-600/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {rollLabel}
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

function LeaderboardBackdrop({
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
  const top = scores.slice(0, 4);
  return (
    <div className="absolute right-6 top-6 w-64 rounded-2xl border border-cyan-200/30 bg-[#081530]/90 p-4 text-white shadow-lg shadow-cyan-500/10 backdrop-blur">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-cyan-100/70">
        <span>Leaders</span>
        <button
          type="button"
          onClick={onRefresh}
          className="text-[10px] font-semibold text-cyan-200 underline decoration-dotted"
        >
          Refresh
        </button>
      </div>
      <div className="mt-2 text-[10px] uppercase tracking-[0.4em] text-cyan-200/60">Top Scores</div>
      {loading ? (
        <p className="mt-4 text-sm text-cyan-100/70">Loading…</p>
      ) : error ? (
        <p className="mt-4 text-sm text-rose-200">{error}</p>
      ) : top.length === 0 ? (
        <p className="mt-4 text-sm text-cyan-100/70">No scores yet.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {top.map((entry, idx) => (
            <div
              key={entry.id ?? `${entry.name}-${idx}`}
              className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-cyan-200/80">#{idx + 1}</span>
                <span className="font-semibold">{entry.name}</span>
              </div>
              <span className="text-base font-bold text-cyan-100">{entry.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlayerSetupModal({
  profiles,
  onChangeName,
  onSelectAvatar,
  onCancel,
  onSave,
}: {
  profiles: PlayerProfile[];
  onChangeName: (index: number, value: string) => void;
  onSelectAvatar: (index: number, avatarId: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/95 p-6 text-slate-900 shadow-2xl"
      >
        <h2 className="text-2xl font-semibold text-slate-900">Set up your players</h2>
        <p className="text-sm text-slate-500">Pick a character and name for each player.</p>
        <div className="mt-6 flex flex-col gap-8">
          {profiles.map((profile, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-200/80 p-4 shadow-sm">
              <label className="text-sm font-semibold text-slate-700">
                Player {idx + 1} name
                <input
                  value={profile.name}
                  onChange={(event) => onChangeName(idx, event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-base text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder={`Player ${idx + 1}`}
                />
              </label>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {avatarOptions.map((option) => {
                  const selected = option.id === profile.avatarId;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => onSelectAvatar(idx, option.id)}
                      className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-3 text-center text-xs font-semibold transition ${
                        selected
                          ? "border-indigo-500 bg-indigo-50 text-indigo-600 shadow"
                          : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/60"
                      }`}
                    >
                      <img src={option.frames.idle} alt={option.label} className="h-24 w-auto" />
                      <span>{option.label}</span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                        {option.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500"
          >
            Save & start
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function NextPlayerOverlay({
  nextPlayer,
  onContinue,
}: {
  nextPlayer: string;
  onContinue: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/90 px-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/10 p-6 text-center text-white backdrop-blur-xl"
      >
        <p className="text-xs uppercase tracking-[0.4em] text-indigo-100/70">Pass the device</p>
        <h2 className="mt-3 text-2xl font-semibold">
          {nextPlayer}
        </h2>
        <p className="mt-2 text-sm text-indigo-100/80">
          Hand off to the next player. Tap continue when they&apos;re ready.
        </p>
        <button
          type="button"
          onClick={onContinue}
          className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 shadow shadow-indigo-900/30 transition hover:bg-white"
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
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
