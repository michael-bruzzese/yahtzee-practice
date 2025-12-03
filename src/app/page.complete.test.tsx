// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("framer-motion", () => {
  const ReactImport = require("react");
  const passthrough = new Proxy(
    {},
    {
      get: (_target, tag) =>
        ReactImport.forwardRef((props: any, ref: any) => {
          const Component = tag === "img" ? "img" : "div";
          const { children, ...rest } = props;
          return (
            <Component ref={ref} {...rest}>
              {children}
            </Component>
          );
        }),
    }
  );

  return {
    motion: passthrough,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

const mockAudioContext = () => {
  const destination = {};
  const gainNode = () => ({
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      setTargetAtTime: vi.fn(),
    },
    connect: vi.fn(() => destination),
  });

  const context = {
    currentTime: 0,
    destination,
    sampleRate: 48000,
    createOscillator: () => ({
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(() => gainNode()),
      start: vi.fn(),
      stop: vi.fn(),
      type: "sine",
    }),
    createGain: gainNode,
    createBuffer: (_channels: number, length: number) => ({
      getChannelData: () => new Float32Array(length),
    }),
    createBufferSource: () => ({
      connect: vi.fn(() => gainNode()),
      start: vi.fn(),
      stop: vi.fn(),
      buffer: null,
    }),
    createBiquadFilter: () => ({
      type: "",
      frequency: { value: 0 },
      Q: { value: 0 },
      connect: vi.fn(() => gainNode()),
    }),
  };

  (globalThis as any).AudioContext = vi.fn(() => context);
  (globalThis as any).webkitAudioContext = vi.fn(() => context);
};

describe("Home page completion paths", () => {
  beforeEach(() => {
    vi.resetModules();
    mockAudioContext();
  });

  it("auto-submits scores when a completed game loads", async () => {
    const fetchMock = vi.fn();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ scores: [] }),
    } as any);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ scores: [{ id: "1", name: "Champ", score: 123 }] }),
    } as any);
    (globalThis as any).fetch = fetchMock;

    vi.doMock("@/lib/yahtzee/game", () => {
      const baseState = {
        players: [{ name: "Champ", scorecard: { ones: 3, twos: 6 } }],
        currentPlayerIndex: 0,
        dice: null,
        held: [false, false, false, false, false],
        rollsRemaining: 0,
        phase: "complete" as const,
      };
      const passthrough = vi.fn(() => baseState);
      return {
        createGame: () => baseState,
        rollDice: passthrough,
        selectCategory: passthrough,
        toggleHold: passthrough,
      };
    });

    const Home = (await import("./page")).default;
    render(<Home />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/scores",
      expect.objectContaining({ method: "POST" })
    );
    expect(await screen.findByText(/Scores saved to leaderboard./i)).toBeInTheDocument();
  });
});
