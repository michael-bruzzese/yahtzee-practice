// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { PlayerTotals } from "./page";

describe("PlayerTotals turn indicator", () => {
  const totals = [
    { name: "Alice", total: 120 },
    { name: "Bob", total: 90 },
  ];

  it("shows badge for current player only", () => {
    render(<PlayerTotals totals={totals} currentIndex={1} />);

    expect(screen.getByTestId("turn-indicator-1")).toBeInTheDocument();
    expect(screen.queryByTestId("turn-indicator-0")).not.toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("90")).toBeInTheDocument();
  });
});
