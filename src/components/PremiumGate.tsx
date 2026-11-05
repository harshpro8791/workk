import { useState } from "react";
import { Card } from "@/components/ui";
import { confetti, toast } from "@/components/effects";
import { formatExpiry, premiumActive, type GumroadResult, type PremiumLicense } from "@/lib/billing";
import { hexToRgba } from "@/lib/accents";
import { cn } from "@/utils/cn";

export default function PremiumGate({
  accent,
  premium,
  onUnlock,
  onUnlockGumroad,
  onReset,
  validate,
}: {
  accent: string;
  premium: PremiumLicense | null;
  onUnlock: (buyerId: string, code: string) => boolean;
  onUnlockGumroad: (key: string) => Promise<GumroadResult>;
  onReset: () => void;
  validate: (buyerId: string, code: string) => PremiumLicense | null;
}) {
  const [buyerId, setBuyerId] = useState("");
  const [code, setCode] = useState("");
  const [shake, setShake] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [busy, setBusy] = useState(false);

  const fail = (message: string) => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
    toast(message, "🚫");
  };

  const done = (tier: "lifetime" | "monthly") => {
    confetti(180, [accent, "#ffffff", "#ffc247"]);
    toast(tier === "lifetime" ? "Lifetime premium unlocked" : "Monthly premium unlocked", "🔓");
  };

  const tryUnlock = async () => {
    if (busy) return;
    // 1) Old-style ID + PASS (checked offline)
    const manual = validate(buyerId, code);
    if (manual) {
      onUnlock(buyerId, code);
      done(manual.tier);
      return;
    }
    // 2) Gumroad license key (checked online)
    if (!code.trim()) {
      fail("Enter your license key");
      return;
    }
    setBusy(true);
    const res = await onUnlockGumroad(code);
    setBusy(false);
    if (res.ok) done(res.license.tier);
    else fail(res.message);
  };

  return (
    <div className="h-full w-full overflow-y-auto app-scroll no-scrollbar px-4 pb-10 pt-2">
      <div className="mx-auto w-full max-w-[560px]">
        <header className="px-1 pt-4">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
            style={{ borderColor: hexToRgba(accent, 0.45), background: hexToRgba(accent, 0.12), color: accent }}
          >
            <span className="text-sm">💎</span>
            Premium access required
          </div>
          <h1 className="mt-4 text-[30px] font-bold leading-tight">Premium Habit Tracker</h1>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            Enter the <b>license key</b> you received after your purchase to unlock the app.
          </p>
        </header>

        <Card className={cn("mt-5 !py-4", shake && "wiggle")} style={{ borderColor: hexToRgba(accent, 0.32) }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: accent }}>
                Unlock premium
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                Paste your <b>license key</b> below. Internet is needed once to verify it.
              </p>
            </div>
            <span className="text-2xl">🔓</span>
          </div>
          <div className="mt-3 grid gap-2.5">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="License key"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              className="h-12 rounded-2xl border px-4 text-[15px] outline-none"
              style={{ background: "var(--surface-2)", borderColor: "var(--line)", color: "var(--text)" }}
            />
            <input
              value={buyerId}
              onChange={(e) => setBuyerId(e.target.value)}
              placeholder="Member ID (only if you were given an ID + PASS)"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="h-12 rounded-2xl border px-4 text-[15px] outline-none"
              style={{ background: "var(--surface-2)", borderColor: "var(--line)", color: "var(--text)" }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => void tryUnlock()}
              disabled={busy}
              className="press rounded-full px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: accent }}
            >
              {busy ? "Checking…" : "Unlock premium"}
            </button>
            <button
              onClick={() => setShowHelp((s) => !s)}
              className="press rounded-full border px-5 py-3 text-sm font-semibold"
              style={{ borderColor: "var(--line)" }}
            >
              {showHelp ? "Hide format" : "See code format"}
            </button>
          </div>
          {showHelp && (
            <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
              Your license key is in your purchase email / receipt and looks like{" "}
              <span style={{ color: "var(--text)" }}>XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX</span>. If you were given an
              ID + PASS instead, type the ID in the second box and the PASS in the first box.
            </p>
          )}
        </Card>

        {premium && (
          <Card className="mt-4 !py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: accent }}>
              Current status
            </p>
            <p className="mt-2 text-sm font-semibold">
              {premiumActive(premium) ? "Premium active" : "Premium expired"}
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              {formatExpiry(premium)} · {premium.tier === "lifetime" ? "Lifetime" : "Monthly"}
            </p>
            <button
              onClick={onReset}
              className="press mt-3 rounded-full border px-4 py-2 text-xs font-semibold"
              style={{ borderColor: "var(--line)" }}
            >
              Reset saved license
            </button>
          </Card>
        )}
      </div>
    </div>
  );
}
