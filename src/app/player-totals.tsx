import React from "react";

export function PlayerTotals({
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
              {idx === currentIndex && (
                <span
                  data-testid={`turn-indicator-${idx}`}
                  className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-50"
                >
                  Current turn
                </span>
              )}
            </div>
            <span className="text-base font-semibold">{player.total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
