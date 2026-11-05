import { dayCompletion, overallStreak } from "./store";
import { addDays, keyOf } from "./date";
import type { AppState } from "./types";

/* ----------------------------- XP & levels ----------------------------- */

export type XpBreakdown = {
  xp: number;
  completions: number;
  perfectDays: number;
  focusSessions: number;
};

/**
 * XP is *derived* from history (never mutated directly), so it survives
 * reloads, stays honest, and unlocks badges deterministically.
 * Rules: +10 per completed habit, +2 per partial tap, +40 per perfect day,
 * +25 per ~25min focus session (scaled).
 */
export function computeXp(state: AppState): XpBreakdown {
  let completions = 0;
  let perfectDays = 0;
  let taps = 0;
  let focusSessions = 0;

  for (let i = 0; i < 90; i++) {
    const d = addDays(new Date(), -i);
    const key = keyOf(d);
    const comp = dayCompletion(state, d);
    completions += comp.done;
    if (comp.total > 0 && comp.done === comp.total) perfectDays++;
    const log = state.logs[key] ?? {};
    state.habits.forEach((h) => {
      const c = log[h.id] ?? 0;
      if (c > 0) taps += Math.min(c, h.target);
    });
  }

  state.sessions.forEach((s) => {
    focusSessions += s.minutes / 25;
  });

  const xp = Math.round(completions * 10 + perfectDays * 40 + focusSessions * 25 + taps * 2);
  return { xp, completions, perfectDays, focusSessions: Math.round(focusSessions) };
}

export type Level = {
  level: number;
  into: number; // xp earned within current level
  need: number; // xp needed to reach the next level
  progress: number; // 0..1
  title: string;
};

export function levelFromXp(xp: number): Level {
  let level = 1;
  let need = 100;
  let rem = xp;
  let guard = 0;
  while (rem >= need && guard < 300) {
    rem -= need;
    level++;
    need = 100 + (level - 1) * 32;
    guard++;
  }
  return {
    level,
    into: rem,
    need,
    progress: Math.min(1, rem / need),
    title: titleFor(level),
  };
}

function titleFor(level: number): string {
  if (level >= 30) return "Living Legend";
  if (level >= 22) return "Momentum Machine";
  if (level >= 16) return "Discipline King";
  if (level >= 12) return "Routine Master";
  if (level >= 9) return "Streak Seeker";
  if (level >= 6) return "Habit Builder";
  if (level >= 4) return "Getting Serious";
  if (level >= 2) return "Rookie";
  return "Beginnner";
}

/* ------------------------------- Badges ------------------------------- */

export type Badge = {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  unlocked: boolean;
};

export type Badges = Badge[];

export function computeBadges(state: AppState, xp: XpBreakdown): Badges {
  const streak = overallStreak(state);
  const focusTotal = state.sessions.reduce((a, s) => a + s.minutes, 0);
  const habitCount = state.habits.filter((h) => !h.archived).length;

  const rules: Omit<Badge, "unlocked">[] = [
    { id: "first", name: "First Steps", emoji: "🌱", desc: "Complete any habit once" },
    { id: "fire", name: "On Fire", emoji: "🔥", desc: "Reach a 7-day overall streak" },
    { id: "unstop", name: "Unstoppable", emoji: "⚡", desc: "Reach a 30-day overall streak" },
    { id: "perfect", name: "Perfect Day", emoji: "💯", desc: "Finish every habit in one day" },
    { id: "flawless", name: "Flawless Week", emoji: "🌟", desc: "Log 7 perfect days" },
    { id: "builder", name: "Builder", emoji: "🧱", desc: "Track 3 habits at once" },
    { id: "collect", name: "Collector", emoji: "🎁", desc: "Track 8 habits at once" },
    { id: "diver", name: "Deep Diver", emoji: "🤿", desc: "Log 5 focus sessions" },
    { id: "master", name: "Focus Master", emoji: "🧠", desc: "Log 25 focus sessions" },
    { id: "timer", name: "Time Lord", emoji: "⏰", desc: "Accumulate 5 hours of focus" },
    { id: "half", name: "Half Century", emoji: "🏆", desc: "50 lifetime check-ins" },
    { id: "king", name: "Centurion", emoji: "👑", desc: "200 lifetime check-ins" },
  ];

  const flags = {
    first: xp.completions >= 1,
    fire: streak >= 7,
    unstop: streak >= 30,
    perfect: xp.perfectDays >= 1,
    flawless: xp.perfectDays >= 7,
    builder: habitCount >= 3,
    collect: habitCount >= 8,
    diver: xp.focusSessions >= 5,
    master: xp.focusSessions >= 25,
    timer: focusTotal >= 300,
    half: xp.completions >= 50,
    king: xp.completions >= 200,
  };

  return rules.map((r) => ({ ...r, unlocked: !!flags[r.id as keyof typeof flags] }));
}

/* ------------------------------ Daily shot ------------------------------ */

const CHALLENGES = [
  { emoji: "⚡", text: "Beat yesterday — clear every habit on today's list." },
  { emoji: "🔥", text: "Keep the chain alive: don't break today's streak." },
  { emoji: "🧘", text: "Block 25 quiet minutes and go phone-free." },
  { emoji: "🌊", text: "Do one habit you usually skip. Surprise yourself." },
  { emoji: "🏁", text: "Finish your first habit before noon today." },
  { emoji: "🎯", text: "Hit 100% on all habits before you sleep." },
  { emoji: "🪄", text: "Turn one resting day into a working day." },
];

const QUOTES = [
  "“We are what we repeatedly do. Excellence is a habit.”",
  "“Small steps every day build big change.”",
  "“You don't have to be extreme, just consistent.”",
  "“A year from now you'll wish you started today.”",
  "“Discipline is choosing what you want most over what you want now.”",
  "“Motivation gets you going, habit keeps you growing.”",
];

export function dailyChallenge(date: Date = new Date()): { emoji: string; text: string; quote: string } {
  const dayIndex = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const c = CHALLENGES[dayIndex % CHALLENGES.length];
  const q = QUOTES[(date.getDate() + date.getMonth()) % QUOTES.length];
  return { emoji: c.emoji, text: c.text, quote: q };
}
