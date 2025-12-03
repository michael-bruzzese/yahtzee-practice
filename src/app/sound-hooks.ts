import { useRef } from "react";

const createNoiseBuffer = (ctx: AudioContext, duration = 0.3) => {
  const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * duration)), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * 0.6;
  }
  return buffer;
};

const playDiceClack = (ctx: AudioContext, start: number) => {
  const bursts = 3;
  for (let i = 0; i < bursts; i += 1) {
    const delay = start + i * 0.08;
    const bufferSource = ctx.createBufferSource();
    bufferSource.buffer = createNoiseBuffer(ctx, 0.15);
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1200 + Math.random() * 600;
    filter.Q.value = 3;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, delay);
    gain.gain.linearRampToValueAtTime(0.3, delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, delay + 0.18);
    bufferSource.connect(filter).connect(gain).connect(ctx.destination);
    bufferSource.start(delay);
    bufferSource.stop(delay + 0.2);
  }
  const tone = ctx.createOscillator();
  const toneGain = ctx.createGain();
  tone.frequency.setValueAtTime(260, start);
  tone.frequency.exponentialRampToValueAtTime(120, start + 0.25);
  toneGain.gain.setValueAtTime(0.2, start);
  toneGain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
  tone.connect(toneGain).connect(ctx.destination);
  tone.start(start);
  tone.stop(start + 0.3);
};

const playYahtzeeApplause = (ctx: AudioContext, start: number) => {
  const bufferSource = ctx.createBufferSource();
  bufferSource.buffer = createNoiseBuffer(ctx, 1.5);
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 600;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, start);
  gain.gain.linearRampToValueAtTime(0.7, start + 0.15);
  gain.gain.setTargetAtTime(0.2, start + 0.8, 0.4);
  gain.gain.exponentialRampToValueAtTime(0.001, start + 1.5);
  bufferSource.connect(filter).connect(gain).connect(ctx.destination);
  bufferSource.start(start);
  bufferSource.stop(start + 1.5);
};

const playCelebrateChime = (ctx: AudioContext, start: number) => {
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, start + idx * 0.05);
    gain.gain.setValueAtTime(0.18, start + idx * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4 + idx * 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start + idx * 0.05);
    osc.stop(start + 0.5 + idx * 0.05);
  });
};

type PercussiveType = "dice" | "yahtzee" | "celebrate";

export function useChime(enabled: boolean, { type }: { type: "roll" | "select" }) {
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

export function usePercussiveFx(enabled: boolean, type: PercussiveType) {
  const ctxRef = useRef<AudioContext | null>(null);

  return () => {
    if (!enabled || typeof window === "undefined") return;
    try {
      if (!ctxRef.current) {
        ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = ctxRef.current;
      const now = ctx.currentTime;
      if (type === "dice") {
        playDiceClack(ctx, now);
      } else if (type === "yahtzee") {
        playYahtzeeApplause(ctx, now);
      } else {
        playCelebrateChime(ctx, now);
      }
    } catch {
      /* ignore fx errors */
    }
  };
}
