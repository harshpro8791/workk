import { useMemo } from "react";
import { AnimatedNumber, Card, Icon, SectionTitle } from "@/components/ui";
import { dayCompletion, isScheduled, overallStreak, useGamification, useStore } from "@/lib/store";
import { addDays, dayNames, keyOf, lastDays } from "@/lib/date";
import { hexToRgba } from "@/lib/accents";

export default function StatsScreen() {
  const { state } = useStore();
  const accent = state.settings.accent;
  const game = useGamification();

  const week = useMemo(() => lastDays(7), []);
  const last84 = useMemo(() => lastDays(84), []);

  const stats = useMemo(() => {
    let done = 0;
    let total = 0;
    let perfect = 0;
    last84.forEach((d) => {
      const c = dayCompletion(state, d);
      done += c.done;
      total += c.total;
      if (c.total > 0 && c.done === c.total) perfect++;
    });
    const focusTotal = state.sessions.reduce((s, x) => s + x.minutes, 0);
    return {
      rate: total ? Math.round((done / total) * 100) : 0,
      perfect,
      focusHours: (focusTotal / 60).toFixed(1),
      checkIns: done,
    };
  }, [state, last84]);

  const weeks: { key: string; pct: number; future: boolean }[][] = [];
  const start = addDays(new Date(), -83);
  const gridStart = addDays(start, -start.getDay());
  for (let w = 0; w < 13; w++) {
    const col: { key: string; pct: number; future: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(gridStart, w * 7 + d);
      const future = date > new Date();
      col.push({ key: keyOf(date), pct: future ? 0 : dayCompletion(state, date).pct, future });
    }
    weeks.push(col);
  }

  const habitRates = state.habits.map((h) => {
    let done = 0;
    let total = 0;
    for (let i = 0; i < 30; i++) {
      const d = addDays(new Date(), -i);
      if (!isScheduled(h, d)) continue;
      total++;
      if ((state.logs[keyOf(d)]?.[h.id] ?? 0) >= h.target) done++;
    }
    return {
      habit: h,
      pct: total ? Math.round((done / total) * 100) : 0,
      streak: state.logs[keyOf(new Date())]?.[h.id]
        ? overallStreak(state)
        : undefined,
    };
  });

  return (
    <div className="px-4 pb-6 pt-2">
      <header className="px-1 pt-3">
        <h1 className="text-[26px] font-bold leading-tight">Insights</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Last 12 weeks of momentum
        </p>
      </header>

      {/* Level card */}
      <Card
        className="anim-fade-up mt-5 overflow-hidden"
        style={{ background: `linear-gradient(145deg, ${hexToRgba(accent, 0.25)}, var(--surface) 62%)` }}
      >
        <div className="flex items-center gap-4">
          <div
            className="anim-floaty grid h-16 w-16 shrink-0 place-items-center rounded-[22px] text-3xl"
            style={{ background: `linear-gradient(150deg, ${accent}, ${hexToRgba(accent, 0.45)})` }}
          >
            {game.level >= 10 ? "👑" : game.level >= 5 ? "⚡" : "⭐"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: accent }}>
              Level {game.level} · {game.unlocked}/{game.badges.length} badges
            </p>
            <p className="text-xl font-bold leading-tight">{game.title}</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full" style={{ background: "rgba(0,0,0,0.25)" }}>
              <div
                className="relative h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.max(3, game.progress * 100)}%`, background: accent }}
              >
                <span className="shine absolute inset-0 rounded-full" />
              </div>
            </div>
            <p className="mt-1.5 text-[11px]" style={{ color: "var(--muted)" }}>
              <AnimatedNumber value={game.into} /> / {game.need} XP to next level ·{" "}
              <AnimatedNumber value={game.xp} /> total XP
            </p>
          </div>
        </div>
      </Card>

      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        <Stat icon="flame" label="Current streak" value={`${overallStreak(state)}d`} accent={accent} />
        <Stat icon="target" label="Completion" value={`${stats.rate}%`} accent={accent} />
        <Stat icon="sparkle" label="Perfect days" value={`${stats.perfect}`} accent={accent} />
        <Stat icon="clock" label="Focus hours" value={stats.focusHours} accent={accent} />
      </div>

      {/* Badges */}
      <SectionTitle
        right={
          <span className="text-[12px]" style={{ color: "var(--muted)" }}>
            {game.unlocked} / {game.badges.length}
          </span>
        }
      >
        Badges
      </SectionTitle>
      <div className="grid grid-cols-4 gap-2">
        {game.badges.map((b, i) => (
          <div
            key={b.id}
            className="badge-pop grid place-items-center rounded-2xl border py-3"
            style={{
              animationDelay: `${Math.min(i * 35, 400)}ms`,
              background: b.unlocked ? hexToRgba(accent, 0.16) : "var(--surface)",
              borderColor: b.unlocked ? hexToRgba(accent, 0.4) : "var(--line)",
              opacity: b.unlocked ? 1 : 0.55,
            }}
            title={`${b.name} — ${b.desc}`}
          >
            <span className="text-2xl" style={{ filter: b.unlocked ? "none" : "grayscale(1)" }}>
              {b.emoji}
            </span>
            <p className="mt-1.5 text-center text-[10px] font-semibold leading-tight">{b.name}</p>
          </div>
        ))}
      </div>

      <SectionTitle>This week</SectionTitle>
      <Card>
        <div className="flex h-36 items-end justify-between gap-2">
          {week.map((d) => {
            const c = dayCompletion(state, d);
            const h = Math.max(6, (c.pct / 100) * 116);
            return (
              <div key={keyOf(d)} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[10px] font-semibold" style={{ color: "var(--muted)" }}>
                  {c.pct}%
                </span>
                <div
                  className="w-full rounded-t-lg transition-all duration-500"
                  style={{
                    height: h,
                    background:
                      c.pct === 100
                        ? accent
                        : `linear-gradient(180deg, ${hexToRgba(accent, 0.85)}, ${hexToRgba(accent, 0.25)})`,
                  }}
                />
                <span className="text-[11px]" style={{ color: "var(--muted)" }}>
                  {dayNames[d.getDay()][0]}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <SectionTitle>Consistency map</SectionTitle>
      <Card>
        <div className="no-scrollbar overflow-x-auto">
          <div className="flex gap-[4px]">
            {weeks.map((col, i) => (
              <div key={i} className="flex flex-col gap-[4px]">
                {col.map((cell) => (
                  <span
                    key={cell.key}
                    title={`${cell.key} · ${cell.pct}%`}
                    className="h-[13px] w-[13px] rounded-[4px]"
                    style={{
                      background: cell.future
                        ? "transparent"
                        : cell.pct === 0
                          ? "var(--surface-3)"
                          : hexToRgba(accent, 0.2 + (cell.pct / 100) * 0.8),
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px]" style={{ color: "var(--muted)" }}>
          Less
          {[0.15, 0.4, 0.65, 1].map((o) => (
            <span key={o} className="h-3 w-3 rounded-[3px]" style={{ background: hexToRgba(accent, o) }} />
          ))}
          More
        </div>
      </Card>

      <SectionTitle>Per habit · 30 days</SectionTitle>
      <div className="flex flex-col gap-2.5">
        {habitRates.map(({ habit, pct }) => (
          <Card key={habit.id} className="!py-3.5">
            <div className="flex items-center gap-3">
              <span className="text-lg">{habit.emoji}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{habit.name}</span>
              <span className="text-sm font-semibold" style={{ color: habit.color }}>
                {pct}%
              </span>
            </div>
            <div className="mt-2.5 h-2 overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: habit.color }}
              />
            </div>
          </Card>
        ))}
        {habitRates.length === 0 && (
          <Card className="py-8 text-center text-sm" style={{ color: "var(--muted)" }}>
            Add habits to unlock insights.
          </Card>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <Card className="!p-4">
      <div
        className="grid h-9 w-9 place-items-center rounded-xl"
        style={{ background: hexToRgba(accent, 0.16), color: accent }}
      >
        <Icon name={icon} size={17} />
      </div>
      <p className="mt-3 text-2xl font-bold leading-none">{value}</p>
      <p className="mt-1.5 text-xs" style={{ color: "var(--muted)" }}>
        {label}
      </p>
    </Card>
  );
}
