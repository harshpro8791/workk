export type Habit = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  target: number; // times per day
  days: number[]; // 0-6 (Sun-Sat) schedule
  createdAt: number;
  archived?: boolean;
};

export type Logs = Record<string, Record<string, number>>; // dateKey -> habitId -> count

export type FocusSession = {
  id: string;
  date: string; // dateKey
  minutes: number;
  label: string;
  at: number;
};

export type Settings = {
  name: string;
  theme: "dark" | "light";
  accent: string;
  haptics: boolean;
  focusLength: number;
  breakLength: number;
};

export type AppState = {
  habits: Habit[];
  logs: Logs;
  sessions: FocusSession[];
  settings: Settings;
  onboarded: boolean;
};
