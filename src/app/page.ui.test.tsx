// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { vi, describe, expect, it, beforeEach, afterEach } from "vitest";
import Home from "./page";

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

const setupFetch = (responses: Array<{ ok: boolean; json: () => any }>) => {
  const fetchMock = vi.fn();
  responses.forEach((res) => {
    fetchMock.mockResolvedValueOnce({
      ok: res.ok,
      json: async () => res.json(),
    } as any);
  });
  // Default fallback to a successful empty leaderboard.
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ scores: [] }),
  } as any);
  (globalThis as any).fetch = fetchMock;
  return fetchMock;
};

const closePlayerSetup = async () => {
  const skipButtons = screen.getAllByRole("button", { name: "Skip for now" });
  fireEvent.click(skipButtons[0]);
  await waitFor(() => expect(screen.queryByText("Set up your players")).not.toBeInTheDocument());
};

describe("Home page UI flows", () => {
  beforeEach(() => {
    mockAudioContext();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rolls dice, holds a die, and updates roll counter", async () => {
    const randomValues = [0, 0.2, 0.4, 0.6, 0.8, 0.99, 0.99, 0.99, 0.99, 0.99];
    vi.spyOn(Math, "random").mockImplementation(() => randomValues.shift() ?? 0.99);
    setupFetch([{ ok: true, json: () => ({ scores: [] }) }]);

    render(<Home />);
    await closePlayerSetup();

    const rollButton = screen.getByRole("button", { name: "Roll Dice" });
    fireEvent.click(rollButton);
    await waitFor(() => expect(screen.getAllByAltText(/Die showing/)).toHaveLength(5));
    await waitFor(() => expect(screen.getByRole("button", { name: /Re-roll/i })).toBeEnabled(), {
      timeout: 2000,
    });

    fireEvent.click(screen.getAllByRole("button", { name: /Die showing/ })[0]);
    fireEvent.click(screen.getByRole("button", { name: /Re-roll/i }));

    await waitFor(() => expect(screen.getByText(/1 roll left/i)).toBeInTheDocument(), {
      timeout: 2000,
    });
    const faces = screen.getAllByAltText(/Die showing/).map((img) => img.getAttribute("alt"));
    expect(faces.filter((f) => f === "Die showing 1")).toHaveLength(1);
    expect(faces.filter((f) => f === "Die showing 6")).toHaveLength(4);
  });

  it("warns on suboptimal scoring then advances to next player after acknowledgement", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99); // always roll sixes
    setupFetch([{ ok: true, json: () => ({ scores: [] }) }]);

    render(<Home />);
    await closePlayerSetup();

    fireEvent.click(screen.getByRole("button", { name: "Roll Dice" }));
    await waitFor(() => expect(screen.getAllByAltText(/Die showing/)).toHaveLength(5));
    await waitFor(() => expect(screen.getByRole("button", { name: /Re-roll/i })).toBeEnabled(), {
      timeout: 2000,
    });

    fireEvent.click(screen.getByRole("button", { name: /^Ones/ }));
    expect(screen.getByText("That's not the best way to score!")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Ones/ }));
    await waitFor(() => expect(screen.getByText("Well, Ok then!")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/Turn: Player 2/)).toBeInTheDocument());
  });

  it("shows leaderboard error then refreshes successfully", async () => {
    const fetchMock = setupFetch([
      { ok: false, json: () => ({}) },
      { ok: true, json: () => ({ scores: [{ id: "1", name: "Net Winner", score: 300 }] }) },
    ]);

    render(<Home />);
    await closePlayerSetup();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(await screen.findByText(/Failed to load leaderboard/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Net Winner")).toBeInTheDocument();
  });

  it("saves player setup changes and updates header/turn", async () => {
    setupFetch([{ ok: true, json: () => ({ scores: [] }) }]);

    render(<Home />);
    const nameInput = screen.getByLabelText("Player 1 name");
    fireEvent.change(nameInput, { target: { value: "Alicia" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Save & start" })[0]);

    await waitFor(() => expect(screen.queryByText("Set up your players")).not.toBeInTheDocument());
    expect(screen.getByText(/Players: Alicia vs Player 2/)).toBeInTheDocument();
    expect(screen.getByText(/Turn: Alicia/)).toBeInTheDocument();
  });

  it("toggles sound on and off", async () => {
    setupFetch([{ ok: true, json: () => ({ scores: [] }) }]);
    render(<Home />);
    await closePlayerSetup();

    const toggle = screen.getByRole("button", { name: /Sound on/i });
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: /Sound off/i })).toBeInTheDocument();
  });

  it("scores a yahtzee and advances turn (covers applause fx path)", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    setupFetch([{ ok: true, json: () => ({ scores: [] }) }]);

    render(<Home />);
    await closePlayerSetup();

    fireEvent.click(screen.getByRole("button", { name: "Roll Dice" }));
    await waitFor(() => expect(screen.getAllByAltText(/Die showing/)).toHaveLength(5));
    await waitFor(() => expect(screen.getByRole("button", { name: /Re-roll/i })).toBeEnabled());

    fireEvent.click(screen.getByRole("button", { name: /Yahtzee/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Yahtzee/ })).toBeDisabled());
  });
});
