import { Card, Icon, SectionTitle } from "@/components/ui";
import { bestStreak, habitStreak, useStore } from "@/lib/store";
import { addDays, dayNames, keyOf } from "@/lib/date";
import { hexToRgba } from "@/lib/accents";
import type { Habit } from "@/lib/types";

export default function HabitsScreen({
  onEdit,
  onAdd,
}: {
  onEdit: (h: Habit) => void;
  onAdd: () => void;
}) {
  const { state } = useStore();
  const accent = state.settings.accent;
  const habits = state.habits;

  return (
    <div className="px-4 pb-6 pt-2">
      <header className="flex items-center justify-between px-1 pt-3">
        <div>
          <h1 className="text-[26px] font-bold leading-tight">Habits</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {habits.length} routine{habits.length === 1 ? "" : "s"} tracked
          </p>
        </div>
        <button
          onClick={onAdd}
          className="press grid h-11 w-11 place-items-center rounded-2xl"
          style={{ background: accent, color: "#fff" }}
          aria-label="Add habit"
        >
          <Icon name="plus" size={22} strokeWidth={2.2} />
        </button>
      </header>

      <SectionTitle>All routines</SectionTitle>

      {habits.length === 0 && (
        <Card className="py-10 text-center text-sm" style={{ color: "var(--muted)" }}>
          No habits yet — tap + to create your first one.
        </Card>
      )}

      <ul className="flex flex-col gap-2.5">
        {habits.map((h, i) => {
          const streak = habitStreak(state, h);
          const best = bestStreak(state, h);
          const last14 = Array.from({ length: 14 }, (_, idx) => {
            const d = addDays(new Date(), -(13 - idx));
            const count = state.logs[keyOf(d)]?.[h.id] ?? 0;
            return { scheduled: h.days.includes(d.getDay()), done: count >= h.target };
          });
          return (
            <li key={h.id} className="anim-fade-up" style={{ animationDelay: `${Math.min(i * 45, 300)}ms` }}>
              <Card onClick={() => onEdit(h)} className="!py-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-xl"
                    style={{ background: hexToRgba(h.color, 0.18) }}
                  >
                    {h.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{h.name}</p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                      {h.days.length === 7 ? "Every day" : h.days.map((d) => dayNames[d]).join(" · ")}
                      {h.target > 1 ? ` · ${h.target}× daily` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="flex items-center justify-end gap-1 font-semibold" style={{ color: h.color }}>
                      <Icon name="flame" size={14} fill />
                      {streak}
                    </div>
                    <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                      best {best}
                    </p>
                  </div>
                </div>

                <div className="mt-3.5 flex items-center gap-[3px]">
                  {last14.map((d, idx) => (
                    <span
                      key={idx}
                      className="h-6 flex-1 rounded-md"
                      style={{
                        background: d.done
                          ? h.color
                          : d.scheduled
                            ? "var(--surface-3)"
                            : "transparent",
                        border: d.scheduled ? "none" : "1px dashed var(--line)",
                        opacity: d.done ? 1 : 0.85,
                      }}
                    />
                  ))}
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 px-2 text-center text-xs" style={{ color: "var(--muted)" }}>
        Tap a habit to edit its icon, colour, schedule or daily target.
      </p>
    </div>
  );
}
