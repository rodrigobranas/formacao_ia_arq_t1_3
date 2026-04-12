import { render, screen } from "@testing-library/react";
import KpiCard from "./KpiCard";

const FakeIcon = () => <svg data-testid="kpi-icon" />;

describe("KpiCard", () => {
  it("renders the label text correctly", () => {
    render(<KpiCard label="Open Tickets" value={24} icon={<FakeIcon />} />);

    expect(screen.getByText("Open Tickets")).toBeInTheDocument();
  });

  it("renders a numeric value", () => {
    render(<KpiCard label="Open Tickets" value={24} icon={<FakeIcon />} />);

    expect(screen.getByText("24")).toBeInTheDocument();
  });

  it("renders a string value", () => {
    render(<KpiCard label="Avg Resolution" value="4.5h" icon={<FakeIcon />} />);

    expect(screen.getByText("4.5h")).toBeInTheDocument();
  });

  it("renders the provided icon", () => {
    render(<KpiCard label="Open Tickets" value={10} icon={<FakeIcon />} />);

    expect(screen.getByTestId("kpi-icon")).toBeInTheDocument();
  });

  it("applies correct Tailwind styling classes", () => {
    const { container } = render(
      <KpiCard label="Open Tickets" value={10} icon={<FakeIcon />} />,
    );

    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain("rounded-2xl");
    expect(card.className).toContain("border");
    expect(card.className).toContain("bg-card");
    expect(card.className).toContain("shadow-soft");
  });

  it("renders with value of 0", () => {
    render(<KpiCard label="Unassigned" value={0} icon={<FakeIcon />} />);

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("accepts an additional className", () => {
    const { container } = render(
      <KpiCard
        label="Custom"
        value={5}
        icon={<FakeIcon />}
        className="custom-class"
      />,
    );

    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain("custom-class");
  });
});
