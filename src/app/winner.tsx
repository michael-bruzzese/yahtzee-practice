import React from "react";
import { motion } from "framer-motion";

type FireworkProps = {
  x: number;
  y: number;
  delay: number;
  hue: number;
  size: number;
  "data-testid"?: string;
};

function Firework({ x, y, delay, hue, size, ...rest }: FireworkProps) {
  return (
    <motion.div
      {...rest}
      className="absolute rounded-full"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        background: `radial-gradient(circle, hsla(${hue},95%,70%,0.9) 0%, hsla(${hue},90%,60%,0.6) 35%, hsla(${hue},85%,55%,0.2) 60%, transparent 70%)`,
        boxShadow: `0 0 25px hsla(${hue},95%,65%,0.6)`,
        transform: "translate(-50%, -50%)",
      }}
      initial={{ scale: 0.2, opacity: 0 }}
      animate={{
        scale: [0.2, 1, 1.2],
        opacity: [0.8, 0.9, 0],
        rotate: [0, 15, 0],
      }}
      transition={{
        duration: 1.2,
        delay,
        repeat: Infinity,
        repeatDelay: 1.5,
        ease: "easeOut",
      }}
    />
  );
}

export function WinnerCelebration({
  winner,
  onPlayAgain,
  onQuit,
}: {
  winner: string;
  onPlayAgain: () => void;
  onQuit: () => void;
}) {
  const bursts = [
    { x: 18, y: 32, delay: 0, hue: 320 },
    { x: 72, y: 26, delay: 0.15, hue: 200 },
    { x: 50, y: 16, delay: 0.35, hue: 120 },
    { x: 32, y: 64, delay: 0.05, hue: 45 },
    { x: 76, y: 68, delay: 0.28, hue: 280 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center bg-slate-900/70 backdrop-blur-md"
    >
      <div className="relative flex flex-col items-center gap-3 text-center">
        <div className="pointer-events-auto rounded-3xl border border-white/15 bg-white/10 px-8 py-6 shadow-2xl shadow-indigo-900/50">
          <p className="text-xs uppercase tracking-[0.35em] text-indigo-100/80">Game over</p>
          <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">{winner} wins!!!!</h2>
          <p className="mt-1 text-sm text-indigo-100/80">Start a new round to keep the streak.</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
            <button
              type="button"
              onClick={onPlayAgain}
              className="rounded-xl bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 shadow shadow-indigo-900/30 transition hover:bg-white"
            >
              Play again
            </button>
            <button
              type="button"
              onClick={onQuit}
              className="rounded-xl border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 transition hover:border-white/60 hover:bg-white/20"
            >
              Quit
            </button>
          </div>
        </div>
        <div className="pointer-events-none relative h-64 w-[360px] max-w-[80vw]">
          {bursts.map((burst, idx) => (
            <Firework
              key={idx}
              x={burst.x}
              y={burst.y}
              delay={burst.delay}
              hue={burst.hue}
              size={140}
              data-testid="firework"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
