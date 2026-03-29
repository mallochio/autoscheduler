"use client";

import { useState } from "react";
import { addHabit, updateHabit, Habit } from "@/lib/tauri-commands";
import { PRIORITIES } from "@/lib/utils";

interface Props {
  habit?: Habit;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function HabitForm({ habit, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState({
    name: habit?.name || "",
    duration: habit?.duration || 45,
    priority: habit?.priority || "medium",
    timeStart: habit?.timeStart || "09:00",
    timeEnd: habit?.timeEnd || "17:00",
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((p) => ({
      ...p,
      [name]: name === "duration" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      if (habit?.id) {
        await updateHabit({ id: habit.id, ...form } as Habit);
      } else {
        await addHabit(form as Omit<Habit, "id">);
      }
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && (
        <div className="p-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="name" className="text-xs font-medium text-zinc-500">
          Habit Name
        </label>
        <input
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 text-sm border rounded-md focus:ring-1 focus:ring-zinc-900 outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label
            htmlFor="duration"
            className="text-xs font-medium text-zinc-500"
          >
            Duration (min)
          </label>
          <input
            id="duration"
            name="duration"
            type="number"
            value={form.duration}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border rounded-md outline-none"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="priority"
            className="text-xs font-medium text-zinc-500"
          >
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={form.priority}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border rounded-md bg-white outline-none"
          >
            {Object.keys(PRIORITIES).map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label
            htmlFor="timeStart"
            className="text-xs font-medium text-zinc-500"
          >
            Start Window
          </label>
          <input
            id="timeStart"
            name="timeStart"
            type="time"
            value={form.timeStart}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border rounded-md outline-none"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="timeEnd"
            className="text-xs font-medium text-zinc-500"
          >
            End Window
          </label>
          <input
            id="timeEnd"
            name="timeEnd"
            type="time"
            value={form.timeEnd}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border rounded-md outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 rounded-md"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 disabled:opacity-50"
        >
          {busy ? "Saving..." : habit ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
