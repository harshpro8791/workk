import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui";
import { hexToRgba } from "@/lib/accents";

const FEATURES = [
  { icon: "install", title: "Installs like a native app", body: "Home-screen icon, splash screen, standalone window — no Play Store needed." },
  { icon: "bolt", title: "Works fully offline", body: "Everything runs on-device and saves to local storage. Airplane mode friendly." },
  { icon: "phone", title: "Android-native feel", body: "Material-style nav bar, haptic check-ins, wake-lock during focus sessions." },
  { icon: "stats", title: "Streaks & insights", body: "Consistency heatmap, per-habit rates and focus-hour tracking built in." },
];

export default function PhoneFrame({
  children,
  accent,
  canInstall,
  onInstall,
}: {
  children: ReactNode;
  accent: string;
  canInstall: boolean;
  onInstall: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const calc = () => setScale(Math.max(0.62, Math.min(1, (window.innerHeight - 56) / 788)));
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#05070c] text-white">
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full blur-[120px]"
          style={{ background: hexToRgba(accent, 0.35) }}
        />
        <div className="absolute -bottom-52 right-[-10%] h-[560px] w-[560px] rounded-full bg-cyan-500/15 blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: "58px 58px",
            maskImage: "radial-gradient(ellipse at 50% 20%, black, transparent 78%)",
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1220px] flex-col items-center gap-12 px-8 py-14 lg:flex-row lg:justify-between lg:gap-16 lg:py-10">
        {/* copy */}
        <div className="max-w-xl lg:flex-1">
          <div
            className="anim-fade-up inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold"
            style={{ borderColor: hexToRgba(accent, 0.45), background: hexToRgba(accent, 0.12), color: accent }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" style={{ background: accent }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: accent }} />
            </span>
            Progressive Web App · Android ready
          </div>

          <h1 className="anim-fade-up mt-6 text-[44px] font-bold leading-[1.05] tracking-tight sm:text-[58px]" style={{ animationDelay: "60ms" }}>
            Your habits,
            <br />
            <span
              style={{
                background: `linear-gradient(100deg, ${accent}, #ffffff 75%)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              installed on Android.
            </span>
          </h1>

          <p className="anim-fade-up mt-5 max-w-lg text-[16px] leading-relaxed text-white/65" style={{ animationDelay: "120ms" }}>
            Momentum is a full mobile app — habit streaks, a focus timer and insights — that installs
            straight to your home screen from the browser. Try it in the phone on the right.
          </p>

          <div className="anim-fade-up mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "180ms" }}>
            <button
              onClick={canInstall ? onInstall : () => setShowSteps((s) => !s)}
              className="press flex h-13 items-center gap-2 rounded-2xl px-6 py-3.5 text-[15px] font-semibold text-white"
              style={{ background: accent, boxShadow: `0 16px 40px ${hexToRgba(accent, 0.4)}` }}
            >
              <Icon name="install" size={19} strokeWidth={2.1} />
              {canInstall ? "Install app" : "How to install"}
            </button>
            <button
              onClick={copyLink}
              className="press flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 text-[15px] font-semibold text-white/90"
            >
              <Icon name={copied ? "check" : "share"} size={18} />
              {copied ? "Link copied" : "Send to my phone"}
            </button>
          </div>

          {showSteps && !canInstall && (
            <div className="anim-fade-up mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">
              <p className="mb-2 font-semibold text-white">Install on Android in 3 taps</p>
              <ol className="list-inside list-decimal space-y-1">
                <li>Open this page in Chrome on your phone.</li>
                <li>Tap the ⋮ menu, top right.</li>
                <li>Choose “Add to Home screen” → Install.</li>
              </ol>
            </div>
          )}

          <div className="anim-fade-up mt-10 grid gap-4 sm:grid-cols-2" style={{ animationDelay: "240ms" }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div
                  className="grid h-9 w-9 place-items-center rounded-xl"
                  style={{ background: hexToRgba(accent, 0.18), color: accent }}
                >
                  <Icon name={f.icon} size={17} />
                </div>
                <p className="mt-3 text-sm font-semibold">{f.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-white/55">{f.body}</p>
              </div>
            ))}
          </div>

          <p className="anim-fade-up mt-8 text-xs text-white/40" style={{ animationDelay: "300ms" }}>
            Need a Play Store listing? Wrap this same build with PWABuilder or Bubblewrap to get a
            signed <span className="text-white/70">.aab</span> Trusted Web Activity.
          </p>
        </div>

        {/* device */}
        <div
          className="anim-fade-up relative shrink-0"
          style={{ animationDelay: "140ms", width: 382 * scale, height: 788 * scale }}
        >
          <div
            className="relative"
            style={{ width: 382, height: 788, transform: `scale(${scale})`, transformOrigin: "top left" }}
          >
          <div
            className="absolute -inset-10 rounded-[70px] blur-3xl"
            style={{ background: hexToRgba(accent, 0.22) }}
          />
          <div className="anim-floaty relative">
            <div
              className="relative h-[788px] w-[382px] rounded-[46px] border border-white/15 bg-[#0a0c11] p-[9px]"
              style={{ boxShadow: "0 50px 120px rgba(0,0,0,0.65), inset 0 0 0 2px rgba(255,255,255,0.05)" }}
            >
              {/* side buttons */}
              <span className="absolute -right-[3px] top-[150px] h-16 w-[3px] rounded-l bg-white/20" />
              <span className="absolute -right-[3px] top-[232px] h-24 w-[3px] rounded-l bg-white/20" />
              <div className="relative h-full w-full overflow-hidden rounded-[38px]">{children}</div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
