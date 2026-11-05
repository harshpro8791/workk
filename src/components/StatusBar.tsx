import { useEffect, useState } from "react";

/** Simulated Android status bar — only rendered inside the desktop device frame. */
export default function StatusBar() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 20000);
    return () => clearInterval(id);
  }, []);

  const hh = time.getHours() % 12 || 12;
  const mm = `${time.getMinutes()}`.padStart(2, "0");

  return (
    <div
      className="relative z-30 flex h-9 shrink-0 items-center justify-between px-5 text-[12px] font-semibold"
      style={{ color: "var(--text)" }}
    >
      <span className="tabular-nums">
        {hh}:{mm}
      </span>
      <div className="absolute left-1/2 top-1.5 h-5 w-5 -translate-x-1/2 rounded-full bg-black/80 ring-1 ring-white/10" />
      <div className="flex items-center gap-1.5 opacity-90">
        {/* signal */}
        <svg width="15" height="12" viewBox="0 0 15 12" fill="currentColor" aria-hidden>
          <rect x="0" y="8" width="2.5" height="4" rx="1" opacity=".55" />
          <rect x="4" y="5.5" width="2.5" height="6.5" rx="1" opacity=".75" />
          <rect x="8" y="3" width="2.5" height="9" rx="1" />
          <rect x="12" y="0.5" width="2.5" height="11.5" rx="1" />
        </svg>
        {/* wifi */}
        <svg width="14" height="11" viewBox="0 0 14 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
          <path d="M1 3.6a9 9 0 0112 0M3.4 6.1a5.6 5.6 0 017.2 0" />
          <circle cx="7" cy="9" r="0.9" fill="currentColor" stroke="none" />
        </svg>
        {/* battery */}
        <svg width="22" height="11" viewBox="0 0 22 11" fill="none" aria-hidden>
          <rect x="0.6" y="0.6" width="18" height="9.8" rx="2.6" stroke="currentColor" strokeWidth="1.2" opacity=".6" />
          <rect x="2.2" y="2.2" width="12.5" height="6.6" rx="1.6" fill="currentColor" />
          <rect x="20" y="3.6" width="1.6" height="3.8" rx="0.8" fill="currentColor" opacity=".6" />
        </svg>
      </div>
    </div>
  );
}
