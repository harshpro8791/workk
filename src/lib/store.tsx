import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Haptics } from "@capacitor/haptics";
import type { AppState, FocusSession, Habit, Settings } from "./types";
import { addDays, keyOf, todayKey } from "./date";
import { isNative } from "./pwa";
import { computeBadges, computeXp, levelFromXp } from "./gamification";

const STORAGE_KEY = "momentum.state.v1";

export const uid = () => Math.random().toString(36).slice(2, 10);

function seedState(): AppState {
  const habits: Habit[] = [
    {
      id: uid(),
      name: "Drink 2L water",
      emoji: "💧",
      color: "#31c6ff",
      target: 3,
      days: [0, 1, 2, 3, 4, 5, 6],
      createdAt: Date.now(),
    },
    {
      id: uid(),
      name: "Move for 30 min",
      emoji: "🏃",
      color: "#22c98a",
      target: 1,
      days: [1, 2, 3, 4, 5, 6],
      createdAt: Date.now(),
    },
    {
      id: uid(),
      name: "Read 10 pages",
      emoji: "📚",
      color: "#ffc247",
      target: 1,
      days: [0, 1, 2, 3, 4, 5, 6],
      createdAt: Date.now(),
    },
    {
      id: uid(),
      name: "Breathe / meditate",
      emoji: "🧘",
      color: "#7c6cff",
      target: 1,
      days: [0, 1, 2, 3, 4, 5, 6],
      createdAt: Date.now(),
    },
  ];

  // A little believable history so the charts aren't empty on first run.
  const logs: AppState["logs"] = {};
  for (let i = 1; i <= 27; i++) {
    const k = keyOf(addDays(new Date(), -i));
    logs[k] = {};
    habits.forEach((h) => {
      const roll = Math.random();
      if (roll > 0.28) logs[k][h.id] = h.target;
      else if (roll > 0.14) logs[k][h.id] = Math.max(1, h.target - 1);
    });
  }

  const sessions: FocusSession[] = [];
  for (let i = 1; i <= 12; i++) {
    if (Math.random() > 0.45) {
      sessions.push({
        id: uid(),
        date: keyOf(addDays(new Date(), -i)),
        minutes: [25, 25, 50, 15][Math.floor(Math.random() * 4)],
        label: "Deep work",
        at: Date.now() - i * 86400000,
      });
    }
  }

  return {
    habits,
    logs,
    sessions,
    settings: {
      name: "there",
      theme: "dark",
      accent: "#7c6cff",
      haptics: true,
      focusLength: 25,
      breakLength: 5,
    },
    onboarded: false,
  };
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.habits) return seedState();
    return { ...seedState(), ...parsed, settings: { ...seedState().settings, ...parsed.settings } };
  } catch {
    return seedState();
  }
}

type Ctx = {
  state: AppState;
  toggleHabit: (habitId: string, dateKey?: string) => void;
  setCount: (habitId: string, count: number, dateKey?: string) => void;
  addHabit: (h: Omit<Habit, "id" | "createdAt">) => void;
  updateHabit: (id: string, patch: Partial<Habit>) => void;
  removeHabit: (id: string) => void;
  addSession: (minutes: number, label: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetAll: () => void;
  importState: (s: AppState) => void;
  buzz: (pattern?: number | number[]) => void;
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => load());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked — app still works in-memory */
    }
  }, [state]);

  const buzz = useCallback(
    (pattern: number | number[] = 12) => {
      if (!state.settings.haptics) return;
      try {
        if (isNative()) {
          // Capacitor APK: navigator.vibrate is unavailable in Android WebView.
          const duration = Array.isArray(pattern) ? pattern.reduce((a, b) => a + b, 0) : pattern;
          void Haptics.vibrate({ duration: Math.max(10, duration) }).catch(() => {});
        } else {
          navigator.vibrate?.(pattern);
        }
      } catch {
        /* unsupported */
      }
    },
    [state.settings.haptics],
  );

  const setCount = useCallback((habitId: string, count: number, dateKey = todayKey()) => {
    setState((s) => {
      const day = { ...(s.logs[dateKey] ?? {}) };
      if (count <= 0) delete day[habitId];
      else day[habitId] = count;
      return { ...s, logs: { ...s.logs, [dateKey]: day } };
    });
  }, []);

  const toggleHabit = useCallback((habitId: string, dateKey = todayKey()) => {
    setState((s) => {
      const habit = s.habits.find((h) => h.id === habitId);
      if (!habit) return s;
      const day = { ...(s.logs[dateKey] ?? {}) };
      const current = day[habitId] ?? 0;
      const next = current >= habit.target ? 0 : current + 1;
      if (next === 0) delete day[habitId];
      else day[habitId] = next;
      return { ...s, logs: { ...s.logs, [dateKey]: day } };
    });
  }, []);

  const addHabit = useCallback((h: Omit<Habit, "id" | "createdAt">) => {
    setState((s) => ({
      ...s,
      habits: [...s.habits, { ...h, id: uid(), createdAt: Date.now() }],
    }));
  }, []);

  const updateHabit = useCallback((id: string, patch: Partial<Habit>) => {
    setState((s) => ({
      ...s,
      habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    }));
  }, []);

  const removeHabit = useCallback((id: string) => {
    setState((s) => ({ ...s, habits: s.habits.filter((h) => h.id !== id) }));
  }, []);

  const addSession = useCallback((minutes: number, label: string) => {
    setState((s) => ({
      ...s,
      sessions: [
        { id: uid(), date: todayKey(), minutes, label, at: Date.now() },
        ...s.sessions,
      ].slice(0, 400),
    }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const resetAll = useCallback(() => {
    const fresh = seedState();
    setState({ ...fresh, habits: fresh.habits, logs: {}, sessions: [], onboarded: true });
  }, []);

  const importState = useCallback((s: AppState) => setState(s), []);

  const value = useMemo<Ctx>(
    () => ({
      state,
      toggleHabit,
      setCount,
      addHabit,
      updateHabit,
      removeHabit,
      addSession,
      updateSettings,
      resetAll,
      importState,
      buzz,
    }),
    [
      state,
      toggleHabit,
      setCount,
      addHabit,
      updateHabit,
      removeHabit,
      addSession,
      updateSettings,
      resetAll,
      importState,
      buzz,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

/* ---------------- derived helpers ---------------- */

export function isScheduled(h: Habit, d: Date): boolean {
  return h.days.includes(d.getDay());
}

export function dayCompletion(state: AppState, d: Date): { done: number; total: number; pct: number } {
  const key = keyOf(d);
  const scheduled = state.habits.filter((h) => !h.archived && isScheduled(h, d));
  const log = state.logs[key] ?? {};
  const done = scheduled.filter((h) => (log[h.id] ?? 0) >= h.target).length;
  const total = scheduled.length;
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export function habitStreak(state: AppState, habit: Habit): number {
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = addDays(new Date(), -i);
    if (!isScheduled(habit, d)) continue;
    const count = state.logs[keyOf(d)]?.[habit.id] ?? 0;
    if (count >= habit.target) streak++;
    else if (i === 0) continue; // today still in progress
    else break;
  }
  return streak;
}

export function bestStreak(state: AppState, habit: Habit): number {
  let best = 0;
  let run = 0;
  for (let i = 364; i >= 0; i--) {
    const d = addDays(new Date(), -i);
    if (!isScheduled(habit, d)) continue;
    const count = state.logs[keyOf(d)]?.[habit.id] ?? 0;
    if (count >= habit.target) {
      run++;
      best = Math.max(best, run);
    } else if (i !== 0) {
      run = 0;
    }
  }
  return best;
}

export function overallStreak(state: AppState): number {
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = addDays(new Date(), -i);
    const { done, total } = dayCompletion(state, d);
    if (total === 0) continue;
    if (done === total && total > 0) streak++;
    else if (i === 0) continue;
    else break;
  }
  return streak;
}

export function focusMinutes(state: AppState, dateKey: string): number {
  return state.sessions
    .filter((s) => s.date === dateKey)
    .reduce((sum, s) => sum + s.minutes, 0);
}

export function useGamification() {
  const { state } = useStore();
  return useMemo(() => {
    const xp = computeXp(state);
    const level = levelFromXp(xp.xp);
    const badges = computeBadges(state, xp);
    return {
      xp: xp.xp,
      completions: xp.completions,
      perfectDays: xp.perfectDays,
      focusSessions: xp.focusSessions,
      level: level.level,
      into: level.into,
      need: level.need,
      progress: level.progress,
      title: level.title,
      badges,
      unlocked: badges.filter((b) => b.unlocked).length,
    };
  }, [state]);
}
