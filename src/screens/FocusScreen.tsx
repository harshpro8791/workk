import { useCallback, useEffect, useRef, useState } from "react";
import { Card, Icon, Ring, SectionTitle } from "@/components/ui";
import { confetti, toast } from "@/components/effects";
import { focusMinutes, useStore } from "@/lib/store";
import { formatClock, todayKey } from "@/lib/date";
import { hexToRgba } from "@/lib/accents";
import { cn } from "@/utils/cn";

const PRESETS = [15, 25, 50];

function chime() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.25, now + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.45);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch {
    /* audio blocked */
  }
}

export default function FocusScreen() {
  const { state, addSession, updateSettings, buzz } = useStore();
  const accent = state.settings.accent;
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [label, setLabel] = useState("Deep work");
  const total = (mode === "focus" ? state.settings.focusLength : state.settings.breakLength) * 60;
  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(false);
  const endRef = useRef<number>(0);
  const wakeRef = useRef<{ release: () => Promise<void> } | null>(null);

  useEffect(() => {
    if (!running) setRemaining(total);
  }, [total, running]);

  const finish = useCallback(() => {
    setRunning(false);
    buzz([40, 80, 40, 80, 120]);
    chime();
    if (mode === "focus") {
      addSession(state.settings.focusLength, label.trim() || "Focus");
      toast(`${state.settings.focusLength} min session done`, "🚀");
      confetti(90, [accent, "#ffffff", "#31c6ff"]);
      setMode("break");
      setRemaining(state.settings.breakLength * 60);
    } else {
      setMode("focus");
      setRemaining(state.settings.focusLength * 60);
    }
  }, [mode, addSession, state.settings.focusLength, state.settings.breakLength, label, buzz]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const left = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        window.clearInterval(id);
        finish();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [running, finish]);

  // Keep the Android screen awake while a session runs.
  useEffect(() => {
    const nav = navigator as Navigator & {
      wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> };
    };
    if (running && nav.wakeLock) {
      nav.wakeLock
        .request("screen")
        .then((s) => {
          wakeRef.current = s;
        })
        .catch(() => {});
    }
    return () => {
      wakeRef.current?.release?.().catch(() => {});
      wakeRef.current = null;
    };
  }, [running]);

  const start = () => {
    endRef.current = Date.now() + remaining * 1000;
    setRunning(true);
    buzz(14);
  };
  const pause = () => {
    setRunning(false);
    buzz(8);
  };
  const reset = () => {
    setRunning(false);
    setRemaining(total);
    buzz(10);
  };

  const todayMins = focusMinutes(state, todayKey());
  const todaySessions = state.sessions.filter((s) => s.date === todayKey());
  const progress = total === 0 ? 0 : 1 - remaining / total;

  return (
    <div className="px-4 pb-6 pt-2">
      <header className="px-1 pt-3">
        <h1 className="text-[26px] font-bold leading-tight">Focus</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {todayMins} minutes deep today · {todaySessions.length} session
          {todaySessions.length === 1 ? "" : "s"}
        </p>
      </header>

      {/* Mode switch */}
      <div
        className="mt-5 flex rounded-2xl border p-1"
        style={{ background: "var(--surface)", borderColor: "var(--line)" }}
      >
        {(["focus", "break"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setRunning(false);
              setRemaining((m === "focus" ? state.settings.focusLength : state.settings.breakLength) * 60);
            }}
            className="press h-10 flex-1 rounded-xl text-sm font-semibold capitalize transition-colors"
            style={{
              background: mode === m ? accent : "transparent",
              color: mode === m ? "#fff" : "var(--muted)",
            }}
          >
            {m === "focus" ? "Focus" : "Break"}
          </button>
        ))}
      </div>

      {/* Timer */}
      <div className="mt-7 grid place-items-center">
        <div className={cn("rounded-full", running && "pulse-ring")}>
          <Ring progress={progress} size={252} stroke={16} color={accent}>
            <div className="text-center">
              <div className="text-[54px] font-bold leading-none tabular-nums">
                {formatClock(remaining)}
              </div>
              <div className="mt-2 text-xs uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                {mode === "focus" ? label || "Focus" : "Recharge"}
              </div>
            </div>
          </Ring>
        </div>
      </div>

      <div className="mt-7 flex items-center justify-center gap-4">
        <button
          onClick={reset}
          className="press grid h-14 w-14 place-items-center rounded-full border"
          style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--muted)" }}
          aria-label="Reset timer"
        >
          <Icon name="reset" size={22} />
        </button>
        <button
          onClick={running ? pause : start}
          className="press grid h-[74px] w-[74px] place-items-center rounded-full"
          style={{ background: accent, color: "#fff", boxShadow: `0 12px 34px ${hexToRgba(accent, 0.45)}` }}
          aria-label={running ? "Pause" : "Start"}
        >
          <Icon name={running ? "pause" : "play"} size={30} fill={!running} strokeWidth={2.2} />
        </button>
        <button
          onClick={() => {
            const next = state.settings.focusLength === 50 ? 15 : state.settings.focusLength + 10;
            updateSettings({ focusLength: next });
            if (mode === "focus" && !running) setRemaining(next * 60);
          }}
          className="press grid h-14 w-14 place-items-center rounded-full border text-xs font-bold"
          style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--muted)" }}
          aria-label="Change length"
        >
          {state.settings.focusLength}m
        </button>
      </div>

      {mode === "focus" && (
        <>
          <SectionTitle>Session length</SectionTitle>
          <div className="flex gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => {
                  updateSettings({ focusLength: p });
                  if (!running) setRemaining(p * 60);
                  buzz(8);
                }}
                className="press h-11 flex-1 rounded-2xl border text-sm font-semibold"
                style={{
                  background: state.settings.focusLength === p ? hexToRgba(accent, 0.18) : "var(--surface)",
                  borderColor: state.settings.focusLength === p ? accent : "var(--line)",
                  color: state.settings.focusLength === p ? accent : "var(--text)",
                }}
              >
                {p} min
              </button>
            ))}
          </div>

          <SectionTitle>What are you working on?</SectionTitle>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Deep work"
            className="h-12 w-full rounded-2xl border px-4 text-[15px] outline-none"
            style={{ background: "var(--surface)", borderColor: "var(--line)", color: "var(--text)" }}
          />
        </>
      )}

      <SectionTitle>Recent sessions</SectionTitle>
      {state.sessions.length === 0 ? (
        <Card className="py-8 text-center text-sm" style={{ color: "var(--muted)" }}>
          Finish a session and it'll be logged here.
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {state.sessions.slice(0, 6).map((s) => (
            <li key={s.id}>
              <Card className="flex items-center gap-3 !py-3">
                <div
                  className="grid h-10 w-10 place-items-center rounded-xl"
                  style={{ background: hexToRgba(accent, 0.16), color: accent }}
                >
                  <Icon name="bolt" size={18} fill />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{s.label}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {s.date === todayKey() ? "Today" : s.date}
                  </p>
                </div>
                <span className="text-sm font-semibold" style={{ color: accent }}>
                  {s.minutes}m
                </span>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
