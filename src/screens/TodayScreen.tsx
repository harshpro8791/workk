import { useEffect, useMemo, useState } from "react";
import { AnimatedNumber, Card, Icon, Ring, SectionTitle } from "@/components/ui";
import { confetti, toast } from "@/components/effects";
import { useGamification } from "@/lib/store";
import {
  dayCompletion,
  focusMinutes,
  habitStreak,
  isScheduled,
  overallStreak,
  useStore,
} from "@/lib/store";
import { dayNames, greeting, keyOf, lastDays, prettyDate, todayKey } from "@/lib/date";
import { hexToRgba } from "@/lib/accents";
import { dailyChallenge } from "@/lib/gamification";
import { cn } from "@/utils/cn";
import type { Habit } from "@/lib/types";

export default function TodayScreen({ onAdd }: { onAdd: () => void }) {
  const { state, toggleHabit, buzz } = useStore();
  const accent = state.settings.accent;
  const [todayNow, setTodayNow] = useState<string>(todayKey());
  const [selected, setSelected] = useState<string>(todayNow);
  const [week, setWeek] = useState<Date[]>(() => lastDays(7));

  // Keep "today" accurate across midnight rollovers, app resume from
  // background, and device clock changes — not just at mount time.
  useEffect(() => {
    const resync = () => {
      const freshKey = todayKey();
      setTodayNow((prevToday) => {
        if (freshKey === prevToday) return prevToday;
        setWeek(lastDays(7));
        // Only auto-advance the selection if the user hadn't picked a
        // custom past day — otherwise jump them off whatever they chose.
        setSelected((prevSelected) => (prevSelected === prevToday ? freshKey : prevSelected));
        return freshKey;
      });
    };

    resync();
    const onVisible = () => {
      if (document.visibilityState === "visible") resync();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", resync);

    // Also catch a plain midnight rollover while the app stays foregrounded.
    const msUntilMidnight = () => {
      const next = new Date();
      next.setHours(24, 0, 5, 0);
      return next.getTime() - Date.now();
    };
    let timeoutId = window.setTimeout(function tick() {
      resync();
      timeoutId = window.setTimeout(tick, msUntilMidnight());
    }, msUntilMidnight());

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", resync);
      window.clearTimeout(timeoutId);
    };
  }, []);
  const [bursts, setBursts] = useState<Record<string, number[]>>({});
  const level = useGamification();

  const selectedDate = useMemo(() => {
    const [y, m, d] = selected.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [selected]);

  const comp = dayCompletion(state, selectedDate);
  const log = state.logs[selected] ?? {};
  const habits = state.habits.filter((h) => !h.archived && isScheduled(h, selectedDate));
  const streak = overallStreak(state);
  const mins = focusMinutes(state, selected);
  const isToday = selected === todayKey();
  const challenge = useMemo(() => dailyChallenge(), []);

  const spawnBurst = (habitId: string) => {
    const id = Date.now();
    setBursts((b) => ({ ...b, [habitId]: [...(b[habitId] ?? []), id] }));
    setTimeout(() => {
      setBursts((b) => ({ ...b, [habitId]: (b[habitId] ?? []).filter((x) => x !== id) }));
    }, 950);
  };

  const onHabitTap = (h: Habit) => {
    const count = log[h.id] ?? 0;
    if (count >= h.target) {
      // unchecking — no XP, just a soft undo
      toggleHabit(h.id, selected);
      buzz(8);
      return;
    }
    const willComplete = count + 1 >= h.target;
    const gain = willComplete ? 10 : 2;
    toggleHabit(h.id, selected);
    spawnBurst(h.id);
    buzz(willComplete ? [10, 30, 16] : 12);

    if (willComplete) {
      confetti(70, [h.color, "#ffffff", accent]);
      toast(`${h.name} +${gain} XP`, "🎉");
      // check for a perfect day
      if (isToday) {
        const afterDone = habits.filter(
          (x) => (x.id === h.id ? true : (log[x.id] ?? 0) >= x.target),
        ).length;
        const total = habits.length;
        if (total > 0 && afterDone === total) {
          setTimeout(() => {
            confetti(160, [accent, "#ffffff", "#ffc247"]);
            toast("Perfect day! +40 XP", "💯");
          }, 450);
        }
      }
    } else {
      toast(`+${gain} XP`, "✨");
    }
  };

  return (
    <div className="px-4 pb-6 pt-2">
      <header className="flex items-start justify-between px-1 pt-2">
        <div className="anim-fade-up">
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {greeting()}, {state.settings.name}
          </p>
          <h1 className="mt-0.5 text-[26px] font-bold leading-tight">
            {isToday ? "Today" : prettyDate(selectedDate)}
          </h1>
        </div>
        <div
          className="anim-fade-up flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold"
          style={{ background: hexToRgba(accent, 0.16), color: accent }}
          title={`${streak} day overall streak`}
        >
          <span className="flame-flicker">
            <Icon name="flame" size={16} fill />
          </span>
          {streak}d
        </div>
      </header>

      {/* Level / XP bar */}
      <div className="anim-fade-up mt-4" style={{ animationDelay: "40ms" }}>
        <div className="flex items-center justify-between px-1 text-[13px]">
          <span className="font-semibold" style={{ color: accent }}>
            Level {level.level} · {level.title}
          </span>
          <span style={{ color: "var(--muted)" }}>
            <AnimatedNumber value={level.into} /> / {level.need} XP
          </span>
        </div>
        <div
          className="mt-1.5 h-2.5 overflow-hidden rounded-full"
          style={{ background: "var(--surface-3)" }}
        >
          <div
            className="relative h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.max(3, level.progress * 100)}%`,
              background: `linear-gradient(90deg, ${accent}, ${hexToRgba(accent, 0.6)})`,
            }}
          >
            <span className="shine absolute inset-0 rounded-full" />
          </div>
        </div>
      </div>

      {/* Hero progress */}
      <Card
        className="anim-fade-up glow-pulse mt-4 overflow-hidden !p-0"
        style={{
          background: `linear-gradient(150deg, ${hexToRgba(accent, 0.22)}, var(--surface) 62%)`,
        }}
      >
        <div className="flex items-center gap-4 p-5">
          <Ring progress={comp.total ? comp.done / comp.total : 0} size={124} stroke={11} color={accent}>
            <div className="text-center">
              <div className="text-2xl font-bold">
                <AnimatedNumber value={comp.pct} />
                %
              </div>
              <div className="text-[11px]" style={{ color: "var(--muted)" }}>
                {comp.done}/{comp.total} done
              </div>
            </div>
          </Ring>
          <div className="flex-1">
            <p className="text-[15px] font-semibold leading-snug">
              {comp.total === 0
                ? "Nothing scheduled — enjoy the day."
                : comp.pct === 100
                  ? "All rings closed. Beautiful."
                  : comp.pct >= 50
                    ? "Halfway there — keep the streak."
                    : "Small steps compound. Start one."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip icon="clock" label={`${mins}m focus`} />
              <Chip icon="target" label={`${habits.length} habits`} />
            </div>
          </div>
        </div>
      </Card>

      {/* Daily challenge */}
      <Card
        className="anim-fade-up mt-3 !py-3.5"
        style={{ animationDelay: "80ms", borderColor: hexToRgba(accent, 0.3) }}
      >
        <div className="flex items-center gap-3">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-xl"
            style={{ background: hexToRgba(accent, 0.16) }}
          >
            {challenge.emoji}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: accent }}>
              Daily challenge
            </p>
            <p className="text-[13px] font-medium leading-snug">{challenge.text}</p>
            <p className="mt-1 text-xs italic" style={{ color: "var(--muted)" }}>
              {challenge.quote}
            </p>
          </div>
        </div>
      </Card>

      {/* Week strip */}
      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto px-0.5 pb-1">
        {week.map((d, idx) => {
          const k = keyOf(d);
          const c = dayCompletion(state, d);
          const active = k === selected;
          return (
            <button
              key={k}
              onClick={() => {
                setSelected(k);
                buzz(8);
              }}
              className={cn(
                "press anim-spring flex min-w-[54px] flex-1 flex-col items-center gap-1.5 rounded-2xl border py-2.5",
              )}
              style={{
                background: active ? hexToRgba(accent, 0.16) : "var(--surface)",
                borderColor: active ? accent : "var(--line)",
                animationDelay: `${Math.min(idx * 40, 280)}ms`,
              }}
            >
              <span className="text-[11px]" style={{ color: "var(--muted)" }}>
                {dayNames[d.getDay()][0]}
              </span>
              <Ring
                progress={c.total ? c.done / c.total : 0}
                size={30}
                stroke={3.5}
                color={accent}
                track="var(--surface-3)"
              >
                <span className="text-[11px] font-semibold">{d.getDate()}</span>
              </Ring>
            </button>
          );
        })}
      </div>

      <SectionTitle
        right={
          <button
            onClick={onAdd}
            className="press flex items-center gap-1 text-[13px] font-semibold"
            style={{ color: accent }}
          >
            <Icon name="plus" size={15} /> New
          </button>
        }
      >
        {isToday ? "Today's habits" : "Habits"}
      </SectionTitle>

      {habits.length === 0 ? (
        <Card className="grid place-items-center gap-3 py-10 text-center">
          <div
            className="grid h-14 w-14 place-items-center rounded-2xl"
            style={{ background: hexToRgba(accent, 0.16), color: accent }}
          >
            <Icon name="sparkle" size={26} />
          </div>
          <div>
            <p className="font-semibold">No habits scheduled</p>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              Add one and it'll show up right here.
            </p>
          </div>
          <button
            onClick={onAdd}
            className="press mt-1 rounded-full px-5 py-2.5 text-sm font-semibold"
            style={{ background: accent, color: "#fff" }}
          >
            Create a habit
          </button>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {habits.map((h, i) => {
            const count = log[h.id] ?? 0;
            const done = count >= h.target;
            const hstreak = habitStreak(state, h);
            return (
              <li
                key={h.id}
                className="anim-fade-up"
                style={{ animationDelay: `${Math.min(i * 45, 300)}ms` }}
              >
                <Card
                  onClick={() => onHabitTap(h)}
                  className="relative flex items-center gap-3.5 !py-3.5"
                  style={{
                    background: done ? hexToRgba(h.color, 0.14) : "var(--surface)",
                    borderColor: done ? hexToRgba(h.color, 0.45) : "var(--line)",
                  }}
                >
                  {/* floating XP particles */}
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    {(bursts[h.id] ?? []).map((b, j) => (
                      <span
                        key={b}
                        className="xp-float absolute right-3 top-1 text-sm font-extrabold"
                        style={{ color: accent, animationDelay: `${j * 90}ms`, textShadow: `0 0 12px ${hexToRgba(accent, 0.7)}` }}
                      >
                        +{(count >= h.target ? 10 : 2)}XP
                      </span>
                    ))}
                  </div>

                  <div
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl"
                    style={{ background: hexToRgba(h.color, 0.18) }}
                  >
                    {h.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate font-semibold", done && "opacity-70 line-through")}>
                      {h.name}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      {h.target > 1 && (
                        <div
                          className="h-1.5 w-20 overflow-hidden rounded-full"
                          style={{ background: "var(--surface-3)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, (count / h.target) * 100)}%`,
                              background: h.color,
                            }}
                          />
                        </div>
                      )}
                      <span className="text-xs" style={{ color: "var(--muted)" }}>
                        {h.target > 1 ? `${count}/${h.target}` : done ? "Completed" : "Tap to complete"}
                      </span>
                      {hstreak > 1 && (
                        <span
                          className="flex items-center gap-0.5 text-xs font-semibold"
                          style={{ color: h.color }}
                        >
                          <span className="flame-flicker inline-flex">
                            <Icon name="flame" size={12} fill />
                          </span>
                          {hstreak}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-all",
                      done && "anim-pop",
                    )}
                    style={{
                      background: done ? h.color : "transparent",
                      borderColor: done ? h.color : "var(--line)",
                      color: done ? "#fff" : "var(--muted)",
                    }}
                  >
                    <Icon name={done ? "check" : "plus"} size={16} strokeWidth={2.4} />
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-5 text-center text-xs" style={{ color: "var(--muted)" }}>
        Tap a habit to earn XP · finish everything for a perfect day 🔥
      </p>
    </div>
  );
}

function Chip({ icon, label }: { icon: string; label: string }) {
  return (
    <span
      className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
      style={{ borderColor: "var(--line)", background: "var(--surface-2)", color: "var(--muted)" }}
    >
      <Icon name={icon} size={13} />
      {label}
    </span>
  );
}
