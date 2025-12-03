// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { WinnerCelebration } from "./winner";

describe("WinnerCelebration overlay", () => {
  it("shows winner message and fireworks", () => {
    render(<WinnerCelebration winner="Champion" onPlayAgain={() => {}} onQuit={() => {}} />);
    expect(screen.getByText("Champion wins!!!!")).toBeInTheDocument();
    expect(screen.getAllByTestId("firework").length).toBeGreaterThan(2);
  });

  it("fires play again and quit actions", () => {
    const onPlayAgain = vi.fn();
    const onQuit = vi.fn();
    render(<WinnerCelebration winner="Champion" onPlayAgain={onPlayAgain} onQuit={onQuit} />);

    screen.getByRole("button", { name: "Play again" }).click();
    screen.getByRole("button", { name: "Quit" }).click();

    expect(onPlayAgain).toHaveBeenCalled();
    expect(onQuit).toHaveBeenCalled();
  });
});
