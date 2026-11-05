export const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function keyOf(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return keyOf(new Date());
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

/** Last n days ending today, oldest first. */
export function lastDays(n: number): Date[] {
  const out: Date[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) out.push(addDays(now, -i));
  return out;
}

export function prettyDate(d: Date): string {
  return `${dayNames[d.getDay()]}, ${monthNames[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${`${m}`.padStart(2, "0")}:${`${s}`.padStart(2, "0")}`;
}
