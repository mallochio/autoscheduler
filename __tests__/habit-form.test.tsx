import { render, screen, fireEvent } from "@testing-library/react";
import { HabitForm } from "@/components/habit-form";
import { describe, it, expect, vi } from "vitest";

describe("HabitForm", () => {
  it("renders all form fields", () => {
    render(<HabitForm />);

    expect(screen.getByText("Habit Name")).toBeInTheDocument();
    expect(screen.getByText("Duration (min)")).toBeInTheDocument();
    expect(screen.getByText("Priority")).toBeInTheDocument();
    expect(screen.getByText("Start Window")).toBeInTheDocument();
    expect(screen.getByText("End Window")).toBeInTheDocument();
  });

  it("has correct default values", () => {
    render(<HabitForm />);

    expect(screen.getByLabelText("Duration (min)")).toHaveValue(45);
    expect(screen.getByLabelText("Start Window")).toHaveValue("09:00");
    expect(screen.getByLabelText("End Window")).toHaveValue("17:00");
  });

  it("priority select has all four options", () => {
    render(<HabitForm />);

    const select = screen.getByLabelText("Priority");
    const options = select.querySelectorAll("option");

    expect(options).toHaveLength(4);
    expect(options[0]).toHaveValue("critical");
    expect(options[1]).toHaveValue("high");
    expect(options[2]).toHaveValue("medium");
    expect(options[3]).toHaveValue("low");
  });

  it('renders submit button with "Create" text for new habit', () => {
    render(<HabitForm />);

    const button = screen.getByRole("button", { name: "Create" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "submit");
  });

  it('renders submit button with "Update" text when editing', () => {
    const habit = {
      id: "1",
      name: "Test Habit",
      duration: 30,
      priority: "high" as const,
      timeStart: "10:00",
      timeEnd: "12:00",
    };

    render(<HabitForm habit={habit} />);

    const button = screen.getByRole("button", { name: "Update" });
    expect(button).toBeInTheDocument();
  });

  it("renders cancel button when onCancel prop is provided", () => {
    const onCancel = vi.fn();
    render(<HabitForm onCancel={onCancel} />);

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    expect(cancelButton).toBeInTheDocument();
  });

  it("calls onCancel when cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(<HabitForm onCancel={onCancel} />);

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("updates form fields when user types", () => {
    render(<HabitForm />);

    const nameInput = screen.getByLabelText("Habit Name") as HTMLInputElement;
    const durationInput = screen.getByLabelText(
      "Duration (min)",
    ) as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: "My Habit" } });
    fireEvent.change(durationInput, { target: { value: "60" } });

    expect(nameInput.value).toBe("My Habit");
    expect(durationInput.value).toBe("60");
  });
});
