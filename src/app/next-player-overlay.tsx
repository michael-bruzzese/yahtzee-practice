import React from "react";
import { motion } from "framer-motion";

export function NextPlayerOverlay({
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
