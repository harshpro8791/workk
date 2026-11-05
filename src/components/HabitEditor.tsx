import { useEffect, useState } from "react";
import { Icon, Sheet } from "@/components/ui";
import { EMOJIS, HABIT_COLORS, hexToRgba } from "@/lib/accents";
import { useStore } from "@/lib/store";
import type { Habit } from "@/lib/types";
import { dayNames } from "@/lib/date";
import { cn } from "@/utils/cn";

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function HabitEditor({
  open,
  habit,
  onClose,
}: {
  open: boolean;
  habit: Habit | null;
  onClose: () => void;
}) {
  const { addHabit, updateHabit, removeHabit, buzz, state } = useStore();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("💧");
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const [target, setTarget] = useState(1);
  const [days, setDays] = useState<number[]>(ALL_DAYS);

  useEffect(() => {
    if (!open) return;
    if (habit) {
      setName(habit.name);
      setEmoji(habit.emoji);
      setColor(habit.color);
      setTarget(habit.target);
      setDays(habit.days);
    } else {
      setName("");
      setEmoji(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
      setColor(HABIT_COLORS[Math.floor(Math.random() * HABIT_COLORS.length)]);
      setTarget(1);
      setDays(ALL_DAYS);
    }
  }, [open, habit]);

  const save = () => {
    const trimmed = name.trim() || "New habit";
    if (habit) updateHabit(habit.id, { name: trimmed, emoji, color, target, days });
    else addHabit({ name: trimmed, emoji, color, target, days });
    buzz([12, 24, 12]);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title={habit ? "Edit habit" : "New habit"}>
      <div className="flex items-center gap-3">
        <div
          className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl"
          style={{ background: hexToRgba(color, 0.18) }}
        >
          {emoji}
        </div>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Walk 8,000 steps"
          className="h-14 w-full rounded-2xl border px-4 text-[15px] outline-none"
          style={{ background: "var(--surface-2)", borderColor: "var(--line)", color: "var(--text)" }}
        />
      </div>

      <Label>Icon</Label>
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => setEmoji(e)}
            className="press grid h-11 w-11 shrink-0 place-items-center rounded-xl border text-lg"
            style={{
              background: e === emoji ? hexToRgba(color, 0.2) : "var(--surface-2)",
              borderColor: e === emoji ? color : "var(--line)",
            }}
          >
            {e}
          </button>
        ))}
      </div>

      <Label>Colour</Label>
      <div className="flex flex-wrap gap-2.5">
        {HABIT_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className="press grid h-9 w-9 place-items-center rounded-full"
            style={{ background: c, boxShadow: c === color ? `0 0 0 3px var(--surface), 0 0 0 5px ${c}` : "none" }}
          >
            {c === color && <Icon name="check" size={15} strokeWidth={3} className="text-white" />}
          </button>
        ))}
      </div>

      <Label>Times per day</Label>
      <div className="flex items-center gap-3">
        <StepBtn onClick={() => setTarget((t) => Math.max(1, t - 1))} icon="close" label="−" />
        <div className="grid h-11 flex-1 place-items-center rounded-2xl border text-lg font-semibold"
          style={{ background: "var(--surface-2)", borderColor: "var(--line)" }}>
          {target}×
        </div>
        <StepBtn onClick={() => setTarget((t) => Math.min(12, t + 1))} icon="plus" label="+" />
      </div>

      <Label>Repeat on</Label>
      <div className="flex justify-between gap-1.5">
        {ALL_DAYS.map((d) => {
          const on = days.includes(d);
          return (
            <button
              key={d}
              onClick={() => setDays((cur) => (on ? cur.filter((x) => x !== d) : [...cur, d]))}
              className="press h-11 flex-1 rounded-xl border text-xs font-semibold"
              style={{
                background: on ? hexToRgba(color, 0.2) : "var(--surface-2)",
                borderColor: on ? color : "var(--line)",
                color: on ? color : "var(--muted)",
              }}
            >
              {dayNames[d][0]}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex gap-2.5">
        {habit && (
          <button
            onClick={() => {
              removeHabit(habit.id);
              buzz(20);
              onClose();
            }}
            className="press grid h-12 w-12 shrink-0 place-items-center rounded-2xl border"
            style={{ borderColor: "rgba(255,90,110,0.4)", color: "#ff5a6e" }}
            aria-label="Delete habit"
          >
            <Icon name="trash" size={19} />
          </button>
        )}
        <button
          onClick={save}
          className={cn("press h-12 flex-1 rounded-2xl text-[15px] font-semibold")}
          style={{ background: state.settings.accent, color: "#fff" }}
        >
          {habit ? "Save changes" : "Add habit"}
        </button>
      </div>
    </Sheet>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>
      {children}
    </p>
  );
}

function StepBtn({ onClick, label }: { onClick: () => void; icon: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className="press grid h-11 w-12 place-items-center rounded-2xl border text-xl font-semibold"
      style={{ background: "var(--surface-2)", borderColor: "var(--line)" }}
    >
      {label}
    </button>
  );
}
