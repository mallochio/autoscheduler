"use client";

import { useState, useEffect } from "react";
import { getHabits, Habit, deleteHabit } from "@/lib/tauri-commands";
import { HabitForm } from "@/components/habit-form";
import { PRIORITIES } from "@/lib/utils";
import { Trash2, Plus, Edit2 } from "lucide-react";

export default function PrioritiesPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getHabits();
      setHabits(
        [...data].sort(
          (a, b) => PRIORITIES[b.priority].rank - PRIORITIES[a.priority].rank,
        ),
      );
      setError(null);
    } catch (err) {
      setError("Failed to load habits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onDelete = async (id: string) => {
    if (!confirm("Delete habit?")) return;
    try {
      await deleteHabit(id);
      load();
    } catch (err) {
      setError("Delete failed");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50/50">
      <header className="px-8 py-6 border-b bg-white flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Priorities</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage habit schedules and priority levels.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-md hover:bg-zinc-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Habit
          </button>
        )}
      </header>

      <div className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto w-full">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-100 rounded text-sm">
            {error}
          </div>
        )}

        {showForm && (
          <div className="mb-8 bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-lg font-medium mb-4">
              {editing ? "Edit Habit" : "New Habit"}
            </h2>
            <HabitForm
              habit={editing || undefined}
              onSuccess={() => {
                setShowForm(false);
                load();
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {loading ? (
          <div className="text-zinc-500 text-sm">Loading...</div>
        ) : (
          <div className="grid gap-3">
            {habits.map((h) => (
              <div
                key={h.id}
                className="bg-white border rounded-lg p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-zinc-900">{h.name}</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    {h.duration}m • {h.timeStart} - {h.timeEnd}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${PRIORITIES[h.priority].cls}`}
                  >
                    {h.priority}
                  </span>
                  <div className="flex items-center border-l pl-3 ml-1 gap-1">
                    <button
                      onClick={() => {
                        setEditing(h);
                        setShowForm(true);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(h.id)}
                      className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {habits.length === 0 && !showForm && (
              <div className="text-center py-12 border-2 border-dashed rounded-lg text-zinc-400">
                No habits found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
