import { Icon } from "@/components/ui";
import { hexToRgba } from "@/lib/accents";

export type TabId = "today" | "habits" | "focus" | "stats" | "settings";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "today", label: "Today", icon: "today" },
  { id: "habits", label: "Habits", icon: "habits" },
  { id: "focus", label: "Focus", icon: "focus" },
  { id: "stats", label: "Stats", icon: "stats" },
  { id: "settings", label: "You", icon: "settings" },
];

export default function BottomNav({
  active,
  onChange,
  accent,
}: {
  active: TabId;
  onChange: (t: TabId) => void;
  accent: string;
}) {
  return (
    <nav
      className="glass relative z-30 mx-auto flex w-full max-w-[560px] shrink-0 items-stretch justify-around border-t px-1 pb-[max(10px,env(safe-area-inset-bottom))] pt-2"
      style={{ background: "color-mix(in srgb, var(--surface) 82%, transparent)", borderColor: "var(--line)" }}
    >
      {TABS.map((t) => {
        const on = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="press flex flex-1 flex-col items-center gap-1 py-1"
            aria-current={on ? "page" : undefined}
          >
            <span
              className="grid h-8 w-[58px] place-items-center rounded-full transition-all duration-200"
              style={{
                background: on ? hexToRgba(accent, 0.2) : "transparent",
                color: on ? accent : "var(--muted)",
              }}
            >
              <Icon name={t.icon} size={21} strokeWidth={on ? 2.1 : 1.7} />
            </span>
            <span
              className="text-[11px] font-medium transition-colors"
              style={{ color: on ? accent : "var(--muted)" }}
            >
              {t.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
