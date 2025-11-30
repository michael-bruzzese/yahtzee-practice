// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { WinnerCelebration } from "./winner";

describe("WinnerCelebration overlay", () => {
  it("shows winner message and fireworks", () => {
    render(<WinnerCelebration winner="Champion" />);
    expect(screen.getByText("Champion wins!!!!")).toBeInTheDocument();
    expect(screen.getAllByTestId("firework").length).toBeGreaterThan(2);
  });
});
