import { useEffect, useRef, useState } from "react";
import { hexToRgba } from "@/lib/accents";

/* ------------------------- event helpers (emit) ------------------------- */

function emit(name: string, detail?: unknown) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export function confetti(count = 120, colors?: string[]) {
  emit("momentum:confetti", { count, colors });
}

export function toast(msg: string, emoji = "✨") {
  emit("momentum:toast", { msg, emoji });
}

export function levelUp(level: number, title: string) {
  emit("momentum:levelup", { level, title });
}

/* ------------------------- confetti particle engine ------------------------- */

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rot: number;
  vr: number;
  shape: number; // 0 rect, 1 circle
  life: number;
  lifeMax: number;
};

let particles: Particle[] = [];
let raf = 0;
let running = false;
const DEFAULT_COLORS = ["#ffffff", "#7c6cff", "#ffc247", "#ff5f8f", "#31c6ff", "#22c98a"];

function spawn(detail: { count?: number; colors?: string[] }) {
  const count = detail?.count ?? 120;
  const palette = detail?.colors?.length ? detail.colors : DEFAULT_COLORS;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const sources = [
    { x: w * 0.12, y: h },
    { x: w * 0.88, y: h },
    { x: w * 0.5, y: h * 0.55 },
  ];
  for (let i = 0; i < count; i++) {
    const src = sources[Math.floor(Math.random() * sources.length)];
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI * 0.9);
    const speed = (8 + Math.random() * 9) * (h / 760 + 0.5);
    particles.push({
      x: src.x + (Math.random() - 0.5) * 60,
      y: src.y + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * speed * (0.6 + Math.random() * 0.7),
      vy: Math.sin(angle) * speed,
      size: 5 + Math.random() * 7,
      color: palette[Math.floor(Math.random() * palette.length)],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      shape: Math.random() > 0.5 ? 0 : 1,
      life: 0,
      lifeMax: 70 + Math.random() * 60,
    });
  }
  start();
}

function start() {
  if (running) return;
  running = true;
  raf = requestAnimationFrame(tick);
}

function tick() {
  const canvas = canvasRef;
  if (canvas && particles.length) {
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.vy += 0.22;
        p.vx *= 0.99;
        p.vy *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        const alpha = Math.max(0, 1 - p.life / p.lifeMax);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        if (p.shape === 0) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        if (p.life >= p.lifeMax || p.y > canvas.height + 40) particles.splice(i, 1);
      }
      ctx.globalAlpha = 1;
    }
  }
  if (particles.length) {
    raf = requestAnimationFrame(tick);
  } else {
    running = false;
    if (canvas) canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  }
}

let canvasRef: HTMLCanvasElement | null = null;

/* ------------------------------ React layer ------------------------------ */

type ToastMsg = { id: number; msg: string; emoji: string };
type LevelUp = { level: number; title: string };

export default function CelebrationLayer({ accent }: { accent: string }) {
  const canvasEL = useRef<HTMLCanvasElement>(null);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [lvl, setLvl] = useState<LevelUp | null>(null);
  const idRef = useRef(0);

  useEffect(() => {
    canvasRef = canvasEL.current;

    const onConfetti = (e: Event) => {
      const d = (e as CustomEvent).detail as { count?: number; colors?: string[] };
      if (canvasRef) {
        const ctx = canvasRef.getContext("2d");
        if (ctx) {
          const scale = window.devicePixelRatio || 1;
          canvasRef.width = window.innerWidth * scale;
          canvasRef.height = window.innerHeight * scale;
          ctx.setTransform(scale, 0, 0, scale, 0, 0);
        }
      }
      spawn(d);
    };

    const onToast = (e: Event) => {
      const d = (e as CustomEvent).detail as { msg: string; emoji: string };
      const id = ++idRef.current;
      setToasts((t) => [...t, { id, msg: d.msg, emoji: d.emoji }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
    };

    const onLevel = (e: Event) => {
      const d = (e as CustomEvent).detail as LevelUp;
      setLvl(d);
      spawn({ count: 160, colors: [accent, "#ffffff", "#ffc247"] });
      setTimeout(() => setLvl(null), 3200);
    };

    window.addEventListener("momentum:confetti", onConfetti);
    window.addEventListener("momentum:toast", onToast);
    window.addEventListener("momentum:levelup", onLevel);
    return () => {
      window.removeEventListener("momentum:confetti", onConfetti);
      window.removeEventListener("momentum:toast", onToast);
      window.removeEventListener("momentum:levelup", onLevel);
    };
  }, [accent]);

  useEffect(() => () => cancelAnimationFrame(raf), []);

  return (
    <>
      <canvas
        ref={canvasEL}
        className="pointer-events-none absolute inset-0 z-[70] h-full w-full"
      />

      {/* toasts — stack above the nav bar */}
      <div className="pointer-events-none absolute inset-x-0 bottom-24 z-[80] flex flex-col items-center gap-2 px-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="toast-in flex items-center gap-2 rounded-full border px-4 py-2.5 text-[13px] font-semibold shadow-xl"
            style={{ background: "var(--surface-2)", borderColor: "var(--line)", color: "var(--text)" }}
          >
            <span className="text-base">{t.emoji}</span>
            {t.msg}
          </div>
        ))}
      </div>

      {/* level-up modal */}
      {lvl && (
        <div className="absolute inset-0 z-[90] grid place-items-center bg-black/45" style={{ animation: "fadeIn .25s ease both" }}>
          <div className="levelup-pop mx-6 w-full max-w-xs rounded-[28px] px-6 py-8 text-center"
            style={{ background: "var(--surface)", border: `1px solid ${hexToRgba(accent, 0.5)}`, boxShadow: `0 0 70px ${hexToRgba(accent, 0.45)}` }}>
            <div
              className="anim-floaty mx-auto grid h-20 w-20 place-items-center rounded-[26px] text-4xl"
              style={{ background: `linear-gradient(150deg, ${accent}, ${hexToRgba(accent, 0.5)})` }}
            >
              {lvl.level >= 10 ? "👑" : lvl.level >= 5 ? "⚡" : "⭐"}
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: accent }}>
              Level up
            </p>
            <p className="mt-1 text-[40px] font-extrabold leading-none">Level {lvl.level}</p>
            <p className="mt-2 text-[15px] font-semibold" style={{ color: "var(--muted)" }}>
              {lvl.title}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
