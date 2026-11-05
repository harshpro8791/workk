import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";

/* ------------------------------- Icons ------------------------------- */

const PATHS: Record<string, ReactNode> = {
  today: (
    <>
      <rect x="3" y="4.5" width="18" height="16" rx="4" />
      <path d="M8 3v3M16 3v3M3.5 9.5h17" />
      <path d="M8.5 14.5l2.2 2.2 4.3-4.3" />
    </>
  ),
  habits: (
    <>
      <path d="M4 6.5h2M4 12h2M4 17.5h2" />
      <path d="M9.5 6.5H20M9.5 12H20M9.5 17.5H20" />
    </>
  ),
  focus: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2M9.5 2.5h5" />
    </>
  ),
  stats: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 14.5a1.6 1.6 0 00.32 1.77l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.6 1.6 0 00-1.77-.32 1.6 1.6 0 00-.97 1.46V21a2 2 0 11-4 0v-.11a1.6 1.6 0 00-1.05-1.46 1.6 1.6 0 00-1.77.32l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.6 1.6 0 00.32-1.77 1.6 1.6 0 00-1.46-.97H3a2 2 0 110-4h.11a1.6 1.6 0 001.46-1.05 1.6 1.6 0 00-.32-1.77l-.06-.06a2 2 0 112.83-2.83l.06.06a1.6 1.6 0 001.77.32H9a1.6 1.6 0 00.97-1.46V3a2 2 0 114 0v.11a1.6 1.6 0 00.97 1.46 1.6 1.6 0 001.77-.32l.06-.06a2 2 0 112.83 2.83l-.06.06a1.6 1.6 0 00-.32 1.77V9a1.6 1.6 0 001.46.97H21a2 2 0 110 4h-.11a1.6 1.6 0 00-1.49.53z" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="M4.5 12.5l5 5 10-11" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  trash: (
    <>
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="M6 7l1 12.5A2 2 0 009 21.5h6a2 2 0 002-2L18 7M9.5 7V4.5h5V7" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h4l11-11a2.5 2.5 0 10-3.5-3.5L4.5 16.5 4 20z" />
    </>
  ),
  chevron: <path d="M9 5l7 7-7 7" />,
  back: <path d="M15 5l-7 7 7 7" />,
  install: (
    <>
      <path d="M12 3v12M7.5 10.5L12 15l4.5-4.5" />
      <path d="M4 17.5V19a2 2 0 002 2h12a2 2 0 002-2v-1.5" />
    </>
  ),
  flame: (
    <path d="M12 22c4 0 6.5-2.6 6.5-6 0-4.4-4-6-4.5-10-2 1.5-3 3.4-3 5.2 0 1.2-.8 2-1.7 1.4-.7-.5-1-1.3-1-2.3C6.6 12 5.5 13.6 5.5 16c0 3.4 2.5 6 6.5 6z" />
  ),
  play: <path d="M7 4.5l12 7.5-12 7.5z" />,
  pause: <path d="M8.5 5v14M15.5 5v14" />,
  reset: (
    <>
      <path d="M4 12a8 8 0 108-8 8 8 0 00-5.7 2.4L4 8.5" />
      <path d="M4 4v4.5h4.5" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" />,
  share: (
    <>
      <path d="M12 15V3.5M8 7l4-3.5L16 7" />
      <path d="M5 13v6.5a1.5 1.5 0 001.5 1.5h11a1.5 1.5 0 001.5-1.5V13" />
    </>
  ),
  bolt: <path d="M13.5 2L5 13.5h5.5L9.5 22 19 10h-5.7z" />,
  sparkle: (
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
  ),
  dots: (
    <>
      <circle cx="12" cy="5" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="12" cy="19" r="1.4" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.2 2" />
    </>
  ),
  phone: (
    <>
      <rect x="6" y="2.5" width="12" height="19" rx="3" />
      <path d="M10.5 5.5h3" />
    </>
  ),
};

export function Icon({
  name,
  size = 22,
  className,
  fill = false,
  strokeWidth = 1.8,
}: {
  name: keyof typeof PATHS | string;
  size?: number;
  className?: string;
  fill?: boolean;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? "currentColor" : "none"}
      stroke={fill ? "none" : "currentColor"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name] ?? null}
    </svg>
  );
}

/* ----------------------------- Progress ring ----------------------------- */

export function Ring({
  progress,
  size = 168,
  stroke = 12,
  color,
  track = "var(--surface-3)",
  children,
}: {
  progress: number; // 0..1
  size?: number;
  stroke?: number;
  color: string;
  track?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          style={{ stroke: track }}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.2,0.8,0.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

/* ------------------------------ Bottom sheet ------------------------------ */

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) setMounted(true);
    else {
      const t = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!mounted) return null;
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <button
        aria-label="Close"
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/55 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        className={cn(
          "relative max-h-[86%] overflow-y-auto app-scroll no-scrollbar rounded-t-[28px] border-t px-5 pb-8 pt-3",
          open ? "anim-sheet" : "translate-y-full transition-transform duration-200",
        )}
        style={{
          background: "var(--surface)",
          borderColor: "var(--line)",
          boxShadow: "0 -20px 60px rgba(0,0,0,0.45)",
        }}
      >
        <div
          className="mx-auto mb-3 h-1.5 w-11 rounded-full"
          style={{ background: "var(--surface-3)" }}
        />
        {title && <h3 className="mb-4 text-lg font-semibold">{title}</h3>}
        {children}
      </div>
    </div>
  );
}

/* -------------------------------- Controls -------------------------------- */

export function Switch({
  checked,
  onChange,
  accent,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  accent: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="press relative h-7 w-12 shrink-0 rounded-full border transition-colors"
      style={{
        background: checked ? accent : "var(--surface-3)",
        borderColor: checked ? accent : "var(--line)",
      }}
    >
      <span
        className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow transition-all duration-200"
        style={{ left: checked ? 26 : 4 }}
      />
    </button>
  );
}

export function Card({
  children,
  className,
  style,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn("rounded-3xl border p-4", onClick && "press cursor-pointer", className)}
      style={{ background: "var(--surface)", borderColor: "var(--line)", ...style }}
    >
      {children}
    </div>
  );
}

/* ---------------------------- Animated number ---------------------------- */

export function AnimatedNumber({
  value,
  duration = 800,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const [disp, setDisp] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const start = from.current;
    const diff = value - start;
    if (diff === 0) return;
    const t0 = performance.now();
    let raf: number;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setDisp(Math.round(start + diff * e));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={className}>{disp}</span>;
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 mt-6 flex items-end justify-between px-1">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
        {children}
      </h2>
      {right}
    </div>
  );
}
