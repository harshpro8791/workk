export type Accent = { id: string; name: string; hex: string; ink: string };

export const ACCENTS: Accent[] = [
  { id: "violet", name: "Nebula", hex: "#7c6cff", ink: "#ffffff" },
  { id: "emerald", name: "Moss", hex: "#22c98a", ink: "#04231a" },
  { id: "sunset", name: "Sunset", hex: "#ff7a4d", ink: "#2a0d02" },
  { id: "rose", name: "Bloom", hex: "#ff5f8f", ink: "#2c0512" },
  { id: "cyan", name: "Lagoon", hex: "#31c6ff", ink: "#032131" },
  { id: "amber", name: "Honey", hex: "#ffc247", ink: "#2b1c00" },
];

export function accentByHex(hex: string): Accent {
  return ACCENTS.find((a) => a.hex === hex) ?? ACCENTS[0];
}

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const HABIT_COLORS = [
  "#7c6cff",
  "#22c98a",
  "#ff7a4d",
  "#ff5f8f",
  "#31c6ff",
  "#ffc247",
  "#9b8cff",
  "#4ade80",
];

export const EMOJIS = [
  "💧",
  "🏃",
  "📚",
  "🧘",
  "💪",
  "🥗",
  "😴",
  "✍️",
  "🎸",
  "🧠",
  "🌱",
  "☀️",
  "🚭",
  "💊",
  "🧹",
  "💻",
  "🎨",
  "🛁",
];
